
import { useState } from 'react';
import { TimeSheetStatus, User } from '@/types/timesheet';
import { useTimeSheetWeeks } from './useTimeSheetWeeks';
import { useTimeEntryOperations } from './useTimeEntryOperations';
import { useTimeSheetStatusChanges } from './useTimeSheetStatusChanges';
import { useTimeSheetPreferences } from './useTimeSheetPreferences';

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
  timeEntries: Record<string, Record<string, Record<string, { hours: number; status: TimeSheetStatus }>>>;
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
  const [currentCustomWeek, setCurrentCustomWeek] = useState<any>(null);

  // Use the new breakdown hooks
  const timeSheetWeeks = useTimeSheetWeeks({
    currentUser,
    viewedUser,
    currentDate,
    customWeeks,
    adminOverride,
    weekStatuses,
    submittedWeeks,
    firstWeek,
    setCurrentDate,
    setCurrentCustomWeek,
    getTotalHoursForWeek: () => timeEntryOperations.getTotalHoursForWeek(),
    weekHours,
    weekPercentage
  });

  const timeEntryOperations = useTimeEntryOperations({
    currentUser,
    viewedUser,
    currentDate,
    customWeeks,
    adminOverride,
    isUserHead,
    isViewingOwnTimesheet,
    weekHours,
    weekPercentage,
    timeEntries,
    setTimeEntries,
    getCurrentWeekStatus
  });

  const timeSheetStatusChanges = useTimeSheetStatusChanges({
    currentUser,
    viewedUser,
    currentDate,
    customWeeks,
    adminOverride,
    isUserHead,
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
    getTotalHoursForWeek: timeEntryOperations.getTotalHoursForWeek,
    findFirstUnsubmittedWeek: timeSheetWeeks.findFirstUnsubmittedWeek,
    checkEarlierWeeksUnderReview
  });

  const timeSheetPreferences = useTimeSheetPreferences({
    currentUser
  });

  return {
    // Week-related functions from useTimeSheetWeeks
    handleReturnToFirstUnsubmittedWeek: timeSheetWeeks.handleReturnToFirstUnsubmittedWeek,
    handleNavigateToFirstUnderReviewWeek: timeSheetWeeks.handleNavigateToFirstUnderReviewWeek,
    hasUnsubmittedEarlierWeek: timeSheetWeeks.hasUnsubmittedEarlierWeek,
    isCurrentWeekSubmitted: timeSheetWeeks.isCurrentWeekSubmitted,
    findWeekHours: timeSheetWeeks.findWeekHours,
    
    // Time entry operations from useTimeEntryOperations
    getTotalHoursForWeek: timeEntryOperations.getTotalHoursForWeek,
    handleTimeUpdate: timeEntryOperations.handleTimeUpdate,
    
    // Status change functions from useTimeSheetStatusChanges
    handleSubmitForReview: timeSheetStatusChanges.handleSubmitForReview,
    handleApprove: timeSheetStatusChanges.handleApprove,
    handleReject: timeSheetStatusChanges.handleReject,
    
    // Preferences from useTimeSheetPreferences
    handleSaveVisibleClients: timeSheetPreferences.handleSaveVisibleClients,
    handleSaveVisibleMediaTypes: timeSheetPreferences.handleSaveVisibleMediaTypes,
    
    // Current custom week state management
    setCurrentCustomWeek,
    currentCustomWeek
  };
};
