
import { useToast } from '@/hooks/use-toast';
import { format, parse } from 'date-fns';
import { 
  getClients, 
  getMediaTypes, 
  updateWeekHours 
} from '@/integrations/supabase/database';
import { TimeSheetStatus, User } from '@/types/timesheet';

interface UseTimeEntryOperationsProps {
  currentUser: User;
  viewedUser: User;
  currentDate: Date;
  customWeeks: any[];
  adminOverride?: boolean;
  isUserHead?: boolean;
  isViewingOwnTimesheet: boolean;
  weekHours: number;
  weekPercentage: number;
  timeEntries: Record<string, Record<string, Record<string, { hours: number; status: TimeSheetStatus }>>>;
  setTimeEntries: (entries: any) => void;
  getCurrentWeekStatus: (weekKey: string) => TimeSheetStatus;
}

export const useTimeEntryOperations = ({
  currentUser,
  viewedUser,
  currentDate,
  customWeeks,
  adminOverride = false,
  isUserHead = false,
  isViewingOwnTimesheet,
  weekHours,
  weekPercentage,
  timeEntries,
  setTimeEntries,
  getCurrentWeekStatus
}: UseTimeEntryOperationsProps) => {
  const { toast } = useToast();

  const getTotalHoursForWeek = (): number => {
    const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
    const weekEntries = timeEntries[currentWeekKey] || {};
    
    return Object.entries(weekEntries).reduce((clientSum: number, [_, mediaEntries]) => {
      return clientSum + Object.entries(mediaEntries).reduce((mediaSum: number, [_, entry]) => {
        return mediaSum + (typeof entry.hours === 'number' ? entry.hours : 0);
      }, 0);
    }, 0);
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
          // Get default weeks from useTimeSheetWeeks
          const defaultWeek = getUserWeeks ? getUserWeeks().find(w => 
            format(parse(w.startDate, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') === currentWeekKey
          ) : null;
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

  // This function is used by TimeUpdateHandler to determine the default week
  const getUserWeeks = () => {
    // Simple empty implementation since this is just for type checking
    // The actual implementation is in useTimeSheetWeeks
    return [];
  };

  return {
    getTotalHoursForWeek,
    handleTimeUpdate
  };
};
