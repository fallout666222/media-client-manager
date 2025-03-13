
import React, { useEffect } from 'react';
import { TimeSheetStatus } from '@/types/timesheet';
import { WeekPicker } from './WeekPicker';
import { ApprovalActions } from './ApprovalActions';

interface TimeSheetControlsProps {
  currentDate: Date;
  onWeekChange: (date: Date) => void;
  onWeekHoursChange: (hours: number) => void;
  status: TimeSheetStatus;
  isManager: boolean;
  isViewingOwnTimesheet: boolean;
  onSubmitForReview: () => void;
  onApprove: () => void;
  onReject: () => void;
  onReturnToUnconfirmed: () => void; // Added this prop
  readOnly?: boolean;
  firstWeek?: string;
  weekId?: string;
  weekPercentage?: number;
  customWeeks?: any[];
  adminOverride?: boolean;
  isUserHead?: boolean;
  hasEarlierWeeksUnderReview?: boolean;
  viewedUserId?: string;
  onNavigateToFirstUnderReview?: () => void;
  filterYear: number | null;
  setFilterYear: (year: number | null) => void;
}

export const TimeSheetControls = ({
  currentDate,
  onWeekChange,
  onWeekHoursChange,
  status,
  isManager,
  isViewingOwnTimesheet,
  onSubmitForReview,
  onApprove,
  onReject,
  onReturnToUnconfirmed,
  readOnly = false,
  firstWeek,
  weekId,
  weekPercentage = 100,
  customWeeks = [],
  adminOverride = false,
  isUserHead = false,
  hasEarlierWeeksUnderReview = false,
  viewedUserId,
  onNavigateToFirstUnderReview,
  filterYear,
  setFilterYear
}: TimeSheetControlsProps) => {
  
  // Add debug logging
  useEffect(() => {
    if (isUserHead && status === 'under-review') {
      console.log("TimeSheetControls Debug:");
      console.log("- WeekId:", weekId);
      console.log("- hasEarlierWeeksUnderReview:", hasEarlierWeeksUnderReview);
    }
  }, [isUserHead, status, weekId, hasEarlierWeeksUnderReview]);

  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
      <WeekPicker
        currentDate={currentDate}
        onWeekChange={onWeekChange}
        onWeekHoursChange={onWeekHoursChange}
        firstWeek={firstWeek}
        status={status}
        customWeeks={customWeeks}
        viewedUserId={viewedUserId}
        weekPercentage={weekPercentage}
        filterYear={filterYear}
        setFilterYear={setFilterYear}
      />
      <ApprovalActions
        status={status}
        isManager={isManager}
        isViewingOwnTimesheet={isViewingOwnTimesheet}
        onSubmitForReview={onSubmitForReview}
        onApprove={onApprove}
        onReject={onReject}
        onReturnToUnconfirmed={onReturnToUnconfirmed}
        disabled={readOnly}
        weekId={weekId}
        adminOverride={adminOverride}
        isUserHead={isUserHead}
        hasEarlierWeeksUnderReview={hasEarlierWeeksUnderReview}
        onNavigateToFirstUnderReview={onNavigateToFirstUnderReview}
      />
    </div>
  );
};
