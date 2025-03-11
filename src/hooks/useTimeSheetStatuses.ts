
import { useState, useEffect } from 'react';
import { TimeSheetStatus, User } from '@/types/timesheet';
import { getWeekStatuses } from '@/integrations/supabase/database';

interface UseTimeSheetStatusesProps {
  viewedUser: User;
  customWeeks: any[];
}

export const useTimeSheetStatuses = ({
  viewedUser,
  customWeeks
}: UseTimeSheetStatusesProps) => {
  const [weekStatuses, setWeekStatuses] = useState<Record<string, TimeSheetStatus>>({});
  const [submittedWeeks, setSubmittedWeeks] = useState<string[]>([]);

  // Load week statuses
  useEffect(() => {
    const loadWeekStatuses = async () => {
      if (viewedUser.id && customWeeks.length > 0) {
        try {
          const { data } = await getWeekStatuses(viewedUser.id);
          
          if (data && data.length > 0) {
            const statuses: Record<string, TimeSheetStatus> = {};
            const submitted: string[] = [];
            
            data.forEach(statusEntry => {
              if (statusEntry.week && statusEntry.status) {
                const weekKey = statusEntry.week.period_from;
                statuses[weekKey] = statusEntry.status.name as TimeSheetStatus;
                
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

  const getCurrentWeekStatus = (weekKey: string): TimeSheetStatus => {
    return weekStatuses[weekKey] || 'unconfirmed';
  };

  return {
    weekStatuses,
    setWeekStatuses,
    submittedWeeks,
    setSubmittedWeeks,
    getCurrentWeekStatus
  };
};
