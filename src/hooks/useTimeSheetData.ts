
import { isBefore } from 'date-fns';
import { TimeSheetStatus, User } from '@/types/timesheet';
import { useTimeSheetEntries } from './useTimeSheetEntries';
import { useTimeSheetStatuses } from './useTimeSheetStatuses';
import { useTimeSheetPercentage } from './useTimeSheetPercentage';
import { useTimeSheetSelections } from './useTimeSheetSelections';

interface TimeSheetDataHookProps {
  currentUser: User;
  viewedUser: User;
  currentDate: Date;
  customWeeks: any[];
  initialWeekId: string | null;
  firstWeek: string;
  userRole: 'admin' | 'user' | 'manager';
  adminOverride?: boolean;
}

export const useTimeSheetData = ({
  currentUser,
  viewedUser,
  currentDate,
  customWeeks,
  initialWeekId,
  firstWeek,
  userRole,
  adminOverride = false
}: TimeSheetDataHookProps) => {
  // Use the statuses hook to get and manage week statuses
  const { 
    weekStatuses, 
    setWeekStatuses,
    submittedWeeks, 
    setSubmittedWeeks,
    getCurrentWeekStatus 
  } = useTimeSheetStatuses({
    viewedUser,
    customWeeks
  });

  // Use the percentage hook to manage week percentages
  const { 
    weekPercentage,
    setWeekPercentage 
  } = useTimeSheetPercentage({
    viewedUser,
    currentDate,
    customWeeks
  });

  // Use the selections hook to manage client and media type selections
  const { 
    selectedClients, 
    setSelectedClients,
    selectedMediaTypes, 
    setSelectedMediaTypes 
  } = useTimeSheetSelections({
    currentUser
  });

  // Use the entries hook to manage time entries
  const { 
    timeEntries, 
    setTimeEntries 
  } = useTimeSheetEntries({
    viewedUser,
    currentDate,
    customWeeks,
    firstWeek,
    getCurrentWeekStatus
  });

  return {
    timeEntries,
    setTimeEntries,
    submittedWeeks,
    setSubmittedWeeks,
    weekStatuses,
    setWeekStatuses,
    weekPercentage,
    setWeekPercentage,
    selectedClients,
    setSelectedClients,
    selectedMediaTypes,
    setSelectedMediaTypes,
    getCurrentWeekStatus
  };
};
