
import { useToast } from '@/hooks/use-toast';
import { format, parse, isSameDay } from 'date-fns';
import { 
  getWeekStatusNames, 
  updateWeekStatus,
  getClients,
  getMediaTypes,
  updateWeekHours
} from '@/integrations/supabase/database';
import { TimeSheetStatus, User } from '@/types/timesheet';

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
  findFirstUnsubmittedWeek: () => { date: Date; weekData: any } | null;
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
  const { toast } = useToast();

  const handleSubmitForReview = async () => {
    if (!isViewingOwnTimesheet && !adminOverride && !isUserHead) return;
    
    const firstUnsubmittedWeek = findFirstUnsubmittedWeek();
    const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
    const totalHours = getTotalHoursForWeek();
    
    const effectiveHours = Math.round(weekHours * (weekPercentage / 100));
    const remainingHours = effectiveHours - totalHours;
    
    if (remainingHours !== 0 && !adminOverride && !isUserHead) {
      toast({
        title: "Cannot Submit Timesheet",
        description: `You must fill in exactly ${effectiveHours} hours for this week (${weekPercentage}% of ${weekHours}). Remaining: ${remainingHours} hours`,
        variant: "destructive"
      });
      return;
    }
    
    if (firstUnsubmittedWeek && !isSameDay(firstUnsubmittedWeek.date, currentDate) && !adminOverride && !isUserHead) {
      toast({
        title: "Cannot Submit This Week",
        description: `Week not submitted because previous weeks haven't been filled in yet.`,
        variant: "destructive"
      });
      
      return;
    }

    try {
      const currentWeekData = customWeeks.find(week => 
        format(parse(week.period_from, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') === currentWeekKey
      );
      
      if (currentWeekData && viewedUser.id) {
        const { data: statusNames } = await getWeekStatusNames();
        const underReviewStatus = statusNames?.find(status => status.name === 'under-review');
        
        if (underReviewStatus) {
          console.log(`Updating week status for user ${viewedUser.id}, week ${currentWeekData.id} to under-review (${underReviewStatus.id})`);
          const updateResult = await updateWeekStatus(viewedUser.id, currentWeekData.id, underReviewStatus.id);
          
          if (updateResult.error) {
            console.error("Error updating week status:", updateResult.error);
            toast({
              title: "Error Updating Status",
              description: "Failed to update timesheet status. Please try again.",
              variant: "destructive"
            });
            return;
          }
          
          const weekEntries = timeEntries[currentWeekKey] || {};
          const { data: clientsData } = await getClients();
          const { data: mediaTypesData } = await getMediaTypes();
          
          console.log("Saving time entries for week:", currentWeekData.id);
          
          for (const clientName in weekEntries) {
            const mediaEntries = weekEntries[clientName];
            const clientObj = clientsData?.find(c => c.name === clientName);
            
            if (clientObj) {
              for (const mediaTypeName in mediaEntries) {
                const entry = mediaEntries[mediaTypeName];
                const mediaTypeObj = mediaTypesData?.find(m => m.name === mediaTypeName);
                
                if (mediaTypeObj && entry && typeof entry.hours === 'number' && entry.hours > 0) {
                  console.log(`Saving hours for ${clientName}/${mediaTypeName}: ${entry.hours}`);
                  await updateWeekHours(
                    viewedUser.id, 
                    currentWeekData.id, 
                    clientObj.id, 
                    mediaTypeObj.id, 
                    entry.hours
                  );
                }
              }
            }
          }
          
          setWeekStatuses((prev: Record<string, TimeSheetStatus>) => {
            const newStatuses: Record<string, TimeSheetStatus> = {
              ...prev,
              [currentWeekKey]: 'under-review' as TimeSheetStatus
            };
            return newStatuses;
          });
          
          setSubmittedWeeks((prev: string[]) => {
            if (!prev.includes(currentWeekKey)) {
              return [...prev, currentWeekKey];
            }
            return prev;
          });
          
          const updatedEntries = { ...timeEntries };
          if (updatedEntries[currentWeekKey]) {
            for (const client in updatedEntries[currentWeekKey]) {
              for (const mediaType in updatedEntries[currentWeekKey][client]) {
                if (updatedEntries[currentWeekKey][client][mediaType]) {
                  updatedEntries[currentWeekKey][client][mediaType].status = 'under-review';
                }
              }
            }
            setTimeEntries(updatedEntries);
          }
          
          toast({
            title: "Timesheet Under Review",
            description: `Week of ${format(currentDate, 'MMM d, yyyy')} has been submitted and is now under review`,
          });
        }
      }
    } catch (error) {
      console.error('Error updating week status:', error);
      toast({
        title: "Error",
        description: "Failed to update timesheet status",
        variant: "destructive"
      });
    }
  };

  const handleApprove = async () => {
    if (!adminOverride && !isUserHead) return;
    
    const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
    
    try {
      const currentWeekData = customWeeks.find(week => 
        format(parse(week.period_from, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') === currentWeekKey
      );
      
      if (currentWeekData && viewedUser.id) {
        if (isUserHead && checkEarlierWeeksUnderReview && currentWeekData.id) {
          const hasEarlierWeeks = checkEarlierWeeksUnderReview(currentWeekData.id);
          if (hasEarlierWeeks) {
            toast({
              title: "Cannot Approve",
              description: "Earlier weeks must be approved first",
              variant: "destructive"
            });
            return;
          }
        }
        
        const { data: statusNames } = await getWeekStatusNames();
        const acceptedStatus = statusNames?.find(status => status.name === 'accepted');
        
        if (acceptedStatus) {
          await updateWeekStatus(viewedUser.id, currentWeekData.id, acceptedStatus.id);
          
          setWeekStatuses((prev: Record<string, TimeSheetStatus>) => {
            const newStatuses: Record<string, TimeSheetStatus> = {
              ...prev,
              [currentWeekKey]: 'accepted' as TimeSheetStatus
            };
            return newStatuses;
          });
          
          toast({
            title: "Timesheet Approved",
            description: `Week of ${format(currentDate, 'MMM d, yyyy')} has been approved`,
          });
        }
      }
    } catch (error) {
      console.error('Error approving timesheet:', error);
      toast({
        title: "Error",
        description: "Failed to approve timesheet",
        variant: "destructive"
      });
    }
  };

  const handleReject = async () => {
    if (!adminOverride && !isUserHead) return;
    
    const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
    const currentStatus = getCurrentWeekStatus(currentWeekKey);
    
    try {
      const currentWeekData = customWeeks.find(week => 
        format(parse(week.period_from, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') === currentWeekKey
      );
      
      if (currentWeekData && viewedUser.id) {
        const { data: statusNames } = await getWeekStatusNames();
        
        const targetStatusName = (currentStatus === 'accepted' && adminOverride) ? 'unconfirmed' : 'needs-revision';
        const targetStatus = statusNames?.find(status => status.name === targetStatusName);
        
        if (targetStatus) {
          await updateWeekStatus(viewedUser.id, currentWeekData.id, targetStatus.id);
          
          setWeekStatuses((prev: Record<string, TimeSheetStatus>) => {
            return {
              ...prev,
              [currentWeekKey]: targetStatusName as TimeSheetStatus
            };
          });
          
          if (currentStatus === 'accepted' || currentStatus === 'under-review') {
            setSubmittedWeeks((prev: string[]) => {
              return prev.filter(week => week !== currentWeekKey);
            });
          }
          
          const message = currentStatus === 'accepted' ? 
            `Week of ${format(currentDate, 'MMM d, yyyy')} reverted to unconfirmed` : 
            `Week of ${format(currentDate, 'MMM d, yyyy')} needs revision`;
          
          toast({
            title: currentStatus === 'accepted' ? "Timesheet Reverted" : "Timesheet Rejected",
            description: message,
          });
        }
      }
    } catch (error) {
      console.error('Error rejecting/reverting timesheet:', error);
      toast({
        title: "Error",
        description: "Failed to process timesheet action",
        variant: "destructive"
      });
    }
  };

  return {
    handleSubmitForReview,
    handleApprove,
    handleReject
  };
};
