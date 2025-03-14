
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
          console.log(`Using ${weeksData.length} custom weeks from props`);
        } else {
          const { data } = await getCustomWeeks();
          weeksData = data || [];
          console.log(`Fetched ${weeksData.length} custom weeks from database`);
        }
        
        setCustomWeeks(weeksData);
        
        const savedWeekId = viewedUserId ? localStorage.getItem(`selectedWeek_${viewedUserId}`) : null;
        
        if (savedWeekId && weeksData.length > 0) {
          const savedWeek = weeksData.find((week: any) => week.id === savedWeekId);
          if (savedWeek) {
            console.log(`Setting to saved week from localStorage: ${savedWeek.name}`);
            setCurrentDate(parse(savedWeek.period_from, 'yyyy-MM-dd', new Date()));
            setCurrentCustomWeek(savedWeek);
            setWeekHours(savedWeek.required_hours);
            return;
          }
        }
        
        if (initialWeekId && weeksData.length > 0) {
          const initialWeek = weeksData.find((week: any) => week.id === initialWeekId);
          if (initialWeek) {
            console.log(`Setting initial week to: ${initialWeek.name}`);
            setCurrentDate(parse(initialWeek.period_from, 'yyyy-MM-dd', new Date()));
            setCurrentCustomWeek(initialWeek);
            setWeekHours(initialWeek.required_hours);
          }
        } else if (currentUser.firstCustomWeekId) {
          const userFirstWeek = weeksData.find((week: any) => week.id === currentUser.firstCustomWeekId);
          if (userFirstWeek) {
            setCurrentDate(parse(userFirstWeek.period_from, 'yyyy-MM-dd', new Date()));
            setCurrentCustomWeek(userFirstWeek);
            setWeekHours(userFirstWeek.required_hours);
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
        console.log(`Date changed to ${currentDateFormatted}, updating current week to: ${matchingWeek.name} (${matchingWeek.id})`);
        setCurrentCustomWeek(matchingWeek);
        setLocalCurrentCustomWeek(matchingWeek);
        setWeekHours(matchingWeek.required_hours);
        
        if (viewedUserId) {
          localStorage.setItem(`selectedWeek_${viewedUserId}`, matchingWeek.id);
          console.log(`Saved week ${matchingWeek.id} to localStorage for user ${viewedUserId}`);
        }
      }
    }
  }, [currentDate, customWeeks, currentCustomWeek, viewedUserId, setCurrentCustomWeek, setWeekHours]);

  return {
    customWeeks
  };
};
