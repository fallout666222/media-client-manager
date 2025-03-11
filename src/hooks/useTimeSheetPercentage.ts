
import { useState, useEffect } from 'react';
import { format, parse, isBefore } from 'date-fns';
import { User } from '@/types/timesheet';
import { getWeekPercentages } from '@/integrations/supabase/database';

interface UseTimeSheetPercentageProps {
  viewedUser: User;
  currentDate: Date;
  customWeeks: any[];
}

export const useTimeSheetPercentage = ({
  viewedUser,
  currentDate,
  customWeeks
}: UseTimeSheetPercentageProps) => {
  const [weekPercentage, setWeekPercentage] = useState<number>(100);

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

  return {
    weekPercentage,
    setWeekPercentage
  };
};
