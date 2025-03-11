
import { useEffect } from 'react';
import { format, parse } from 'date-fns';
import { User } from '@/types/timesheet';
import {
  getUserVisibleClients,
  getUserVisibleTypes,
  getWeekStatusNames,
  getWeekStatuses,
  getWeekPercentages,
  getWeekHours,
} from '@/integrations/supabase/database';

export const useTimeSheetEffects = ({
  currentUser,
  viewedUser,
  currentDate,
  customWeeks,
  setSelectedClients,
  setSelectedMediaTypes,
  setWeekStatuses,
  setSubmittedWeeks,
  setWeekPercentage,
  setTimeEntries,
  getCurrentWeekStatus,
  firstWeek
}: {
  currentUser: User;
  viewedUser: User;
  currentDate: Date;
  customWeeks: any[];
  setSelectedClients: (clients: string[]) => void;
  setSelectedMediaTypes: (types: string[]) => void;
  setWeekStatuses: (statuses: any) => void;
  setSubmittedWeeks: (weeks: string[]) => void;
  setWeekPercentage: (percentage: number) => void;
  setTimeEntries: (entries: any) => void;
  getCurrentWeekStatus: (weekKey: string) => any;
  firstWeek: string;
}) => {
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
          const { data } = await getWeekStatuses(viewedUser.id);
          
          if (data && data.length > 0) {
            const statuses: Record<string, any> = {};
            const submitted: string[] = [];
            
            data.forEach(statusEntry => {
              if (statusEntry.week && statusEntry.status) {
                const weekKey = statusEntry.week.period_from;
                statuses[weekKey] = statusEntry.status.name;
                
                if (statusEntry.status.name === 'under-review' || statusEntry.status.name === 'accepted') {
                  submitted.push(weekKey);
                }
              }
            });
            
            setWeekStatuses(statuses);
            setSubmittedWeeks(submitted);
          }
        } catch (error) {
          console.error('Error loading week statuses:', error);
        }
      }
    };
    
    loadWeekStatuses();
  }, [viewedUser.id, customWeeks]);

  // Load week percentage and time entries
  useEffect(() => {
    const fetchWeekData = async () => {
      if (!viewedUser.id || !customWeeks.length) return;
      
      const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
      const currentCustomWeek = customWeeks.find(week => 
        format(parse(week.period_from, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') === currentWeekKey
      );
      
      if (currentCustomWeek) {
        try {
          // Fetch week percentage
          const { data: percentages } = await getWeekPercentages(viewedUser.id);
          if (percentages && percentages.length > 0) {
            const currentPercentage = percentages.find(wp => wp.week_id === currentCustomWeek.id);
            if (currentPercentage) {
              setWeekPercentage(Number(currentPercentage.percentage));
            }
          }

          // Fetch time entries
          const { data: hourEntries } = await getWeekHours(viewedUser.id, currentCustomWeek.id);
          if (hourEntries && hourEntries.length > 0) {
            const entries: Record<string, any> = {};
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
            setTimeEntries({ [currentWeekKey]: {} });
          }
        } catch (error) {
          console.error('Error fetching week data:', error);
        }
      }
    };
    
    fetchWeekData();
  }, [viewedUser.id, currentDate, customWeeks]);
};
