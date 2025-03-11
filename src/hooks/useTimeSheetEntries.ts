
import { useState, useEffect } from 'react';
import { format, parse, isBefore } from 'date-fns';
import { TimeSheetStatus, TimeSheetData, User } from '@/types/timesheet';
import { getWeekHours } from '@/integrations/supabase/database';

interface UseTimeSheetEntriesProps {
  viewedUser: User;
  currentDate: Date;
  customWeeks: any[];
  firstWeek: string;
  getCurrentWeekStatus: (weekKey: string) => TimeSheetStatus;
}

export const useTimeSheetEntries = ({
  viewedUser,
  currentDate,
  customWeeks,
  firstWeek,
  getCurrentWeekStatus
}: UseTimeSheetEntriesProps) => {
  const [timeEntries, setTimeEntries] = useState<Record<string, TimeSheetData>>({});

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
  }, [viewedUser, currentDate, customWeeks, firstWeek, getCurrentWeekStatus]);

  // Helper function
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

  return {
    timeEntries,
    setTimeEntries,
  };
};
