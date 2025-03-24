
import { useState, useEffect } from 'react';
import { format, parse } from 'date-fns';
import { User } from '@/types/timesheet';
import { getCustomWeeks } from '@/integrations/supabase/database';
import { useToast } from '@/hooks/use-toast';

interface UseTimeSheetInitializationProps {
  currentUser: User;
  viewedUser: User;
  viewedUserId: string;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  setCurrentCustomWeek: (week: any) => void;
  setWeekHours: (hours: number) => void;
  propCustomWeeks?: any[];
  initialWeekId?: string | null;
}

export const useTimeSheetInitialization = ({
  currentUser,
  viewedUser,
  viewedUserId,
  currentDate,
  setCurrentDate,
  setCurrentCustomWeek,
  setWeekHours,
  propCustomWeeks,
  initialWeekId
}: UseTimeSheetInitializationProps) => {
  const [customWeeks, setCustomWeeks] = useState<any[]>([]);
  const [currentCustomWeek, setLocalCurrentCustomWeek] = useState<any>(null);
  const { toast } = useToast();

  // Initialize custom weeks
  useEffect(() => {
    const fetchCustomWeeks = async () => {
      try {
        let weeksData;
        
        if (propCustomWeeks && propCustomWeeks.length > 0) {
          weeksData = propCustomWeeks;
        } else {
          const { data } = await getCustomWeeks();
          weeksData = data || [];
        }
        
        // Only use database weeks, not hardcoded ones
        if (weeksData.length > 0) {
          setCustomWeeks(weeksData);
          
          // Check for redirectToWeek that might have been set on login
          const redirectWeek = localStorage.getItem('redirectToWeek');
          if (redirectWeek) {
            try {
              const { weekId, date } = JSON.parse(redirectWeek);
              if (weekId) {
                const targetWeek = weeksData.find((week: any) => week.id === weekId);
                if (targetWeek) {
                  console.log(`Redirecting to week ${targetWeek.name} from login`);
                  setCurrentDate(parse(targetWeek.period_from, 'yyyy-MM-dd', new Date()));
                  setCurrentCustomWeek(targetWeek);
                  setWeekHours(targetWeek.required_hours);
                  
                  // Only remove redirect flag after successfully navigating
                  localStorage.removeItem('redirectToWeek');
                  
                  // Update selectedWeek in localStorage
                  if (viewedUserId) {
                    localStorage.setItem(`selectedWeek_${viewedUserId}`, weekId);
                  }
                  return;
                }
              }
            } catch (error) {
              console.error('Error parsing redirectToWeek:', error);
              localStorage.removeItem('redirectToWeek');
            }
          }
          
          // If no redirect or redirect failed, try saved week
          const savedWeekId = viewedUserId ? localStorage.getItem(`selectedWeek_${viewedUserId}`) : null;
          
          if (savedWeekId) {
            const savedWeek = weeksData.find((week: any) => week.id === savedWeekId);
            if (savedWeek) {
              console.log(`Loading saved week ${savedWeek.name} for user ${viewedUserId}`);
              setCurrentDate(parse(savedWeek.period_from, 'yyyy-MM-dd', new Date()));
              setCurrentCustomWeek(savedWeek);
              setWeekHours(savedWeek.required_hours);
              return;
            }
          }
          
          // Try initialWeekId if provided
          if (initialWeekId) {
            const initialWeek = weeksData.find((week: any) => week.id === initialWeekId);
            if (initialWeek) {
              setCurrentDate(parse(initialWeek.period_from, 'yyyy-MM-dd', new Date()));
              setCurrentCustomWeek(initialWeek);
              setWeekHours(initialWeek.required_hours);
              return;
            }
          }
          
          // Default to user's first custom week if available
          if (currentUser.firstCustomWeekId) {
            const userFirstWeek = weeksData.find((week: any) => week.id === currentUser.firstCustomWeekId);
            if (userFirstWeek) {
              setCurrentDate(parse(userFirstWeek.period_from, 'yyyy-MM-dd', new Date()));
              setCurrentCustomWeek(userFirstWeek);
              setWeekHours(userFirstWeek.required_hours);
              return;
            }
          }
          
          // As a last resort, use the first week in the dataset
          if (weeksData.length > 0) {
            const firstWeek = weeksData[0];
            setCurrentDate(parse(firstWeek.period_from, 'yyyy-MM-dd', new Date()));
            setCurrentCustomWeek(firstWeek);
            setWeekHours(firstWeek.required_hours);
          }
        }
      } catch (error) {
        console.error('Error fetching custom weeks:', error);
      }
    };
    
    fetchCustomWeeks();
  }, [currentUser.firstCustomWeekId, propCustomWeeks, initialWeekId, viewedUserId, setCurrentDate, setCurrentCustomWeek, setWeekHours]);

  // Update current week when date changes
  useEffect(() => {
    if (customWeeks.length > 0) {
      const currentDateFormatted = format(currentDate, 'yyyy-MM-dd');
      
      const matchingWeek = customWeeks.find(week => 
        week.period_from === currentDateFormatted
      );
      
      if (matchingWeek && (!currentCustomWeek || matchingWeek.id !== currentCustomWeek.id)) {
        setCurrentCustomWeek(matchingWeek);
        setLocalCurrentCustomWeek(matchingWeek);
        setWeekHours(matchingWeek.required_hours);
        
        if (viewedUserId) {
          localStorage.setItem(`selectedWeek_${viewedUserId}`, matchingWeek.id);
        }
      }
    }
  }, [currentDate, customWeeks, currentCustomWeek, viewedUserId, setCurrentCustomWeek, setWeekHours]);

  return {
    customWeeks
  };
};
