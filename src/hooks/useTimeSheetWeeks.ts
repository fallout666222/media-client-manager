
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

  const getUserWeeks = () => {
    const DEFAULT_WEEKS = [
      { id: "1", startDate: "2025-01-01", endDate: "2025-01-06", hours: 48 },
      { id: "2", startDate: "2025-01-10", endDate: "2025-01-03", hours: 40 },
      { id: "3", startDate: "2025-01-13", endDate: "2025-01-17", hours: 40 },
      { id: "4", startDate: "2025-01-20", endDate: "2025-01-24", hours: 40 },
      { id: "5", startDate: "2025-01-27", endDate: "2025-01-31", hours: 40 },
    ];
    
    const firstWeekDate = parse(firstWeek, 'yyyy-MM-dd', new Date());
    return DEFAULT_WEEKS.filter(week => {
      const weekStartDate = parse(week.startDate, 'yyyy-MM-dd', new Date());
      return !isBefore(weekStartDate, firstWeekDate);
    }).sort((a, b) => {
      const dateA = parse(a.startDate, 'yyyy-MM-dd', new Date());
      const dateB = parse(b.startDate, 'yyyy-MM-dd', new Date());
      return dateA.getTime() - dateB.getTime();
    });
  };

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
        
        const userWeeks = sortedWeeks.filter(week => {
          try {
            const weekDate = parse(week.period_from, 'yyyy-MM-dd', new Date());
            return !isBefore(weekDate, userFirstWeekDate as Date);
          } catch (error) {
            console.error(`Error parsing date ${week.period_from}:`, error);
            return false;
          }
        });
        
        // Debug logging to see what weeks and statuses we're checking
        console.log("Available weeks to check:", userWeeks.map(w => 
          `${w.name} (${w.period_from}) - Status: ${weekStatuses[w.period_from] || 'undefined'}`
        ));
        
        for (const week of userWeeks) {
          const weekKey = week.period_from;
          const weekStatus = weekStatuses[weekKey];
          
          console.log(`Checking week ${week.name} (${weekKey}): Status = ${weekStatus || 'undefined'}`);
          
          // Check for both 'unconfirmed' and 'needs-revision' status
          if (weekStatus === 'unconfirmed' || weekStatus === 'needs-revision') {
            console.log(`Found first unsubmitted/needs revision week: ${week.name} (${week.period_from}), status: ${weekStatus}`);
            return {
              date: parse(week.period_from, 'yyyy-MM-dd', new Date()),
              weekData: week
            };
          }
        }
      }
    }
    
    // Only check default weeks if not in admin override mode
    // and ensure null is returned if no unconfirmed week is found
    if (!adminOverride) {
      const userWeeks = getUserWeeks();
      for (const week of userWeeks) {
        const weekKey = week.startDate;
        if (!submittedWeeks.includes(weekKey)) {
          return {
            date: parse(weekKey, 'yyyy-MM-dd', new Date()),
            weekData: week
          };
        }
      }
    }
    
    // Return null explicitly when no unconfirmed week is found
    console.log("No unconfirmed weeks found");
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
    
    // Debug what statuses we have in the weekStatuses object
    console.log("Available weekStatuses:", Object.entries(weekStatuses).map(([key, value]) => 
      `${key}: ${value}`
    ));
    
    const firstUnsubmitted = findFirstUnsubmittedWeek();
    console.log("Result from findFirstUnsubmittedWeek:", firstUnsubmitted);
    
    if (firstUnsubmitted && firstUnsubmitted.date && firstUnsubmitted.weekData) {
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
        title: "Navigated to First Unconfirmed Week",
        description: `Showing week of ${format(firstUnsubmitted.date, 'MMM d, yyyy')}`,
      });
    } else {
      toast({
        title: "No Unconfirmed Weeks",
        description: adminOverride 
          ? "There are no unconfirmed or needs-revision weeks in the database for this user" 
          : "All your weeks have been submitted or are under review",
      });
      // Don't navigate to a non-existent week or change the current custom week
      console.log("No unconfirmed weeks found, staying on current week");
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
    
    if (selectedWeek) {
      return selectedWeek.required_hours;
    } else {
      const defaultWeek = getUserWeeks().find(w => 
        format(parse(w.startDate, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') === weekKey
      );
      return defaultWeek?.hours || 40;
    }
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
    getUserWeeks,
    findFirstUnsubmittedWeek,
    findFirstUnderReviewWeek,
    handleReturnToFirstUnsubmittedWeek,
    handleNavigateToFirstUnderReviewWeek,
    findWeekHours,
    hasUnsubmittedEarlierWeek,
    isCurrentWeekSubmitted
  };
};
