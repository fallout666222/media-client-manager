import { useState } from 'react';
import { TimeSheetStatus, User } from '@/types/timesheet';
import { useToast } from '@/hooks/use-toast';
import { format, parse } from 'date-fns';
import { getWeekStatusNames, updateWeekStatus, getWeekStatuses } from '@/integrations/supabase/database';

interface UseTimeSheetStatusChangesProps {
  currentUser: User;
  viewedUser: User;
  currentDate: Date;
  customWeeks: any[];
  adminOverride?: boolean;
  isUserHead?: boolean;
  isViewingOwnTimesheet: boolean;
  weekHours: number;
  weekPercentage: number;
  weekStatuses: Record<string, TimeSheetStatus>;
  submittedWeeks: string[];
  setWeekStatuses: (statuses: Record<string, TimeSheetStatus> | ((prev: Record<string, TimeSheetStatus>) => Record<string, TimeSheetStatus>)) => void;
  setSubmittedWeeks: (weeks: string[] | ((prev: string[]) => string[])) => void;
  timeEntries: Record<string, Record<string, Record<string, { hours: number; status: TimeSheetStatus }>>>;
  setTimeEntries: (entries: any) => void;
  getCurrentWeekStatus: (weekKey: string) => TimeSheetStatus;
  getTotalHoursForWeek: () => number;
  findFirstUnsubmittedWeek: () => string | null;
  checkEarlierWeeksUnderReview?: (weekId: string) => boolean;
}

