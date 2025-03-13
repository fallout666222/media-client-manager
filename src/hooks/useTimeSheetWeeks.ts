import { useState } from 'react';
import { format, parse, isBefore, isSameDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { TimeSheetStatus, User } from '@/types/timesheet';
import { getWeekStatusNames, updateWeekStatus } from '@/integrations/supabase/database';

interface UseTimeSheetWeeksProps {
  currentUser: User;
  viewedUser: User;
  currentDate: Date;
  customWeeks: any[];
  adminOverride?: boolean;
  weekStatuses: Record<string, TimeSheetStatus>;
  submittedWeeks: string[];
  firstWeek: string;
  setCurrentDate: (date: Date) => void;
  setCurrentCustomWeek: (week: any) => void;
  getTotalHoursForWeek: () => number;
  weekHours: number;
  weekPercentage: number;
}

export const useTimeSheetWeeks = ({
  currentUser,
  viewedUser,
  currentDate,
  customWeeks,
  adminOverride = false,
  weekStatuses,
  submittedWeeks,
  firstWeek,
  setCurrentDate,
  setCurrentCustomWeek,
  getTotalHoursForWeek,
  weekHours,
  weekPercentage
}: UseTimeSheetWeeksProps) => {
  const { toast } = useToast();

  const findFirstUnsubmittedWeek = () => {
    if (customWeeks.length > 0) {
      let userFirstWeekDate: Date | null = null;
      
      if (viewedUser.firstCustomWeekId) {
        const userFirstCustomWeek = customWeeks.find(week => week.id === viewedUser.firstCustomWeekId);
        if (userFirstCustomWeek) {
          try {
            userFirstWeekDate = parse(userFirstCustomWeek.period_from, 'yyyy-MM-dd', new Date());
          } catch (error) {
            console.error(`Error parsing date ${userFirstCustomWeek.period_from}:`, error);
          }
        }
      } else if (viewedUser.firstWeek) {
        try {
          userFirstWeekDate = parse(viewedUser.firstWeek, 'yyyy-MM-dd', new Date());
        } catch (error) {
          console.error(`Error parsing date ${viewedUser.firstWeek}:`, error);
        }
      }
      
      if (userFirstWeekDate) {
        const availableWeeks = customWeeks.filter(week => {
          try {
            const weekDate = parse(week.period_from, 'yyyy-MM-dd', new Date());
            return !isBefore(weekDate, userFirstWeekDate as Date);
          } catch (error) {
            console.error(`Error parsing date ${week.period_from}:`, error);
            return false;
          }
        });
        
        const sortedWeeks = [...availableWeeks].sort((a, b) => {
          try {
            const dateA = parse(a.period_from, 'yyyy-MM-dd', new Date());
            const dateB = parse(b.period_from, 'yyyy-MM-dd', new Date());
            return dateA.getTime() - dateB.getTime();
          } catch (error) {
            console.error(`Error parsing dates during week sorting:`, error);
            return 0;
          }
        });
        
        console.log("All available weeks:", sortedWeeks.map(w => 
          `${w.name} (${w.period_from}) - Status: ${weekStatuses[w.period_from] || 'undefined'}`
        ));
        
        const needsRevisionWeek = sortedWeeks.find(week => {
          const weekKey = week.period_from;
          return weekStatuses[weekKey] === 'needs-revision';
        });
        
        if (needsRevisionWeek) {
          console.log(`Found needs-revision week: ${needsRevisionWeek.name} (${needsRevisionWeek.period_from}), status: ${weekStatuses[needsRevisionWeek.period_from]}`);
          return {
            date: parse(needsRevisionWeek.period_from, 'yyyy-MM-dd', new Date()),
            weekData: needsRevisionWeek
          };
        }
        
        const unconfirmedWeek = sortedWeeks.find(week => {
          const weekKey = week.period_from;
          return weekStatuses[weekKey] === 'unconfirmed';
        });
        
        if (unconfirmedWeek) {
          console.log(`Found unconfirmed week: ${unconfirmedWeek.name} (${unconfirmedWeek.period_from}), status: ${weekStatuses[unconfirmedWeek.period_from]}`);
          return {
            date: parse(unconfirmedWeek.period_from, 'yyyy-MM-dd', new Date()),
            weekData: unconfirmedWeek
          };
        }
      }
    }
    
    return null;
  };

  const findFirstUnderReviewWeek = () => {
    if (customWeeks.length > 0) {
      const sortedWeeks = [...customWeeks].sort((a, b) => {
        const dateA = parse(a.period_from, 'yyyy-MM-dd', new Date());
        const dateB = parse(b.period_from, 'yyyy-MM-dd', new Date());
        return dateA.getTime() - dateB.getTime();
      });
      
      for (const week of sortedWeeks) {
        const weekKey = week.period_from;
        if (weekStatuses[weekKey] === 'under-review') {
          return {
            date: parse(weekKey, 'yyyy-MM-dd', new Date()),
            weekData: week
          };
        }
      }
    }
    
    return null;
  };

  const handleReturnToFirstUnsubmittedWeek = () => {
    console.log("Executing handleReturnToFirstUnsubmittedWeek");
    
    console.log("Available weekStatuses:", Object.entries(weekStatuses).map(([key, value]) => 
      `${key}: ${value}`
    ));
    
    const firstUnsubmitted = findFirstUnsubmittedWeek();
    console.log("Result from findFirstUnsubmittedWeek:", firstUnsubmitted);
    
    if (firstUnsubmitted) {
      if (firstUnsubmitted.weekData) {
        console.log(`Setting current custom week to: ${firstUnsubmitted.weekData.name}`);
        if ('required_hours' in firstUnsubmitted.weekData) {
          setCurrentCustomWeek(firstUnsubmitted.weekData);
        } else {
          setCurrentCustomWeek(null);
        }
      }
      
      console.log(`Navigating to date: ${format(firstUnsubmitted.date, 'yyyy-MM-dd')}`);
      setCurrentDate(firstUnsubmitted.date);
      
      if (viewedUser.id && firstUnsubmitted.weekData) {
        localStorage.setItem(`selectedWeek_${viewedUser.id}`, firstUnsubmitted.weekData.id || '');
        console.log(`Saved week ${firstUnsubmitted.weekData.id} to localStorage for user ${viewedUser.id}`);
      }
      
      toast({
        title: "Navigated to First Unconfirmed/Needs Revision Week",
        description: `Showing week of ${format(firstUnsubmitted.date, 'MMM d, yyyy')}`,
      });
    } else {
      toast({
        title: "No Unconfirmed Weeks",
        description: adminOverride 
          ? "There are no unconfirmed or needs-revision weeks in the database for this user" 
          : "All your weeks have been submitted or are under review",
      });
    }
  };

  const handleNavigateToFirstUnderReviewWeek = () => {
    const firstUnderReview = findFirstUnderReviewWeek();
    if (firstUnderReview) {
      setCurrentDate(firstUnderReview.date);
      
      if (firstUnderReview.weekData) {
        if ('required_hours' in firstUnderReview.weekData) {
          setCurrentCustomWeek(firstUnderReview.weekData);
        } else {
          setCurrentCustomWeek(null);
        }
      }
      
      toast({
        title: "Navigated to First Week Under Review",
        description: `Showing week of ${format(firstUnderReview.date, 'MMM d, yyyy')}`,
      });
    } else {
      toast({
        title: "No Weeks Under Review",
        description: "There are no weeks currently under review",
      });
    }
  };

  const findWeekHours = (date: Date) => {
    const weekKey = format(date, 'yyyy-MM-dd');
    const selectedWeek = customWeeks.find(week => 
      format(parse(week.period_from, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') === weekKey
    );
    
    return selectedWeek ? selectedWeek.required_hours : 40; // Default to 40 if no custom week found
  };

  const hasUnsubmittedEarlierWeek = () => {
    if (!customWeeks.length || !viewedUser.id) return false;
    
    const userFirstWeek = customWeeks.find(week => week.id === viewedUser.firstCustomWeekId);
    if (!userFirstWeek) return false;
    
    const sortedWeeks = [...customWeeks].sort((a, b) => {
      try {
        const dateA = parse(a.period_from, 'yyyy-MM-dd', new Date());
        const dateB = parse(b.period_from, 'yyyy-MM-dd', new Date());
        return dateA.getTime() - dateB.getTime();
      } catch (error) {
        console.error(`Error parsing dates during week sorting:`, error);
        return 0;
      }
    });
    
    const currentWeek = customWeeks.find(week => {
      try {
        const weekDate = parse(week.period_from, 'yyyy-MM-dd', new Date());
        return isSameDay(weekDate, currentDate);
      } catch (error) {
        console.error(`Error parsing date ${week.period_from}:`, error);
        return false;
      }
    });
    
    if (!currentWeek) return false;
    
    const currentIndex = sortedWeeks.findIndex(week => week.id === currentWeek.id);
    if (currentIndex <= 0) return false; // First week or week not found
    
    const userFirstWeekIndex = sortedWeeks.findIndex(week => week.id === userFirstWeek.id);
    if (userFirstWeekIndex === -1) return false;
    
    for (let i = userFirstWeekIndex; i < currentIndex; i++) {
      const weekKey = sortedWeeks[i].period_from;
      const weekStatus = weekStatuses[weekKey];
      
      if (weekKey && (weekStatus === 'unconfirmed' || weekStatus === 'needs-revision' || !weekStatus)) {
        return true;
      }
    }
    
    return false;
  };

  const isCurrentWeekSubmitted = () => {
    const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
    return submittedWeeks.includes(currentWeekKey) || 
           weekStatuses[currentWeekKey] === 'under-review' || 
           weekStatuses[currentWeekKey] === 'accepted';
  };

  return {
    findFirstUnsubmittedWeek,
    findFirstUnderReviewWeek,
    handleReturnToFirstUnsubmittedWeek,
    handleNavigateToFirstUnderReviewWeek,
    findWeekHours,
    hasUnsubmittedEarlierWeek,
    isCurrentWeekSubmitted
  };
};
