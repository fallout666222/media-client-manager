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
  filterYear: number | null;
  setFilterYear: (year: number | null) => void;
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
  checkEarlierWeeksUnderReview,
  filterYear,
  setFilterYear
}: UseTimeSheetActionsProps) => {
  const [currentCustomWeek, setCurrentCustomWeek] = useState<any>(null);

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
    weekPercentage,
    filterYear,
    setFilterYear
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
    findFirstUnsubmittedWeek: () => {
      const result = timeSheetWeeks.findFirstUnsubmittedWeek();
      return result ? typeof result === 'string' ? result : null : null;
    },
    checkEarlierWeeksUnderReview
  });

  const timeSheetPreferences = useTimeSheetPreferences({
    currentUser
  });

  return {
    handleReturnToFirstUnsubmittedWeek: timeSheetWeeks.handleReturnToFirstUnsubmittedWeek,
    handleNavigateToFirstUnderReviewWeek: timeSheetWeeks.handleNavigateToFirstUnderReviewWeek,
    hasUnsubmittedEarlierWeek: timeSheetWeeks.hasUnsubmittedEarlierWeek,
    isCurrentWeekSubmitted: timeSheetWeeks.isCurrentWeekSubmitted,
    findWeekHours: timeSheetWeeks.findWeekHours,
    getTotalHoursForWeek: timeEntryOperations.getTotalHoursForWeek,
    handleTimeUpdate: timeEntryOperations.handleTimeUpdate,
    handleSubmitForReview: timeSheetStatusChanges.handleSubmitForReview,
    handleApprove: timeSheetStatusChanges.handleApprove,
    handleReject: timeSheetStatusChanges.handleReject,
    handleReturnToUnconfirmed: timeSheetStatusChanges.handleReturnToUnconfirmed,
    handleSaveVisibleClients: timeSheetPreferences.handleSaveVisibleClients,
    handleSaveVisibleMediaTypes: timeSheetPreferences.handleSaveVisibleMediaTypes,
    setCurrentCustomWeek,
    currentCustomWeek
  };
};
