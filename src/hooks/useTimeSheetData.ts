
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { parse, format, isSameDay, isBefore } from 'date-fns';
import { TimeSheetStatus, TimeSheetData, User, TimeEntry } from '@/types/timesheet';
import { 
  getCustomWeeks, 
  getWeekHours, 
  getWeekStatusNames,
  getWeekStatuses,
  getWeekPercentages,
  getUserVisibleClients,
  getUserVisibleTypes,
  getClients,
  getMediaTypes
} from '@/integrations/supabase/database';

interface TimeSheetDataHookProps {
  currentUser: User;
  viewedUser: User;
  currentDate: Date;
  customWeeks: any[];
  initialWeekId: string | null;
  firstWeek: string;
  userRole: 'admin' | 'user' | 'manager';
  adminOverride?: boolean;
}

export const useTimeSheetData = ({
  currentUser,
  viewedUser,
  currentDate,
  customWeeks,
  initialWeekId,
  firstWeek,
  userRole,
  adminOverride = false
}: TimeSheetDataHookProps) => {
  const [timeEntries, setTimeEntries] = useState<Record<string, TimeSheetData>>({});
  const [submittedWeeks, setSubmittedWeeks] = useState<string[]>([]);
  const [weekStatuses, setWeekStatuses] = useState<Record<string, TimeSheetStatus>>({});
  const [weekPercentage, setWeekPercentage] = useState<number>(100);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedMediaTypes, setSelectedMediaTypes] = useState<string[]>([]);
  const { toast } = useToast();

  // Load user visible clients and types
  useEffect(() => {
    const fetchUserVisibles = async () => {
      if (currentUser.id) {
        try {
          const { data: visibleClientsData } = await getUserVisibleClients(currentUser.id);
          if (visibleClientsData) {
            const clientNames = visibleClientsData.map(vc => vc.client.name);
            setSelectedClients(clientNames);
          }
          
          const { data: visibleTypesData } = await getUserVisibleTypes(currentUser.id);
          if (visibleTypesData) {
            const typeNames = visibleTypesData.map(vt => vt.type.name);
            setSelectedMediaTypes(typeNames);
          }
        } catch (error) {
          console.error('Error fetching user visibles:', error);
        }
      }
    };
    
    fetchUserVisibles();
  }, [currentUser.id]);

  // Load week statuses
  useEffect(() => {
    const loadWeekStatuses = async () => {
      if (viewedUser.id && customWeeks.length > 0) {
        try {
          console.log(`Loading week statuses for user ${viewedUser.id}`);
          const { data } = await getWeekStatuses(viewedUser.id);
          
          if (data && data.length > 0) {
            console.log(`Found ${data.length} week status entries`);
            const statuses: Record<string, TimeSheetStatus> = {};
            const submitted: string[] = [];
            
            data.forEach(statusEntry => {
              if (statusEntry.week && statusEntry.status) {
                const weekKey = statusEntry.week.period_from;
                const statusName = statusEntry.status.name as TimeSheetStatus;
                statuses[weekKey] = statusName;
                console.log(`Week ${statusEntry.week.name} (${weekKey}): Status = ${statusName}`);
                
                if (statusName === 'under-review' || statusName === 'accepted') {
                  submitted.push(weekKey);
                }
              }
            });
            
            console.log("All week statuses:", statuses);
            setWeekStatuses(statuses);
            setSubmittedWeeks(submitted);
          } else {
            console.log("No week status data found");
          }
        } catch (error) {
          console.error('Error loading week statuses:', error);
        }
      }
    };
    
    loadWeekStatuses();
  }, [viewedUser.id, customWeeks, currentDate]); // Added currentDate to refresh when dates change

  // Load week percentage
  useEffect(() => {
    const fetchWeekPercentage = async () => {
      if (!viewedUser.id || !customWeeks.length) return;
      
      const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
      const currentCustomWeek = customWeeks.find(week => 
        format(parse(week.period_from, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') === currentWeekKey
      );
      
      if (!currentCustomWeek) {
        setWeekPercentage(100);
        return;
      }
      
      try {
        const { data } = await getWeekPercentages(viewedUser.id);
        if (data && data.length > 0) {
          const currentWeekPercentage = data.find(wp => 
            wp.week_id === currentCustomWeek.id
          );
          
          if (currentWeekPercentage) {
            setWeekPercentage(Number(currentWeekPercentage.percentage));
          } else {
            const sortedWeeks = [...customWeeks].sort((a, b) => {
              const dateA = new Date(a.period_from);
              const dateB = new Date(b.period_from);
              return dateA.getTime() - dateB.getTime();
            });
            
            const currentWeekIndex = sortedWeeks.findIndex(week => 
              week.id === currentCustomWeek.id
            );
            
            if (currentWeekIndex > 0) {
              for (let i = currentWeekIndex - 1; i >= 0; i--) {
                const prevWeek = sortedWeeks[i];
                const prevWeekPercentage = data.find(wp => 
                  wp.week_id === prevWeek.id
                );
                
                if (prevWeekPercentage) {
                  setWeekPercentage(Number(prevWeekPercentage.percentage));
                  break;
                }
              }
            } else {
              setWeekPercentage(100);
            }
          }
        } else {
          setWeekPercentage(100);
        }
      } catch (error) {
        console.error('Error fetching week percentage:', error);
        setWeekPercentage(100);
      }
    };
    
    fetchWeekPercentage();
  }, [viewedUser.id, currentDate, customWeeks]);

  // Load time entries
  useEffect(() => {
    const loadUserData = async () => {
      if (viewedUser.id) {
        try {
          const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
          
          let weekId = null;
          const customWeek = customWeeks.find(week => 
            format(parse(week.period_from, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') === currentWeekKey
          );
          
          if (customWeek) {
            weekId = customWeek.id;
          } else {
            const userWeeks = getUserWeeks(firstWeek);
            const defaultWeek = userWeeks.find(w => 
              format(parse(w.startDate, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') === currentWeekKey
            );
            if (defaultWeek) {
              weekId = defaultWeek.id;
            }
          }
          
          if (weekId) {
            console.log(`Loading time entries for user ${viewedUser.id}, week ${weekId}`);
            const { data: hourEntries } = await getWeekHours(viewedUser.id, weekId);
            
            if (hourEntries && hourEntries.length > 0) {
              console.log(`Found ${hourEntries.length} time entries`);
              const entries: Record<string, TimeSheetData> = {};
              entries[currentWeekKey] = {};
              
              hourEntries.forEach(entry => {
                if (entry.client && entry.media_type) {
                  if (!entries[currentWeekKey][entry.client.name]) {
                    entries[currentWeekKey][entry.client.name] = {};
                  }
                  
                  entries[currentWeekKey][entry.client.name][entry.media_type.name] = {
                    hours: entry.hours,
                    status: getCurrentWeekStatus(currentWeekKey)
                  };
                }
              });
              
              setTimeEntries(entries);
            } else {
              console.log('No time entries found for this week');
              setTimeEntries({
                [currentWeekKey]: {}
              });
            }
          }
        } catch (error) {
          console.error('Error loading timesheet data:', error);
        }
      }
    };
    
    loadUserData();
  }, [viewedUser, currentDate, customWeeks]);

  // Helper functions
  const getUserWeeks = (firstWeekDate: string) => {
    const DEFAULT_WEEKS = [
      { id: "1", startDate: "2025-01-01", endDate: "2025-01-06", hours: 48 },
      { id: "2", startDate: "2025-01-10", endDate: "2025-01-03", hours: 40 },
      { id: "3", startDate: "2025-01-13", endDate: "2025-01-17", hours: 40 },
      { id: "4", startDate: "2025-01-20", endDate: "2025-01-24", hours: 40 },
      { id: "5", startDate: "2025-01-27", endDate: "2025-01-31", hours: 40 },
    ];
    
    const parsedFirstWeek = parse(firstWeekDate, 'yyyy-MM-dd', new Date());
    return DEFAULT_WEEKS.filter(week => {
      const weekStartDate = parse(week.startDate, 'yyyy-MM-dd', new Date());
      return !isBefore(weekStartDate, parsedFirstWeek);
    }).sort((a, b) => {
      const dateA = parse(a.startDate, 'yyyy-MM-dd', new Date());
      const dateB = parse(b.startDate, 'yyyy-MM-dd', new Date());
      return dateA.getTime() - dateB.getTime();
    });
  };

  const getCurrentWeekStatus = (weekKey: string): TimeSheetStatus => {
    console.log(`Getting status for week ${weekKey}: ${weekStatuses[weekKey] || 'unconfirmed'}`);
    return weekStatuses[weekKey] || 'unconfirmed';
  };

  return {
    timeEntries,
    setTimeEntries,
    submittedWeeks,
    setSubmittedWeeks,
    weekStatuses,
    setWeekStatuses,
    weekPercentage,
    selectedClients,
    setSelectedClients,
    selectedMediaTypes,
    setSelectedMediaTypes,
    getCurrentWeekStatus
  };
};
