import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { parse, format, isSameDay, isBefore } from 'date-fns';
import { 
  updateWeekHours, 
  updateWeekStatus, 
  getWeekStatusNames,
  getClients,
  getMediaTypes,
  addUserVisibleClient,
  addUserVisibleType,
  removeUserVisibleClient,
  removeUserVisibleType,
  updateVisibleClientsOrder,
  updateVisibleTypesOrder,
  getUserVisibleClients,
  getUserVisibleTypes
} from '@/integrations/supabase/database';
import { User, TimeSheetStatus } from '@/types/timesheet';

interface UseTimeSheetActionsProps {
  currentUser: User;
  viewedUser: User;
  currentDate: Date;
  customWeeks: any[];
  userRole: 'admin' | 'user' | 'manager';
  adminOverride?: boolean;
  weekHours: number;
  isUserHead?: boolean;
  isViewingOwnTimesheet: boolean;
  firstWeek: string;
  setCurrentDate: (date: Date) => void;
  weekPercentage: number;
  weekStatuses: Record<string, TimeSheetStatus>;
  submittedWeeks: string[];
  setWeekStatuses: (statuses: Record<string, TimeSheetStatus> | ((prev: Record<string, TimeSheetStatus>) => Record<string, TimeSheetStatus>)) => void;
  setSubmittedWeeks: (weeks: string[] | ((prev: string[]) => string[])) => void;
  timeEntries: Record<string, Record<string, { hours?: number | undefined }>>;
  setTimeEntries: (entries: any) => void;
  getCurrentWeekStatus: (weekKey: string) => TimeSheetStatus;
  checkEarlierWeeksUnderReview?: (weekId: string) => boolean;
}