export const useTimeSheetStatusChanges = ({
  currentUser,
  viewedUser,
  currentDate,
  customWeeks,
  adminOverride = false,
  isUserHead = false,
  isViewingOwnTimesheet,
  weekHours,
  weekPercentage,
  weekStatuses,
  submittedWeeks,
  setWeekStatuses,
  setSubmittedWeeks,
  timeEntries,
  setTimeEntries,
  getCurrentWeekStatus,
  getTotalHoursForWeek,
  findFirstUnsubmittedWeek,
  checkEarlierWeeksUnderReview
}: UseTimeSheetStatusChangesProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const refreshWeekStatuses = async () => {
    try {
      const { data } = await getWeekStatuses(viewedUser.id);
      
      if (data && data.length > 0) {
        const newStatuses: Record<string, TimeSheetStatus> = {};
        const newSubmitted: string[] = [];
        
        data.forEach(statusEntry => {
          if (statusEntry.week && statusEntry.status) {
            const weekKey = statusEntry.week.period_from;
            newStatuses[weekKey] = statusEntry.status.name as TimeSheetStatus;
            
            if (statusEntry.status.name === 'under-review' || statusEntry.status.name === 'accepted') {
              newSubmitted.push(weekKey);
            }
          }
        });
        
        setWeekStatuses(newStatuses);
        setSubmittedWeeks(newSubmitted);
      }
    } catch (error) {
      console.error('Error refreshing week statuses:', error);
    }
  };

  const hasUnsubmittedEarlierWeek = () => {
    if (!customWeeks.length) return false;
    
    const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
    const currentCustomWeek = customWeeks.find(week => 
      format(new Date(week.period_from), 'yyyy-MM-dd') === currentWeekKey
    );
    
    if (!currentCustomWeek) return false;
    
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
    
    const currentIndex = sortedWeeks.findIndex(week => week.id === currentCustomWeek.id);
    if (currentIndex <= 0) return false; // First week or week not found
    
    const userFirstWeek = customWeeks.find(week => week.id === viewedUser.firstCustomWeekId);
    const userFirstWeekIndex = userFirstWeek ? 
      sortedWeeks.findIndex(week => week.id === userFirstWeek.id) : 0;
    
    for (let i = userFirstWeekIndex; i < currentIndex; i++) {
      const weekKey = sortedWeeks[i].period_from;
      const weekStatus = weekStatuses[weekKey];
      
      if (weekKey && (weekStatus === 'unconfirmed' || weekStatus === 'needs-revision' || !weekStatus)) {
        console.log(`Found earlier unsubmitted week: ${sortedWeeks[i].name}, status: ${weekStatus || 'unconfirmed'}`);
        return true;
      }
    }
    
    return false;
  };

  const handleSubmitForReview = async () => {
    const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
    const currentCustomWeek = customWeeks.find(week => 
      format(new Date(week.period_from), 'yyyy-MM-dd') === currentWeekKey
    );
    
    if (!currentCustomWeek) {
      toast({
        title: "Error",
        description: "Could not find current week data",
        variant: "destructive"
      });
      return;
    }
    
    if (!isViewingOwnTimesheet && !adminOverride && !isUserHead) {
      toast({
        title: "Access Denied",
        description: "You can only submit your own timesheets",
        variant: "destructive"
      });
      return;
    }
    
    if (hasUnsubmittedEarlierWeek() && !adminOverride) {
      toast({
        title: "Earlier Weeks Not Submitted",
        description: "Please submit earlier weeks first before submitting this week",
        variant: "destructive"
      });
      return;
    }
    
    const totalHours = getTotalHoursForWeek();
    const requiredHours = Math.round(weekHours * (weekPercentage / 100));
    
    if (totalHours < requiredHours && !adminOverride) {
      toast({
        title: "Insufficient Hours",
        description: `You need to log at least ${requiredHours} hours (currently: ${totalHours})`,
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const { data: statusNames } = await getWeekStatusNames();
      const underReviewStatus = statusNames?.find(status => status.name === 'under-review');
      
      if (underReviewStatus && viewedUser.id) {
        await updateWeekStatus(viewedUser.id, currentCustomWeek.id, underReviewStatus.id);
        
        setWeekStatuses(prev => ({
          ...prev,
          [currentWeekKey]: 'under-review' as TimeSheetStatus
        }));
        
        setSubmittedWeeks(prev => [...prev, currentWeekKey]);
        
        await refreshWeekStatuses();
        
        toast({
          title: "Success",
          description: "Timesheet submitted for review"
        });
      }
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      toast({
        title: "Error",
        description: "Failed to submit timesheet for review",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
    const currentCustomWeek = customWeeks.find(week => 
      format(new Date(week.period_from), 'yyyy-MM-dd') === currentWeekKey
    );
    
    if (!currentCustomWeek) {
      toast({
        title: "Error",
        description: "Could not find current week data",
        variant: "destructive"
      });
      return;
    }
    
    if (isUserHead && checkEarlierWeeksUnderReview) {
      const hasEarlierWeeks = checkEarlierWeeksUnderReview(currentCustomWeek.id);
      if (hasEarlierWeeks) {
        toast({
          title: "Error",
          description: "Please approve earlier weeks under review first",
          variant: "destructive"
        });
        return;
      }
    }
    
    try {
      setIsSubmitting(true);
      
      const { data: statusNames } = await getWeekStatusNames();
      const acceptedStatus = statusNames?.find(status => status.name === 'accepted');
      
      if (acceptedStatus && viewedUser.id) {
        await updateWeekStatus(viewedUser.id, currentCustomWeek.id, acceptedStatus.id);
        
        setWeekStatuses(prev => ({
          ...prev,
          [currentWeekKey]: 'accepted' as TimeSheetStatus
        }));
        
        await refreshWeekStatuses();
        
        toast({
          title: "Success",
          description: "Timesheet approved"
        });
      }
    } catch (error) {
      console.error('Error approving timesheet:', error);
      toast({
        title: "Error",
        description: "Failed to approve timesheet",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
    const currentCustomWeek = customWeeks.find(week => 
      format(new Date(week.period_from), 'yyyy-MM-dd') === currentWeekKey
    );
    
    if (!currentCustomWeek) {
      toast({
        title: "Error",
        description: "Could not find current week data",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const { data: statusNames } = await getWeekStatusNames();
      const needsRevisionStatus = statusNames?.find(status => status.name === 'needs-revision');
      
      if (needsRevisionStatus && viewedUser.id) {
        await updateWeekStatus(viewedUser.id, currentCustomWeek.id, needsRevisionStatus.id);
        
        setWeekStatuses(prev => ({
          ...prev,
          [currentWeekKey]: 'needs-revision' as TimeSheetStatus
        }));
        
        setSubmittedWeeks(prev => prev.filter(week => week !== currentWeekKey));
        
        await refreshWeekStatuses();
        
        toast({
          title: "Success",
          description: "Timesheet sent back for revision"
        });
      }
    } catch (error) {
      console.error('Error rejecting timesheet:', error);
      toast({
        title: "Error",
        description: "Failed to reject timesheet",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnToUnconfirmed = async () => {
    const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
    const currentCustomWeek = customWeeks.find(week => 
      format(new Date(week.period_from), 'yyyy-MM-dd') === currentWeekKey
    );
    
    if (!currentCustomWeek) {
      toast({
        title: "Error",
        description: "Could not find current week data",
        variant: "destructive"
      });
      return;
    }
    
    if (!adminOverride) {
      toast({
        title: "Access Denied",
        description: "This action requires admin override mode",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const { data: statusNames } = await getWeekStatusNames();
      const unconfirmedStatus = statusNames?.find(status => status.name === 'unconfirmed');
      
      if (unconfirmedStatus && viewedUser.id) {
        await updateWeekStatus(viewedUser.id, currentCustomWeek.id, unconfirmedStatus.id);
        
        setWeekStatuses(prev => ({
          ...prev,
          [currentWeekKey]: 'unconfirmed' as TimeSheetStatus
        }));
        
        setSubmittedWeeks(prev => prev.filter(week => week !== currentWeekKey));
        
        await refreshWeekStatuses();
        
        toast({
          title: "Success",
          description: "Week returned to unconfirmed status"
        });
      }
    } catch (error) {
      console.error('Error returning week to unconfirmed status:', error);
      toast({
        title: "Error",
        description: "Failed to return week to unconfirmed status",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSubmitForReview,
    handleApprove,
    handleReject,
    handleReturnToUnconfirmed,
    isSubmitting
  };
};