export const useTimeSheetActions = ({
  currentUser,
  viewedUser,
  currentDate,
  customWeeks,
  userRole,
  adminOverride = false,
  weekHours,
  isUserHead = false,
  isViewingOwnTimesheet,
  firstWeek,
  setCurrentDate,
  weekPercentage,
  weekStatuses,
  submittedWeeks,
  setWeekStatuses,
  setSubmittedWeeks,
  timeEntries,
  setTimeEntries,
  getCurrentWeekStatus,
  checkEarlierWeeksUnderReview
}: UseTimeSheetActionsProps) => {
  const { toast } = useToast();
  const [currentCustomWeek, setCurrentCustomWeek] = useState<any>(null);

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
          userFirstWeekDate = parse(userFirstCustomWeek.period_from, 'yyyy-MM-dd', new Date());
        }
      } else if (viewedUser.firstWeek) {
        userFirstWeekDate = parse(viewedUser.firstWeek, 'yyyy-MM-dd', new Date());
      }
      
      if (userFirstWeekDate) {
        const sortedWeeks = [...customWeeks].sort((a, b) => {
          const dateA = parse(a.period_from, 'yyyy-MM-dd', new Date());
          const dateB = parse(b.period_from, 'yyyy-MM-dd', new Date());
          return dateA.getTime() - dateB.getTime();
        });
        
        const userWeeks = sortedWeeks.filter(week => {
          const weekDate = parse(week.period_from, 'yyyy-MM-dd', new Date());
          return !isBefore(weekDate, userFirstWeekDate as Date);
        });
        
        for (const week of userWeeks) {
          if (!submittedWeeks.includes(week.period_from)) {
            console.log(`Found first unsubmitted week: ${week.name} (${week.period_from})`);
            return {
              date: parse(week.period_from, 'yyyy-MM-dd', new Date()),
              weekData: week
            };
          }
        }
      }
    }
    
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

  const getTotalHoursForWeek = (): number => {
    const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
    const weekEntries = timeEntries[currentWeekKey] || {};
    
    return Object.values(weekEntries).reduce((clientSum: number, mediaEntries) => {
      return clientSum + Object.values(mediaEntries).reduce((mediaSum: number, entry) => {
        return mediaSum + (typeof entry.hours === 'number' ? entry.hours : 0);
      }, 0);
    }, 0);
  };

  const handleReturnToFirstUnsubmittedWeek = () => {
    const firstUnsubmitted = findFirstUnsubmittedWeek();
    if (firstUnsubmitted) {
      setCurrentDate(firstUnsubmitted.date);
      
      if (firstUnsubmitted.weekData) {
        if ('required_hours' in firstUnsubmitted.weekData) {
          setCurrentCustomWeek(firstUnsubmitted.weekData);
        } else {
          setCurrentCustomWeek(null);
        }
      }
      
      toast({
        title: "Navigated to First Unsubmitted Week",
        description: `Showing week of ${format(firstUnsubmitted.date, 'MMM d, yyyy')}`,
      });
    } else {
      toast({
        title: "No Unsubmitted Weeks",
        description: adminOverride 
          ? "There are no unsubmitted weeks in the database for this user" 
          : "All your weeks have been submitted",
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

  const handleTimeUpdate = async (client: string, mediaType: string, hours: number) => {
    if ((viewedUser.id !== currentUser.id) && !adminOverride && !isUserHead) return;
    
    const currentTotal = getTotalHoursForWeek();
    const existingHours = timeEntries[format(currentDate, 'yyyy-MM-dd')]?.[client]?.[mediaType]?.hours || 0;
    const newTotalHours = currentTotal - existingHours + hours;
    
    if (newTotalHours > weekHours && !adminOverride) {
      toast({
        title: "Cannot Add Hours",
        description: `Total hours cannot exceed ${weekHours} for this week`,
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (viewedUser.id) {
        const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
        let weekId = null;
        
        const customWeek = customWeeks.find(week => 
          format(parse(week.period_from, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') === currentWeekKey
        );
        
        if (customWeek) {
          weekId = customWeek.id;
        } else {
          const defaultWeek = getUserWeeks().find(w => 
            format(parse(w.startDate, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') === currentWeekKey
          );
          if (defaultWeek) {
            weekId = defaultWeek.id;
          }
        }
        
        if (weekId) {
          console.log(`Updating hours for week ${weekId}, client ${client}, media ${mediaType}: ${hours}`);
          
          const { data: clientsData } = await getClients();
          const { data: mediaTypesData } = await getMediaTypes();
          
          const clientObj = clientsData?.find(c => c.name === client);
          const mediaTypeObj = mediaTypesData?.find(m => m.name === mediaType);
          
          if (clientObj && mediaTypeObj) {
            await updateWeekHours(viewedUser.id, weekId, clientObj.id, mediaTypeObj.id, hours);
            console.log('Hours updated successfully');
          } else {
            console.error('Client or media type not found', { client, mediaType, clientObj, mediaTypeObj });
          }
        }
      }
      
      const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
      
      setTimeEntries(prev => {
        const newEntries = { ...prev };
        
        if (!newEntries[currentWeekKey]) {
          newEntries[currentWeekKey] = {};
        }
        
        if (!newEntries[currentWeekKey][client]) {
          newEntries[currentWeekKey][client] = {};
        }
        
        newEntries[currentWeekKey][client][mediaType] = { 
          hours, 
          status: getCurrentWeekStatus(currentWeekKey) 
        };
        
        return newEntries;
      });
    } catch (error) {
      console.error('Error updating hours:', error);
      toast({
        title: "Error",
        description: "Failed to update hours",
        variant: "destructive"
      });
    }
  };

  const handleSubmitForReview = async () => {
    if (!isViewingOwnTimesheet && !adminOverride) return;
    
    const firstUnsubmittedWeek = findFirstUnsubmittedWeek();
    const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
    const totalHours = getTotalHoursForWeek();
    
    const effectiveHours = Math.round(weekHours * (weekPercentage / 100));
    const remainingHours = effectiveHours - totalHours;
    
    if (remainingHours !== 0 && !adminOverride) {
      toast({
        title: "Cannot Submit Timesheet",
        description: `You must fill in exactly ${effectiveHours} hours for this week (${weekPercentage}% of ${weekHours}). Remaining: ${remainingHours} hours`,
        variant: "destructive"
      });
      return;
    }
    
    if (firstUnsubmittedWeek && !isSameDay(firstUnsubmittedWeek.date, currentDate) && !adminOverride) {
      toast({
        title: "Cannot Submit This Week",
        description: `Week not submitted because previous weeks haven't been filled in yet.`,
        variant: "destructive"
      });
      
      setCurrentDate(firstUnsubmittedWeek.date);
      return;
    }

    try {
      const currentWeekData = customWeeks.find(week => 
        format(parse(week.period_from, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') === currentWeekKey
      ) || getUserWeeks().find(w => 
        format(parse(w.startDate, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') === currentWeekKey
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
                
                if (mediaTypeObj && entry.hours > 0) {
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
      ) || getUserWeeks().find(w => 
        format(parse(w.startDate, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') === currentWeekKey
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
      ) || getUserWeeks().find(w => 
        format(parse(w.startDate, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') === currentWeekKey
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

  const handleSaveVisibleClients = async (clients: string[]) => {
    if (!currentUser.id) return;
    
    try {
      const { data: clientsData } = await getClients();
      if (!clientsData) return;
      
      const { data: currentVisible } = await getUserVisibleClients(currentUser.id);
      
      const clientMap = new Map(clientsData.map(c => [c.name, c.id]));
      
      for (const clientName of clients) {
        const clientId = clientMap.get(clientName);
        
        if (clientId && !currentVisible?.some(v => v.client_id === clientId)) {
          await addUserVisibleClient(currentUser.id, clientId);
        }
      }
      
      if (currentVisible) {
        for (const visible of currentVisible) {
          const client = clientsData.find(c => c.id === visible.client_id);
          
          if (client && !clients.includes(client.name)) {
            await removeUserVisibleClient(visible.id);
          }
        }
      }
      
      await updateVisibleClientsOrder(currentUser.id, clients);
      
      toast({
        title: "Visible Clients Updated",
        description: "Your visible clients have been updated",
      });
    } catch (error) {
      console.error('Error updating visible clients:', error);
      toast({
        title: "Error",
        description: "Failed to update visible clients",
        variant: "destructive"
      });
    }
  };

  const handleSaveVisibleMediaTypes = async (types: string[]) => {
    if (!currentUser.id) return;
    
    try {
      const { data: mediaTypesData } = await getMediaTypes();
      if (!mediaTypesData) return;
      
      const { data: currentVisible } = await getUserVisibleTypes(currentUser.id);
      
      const typeMap = new Map(mediaTypesData.map(t => [t.name, t.id]));
      
      for (const typeName of types) {
        const typeId = typeMap.get(typeName);
        
        if (typeId && !currentVisible?.some(v => v.type_id === typeId)) {
          await addUserVisibleType(currentUser.id, typeId);
        }
      }
      
      if (currentVisible) {
        for (const visible of currentVisible) {
          const type = mediaTypesData.find(t => t.id === visible.type_id);
          
          if (type && !types.includes(type.name)) {
            await removeUserVisibleType(visible.id);
          }
        }
      }
      
      await updateVisibleTypesOrder(currentUser.id, types);
      
      toast({
        title: "Visible Media Types Updated",
        description: "Your visible media types have been updated",
      });
    } catch (error) {
      console.error('Error updating visible media types:', error);
      toast({
        title: "Error",
        description: "Failed to update visible media types",
        variant: "destructive"
      });
    }
  };

  return {
    handleReturnToFirstUnsubmittedWeek,
    handleNavigateToFirstUnderReviewWeek,
    handleTimeUpdate,
    handleSubmitForReview,
    handleApprove,
    handleReject,
    handleSaveVisibleClients,
    handleSaveVisibleMediaTypes,
    getTotalHoursForWeek,
    hasUnsubmittedEarlierWeek: () => {
      if (!customWeeks.length || !currentCustomWeek) return false;
      
      const userFirstWeek = customWeeks.find(week => week.id === viewedUser.firstCustomWeekId);
      if (!userFirstWeek) return false;
      
      const sortedWeeks = [...customWeeks].sort((a, b) => {
        const dateA = parse(a.period_from, 'yyyy-MM-dd', new Date());
        const dateB = parse(b.period_from, 'yyyy-MM-dd', new Date());
        return dateA.getTime() - dateB.getTime();
      });
      
      const currentIndex = sortedWeeks.findIndex(week => week.id === currentCustomWeek.id);
      if (currentIndex <= 0) return false; // First week or week not found
      
      const userFirstWeekIndex = sortedWeeks.findIndex(week => week.id === userFirstWeek.id);
      if (userFirstWeekIndex === -1) return false;
      
      for (let i = userFirstWeekIndex; i < currentIndex; i++) {
        const weekKey = sortedWeeks[i].period_from;
        if (weekKey && !submittedWeeks.includes(weekKey)) {
          return true;
        }
      }
      
      return false;
    },
    isCurrentWeekSubmitted: () => {
      const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
      return submittedWeeks.includes(currentWeekKey) || 
             weekStatuses[currentWeekKey] === 'under-review' || 
             weekStatuses[currentWeekKey] === 'accepted';
    },
    findWeekHours: (date: Date) => {
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
    },
    setCurrentCustomWeek,
    currentCustomWeek
  };
};
