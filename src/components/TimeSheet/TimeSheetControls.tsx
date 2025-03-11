
import React from 'react';
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
  readOnly?: boolean;
  firstWeek?: string;
  weekId?: string;
  weekPercentage?: number;
  customWeeks?: any[];
  adminOverride?: boolean;
  isUserHead?: boolean;
  hasEarlierWeeksUnderReview?: boolean;
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
  readOnly = false,
  firstWeek,
  weekId,
  weekPercentage = 100,
  customWeeks = [],
  adminOverride = false,
  isUserHead = false,
  hasEarlierWeeksUnderReview = false
}: TimeSheetControlsProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
      <WeekPicker
        currentDate={currentDate}
        onDateChange={onWeekChange}
        onWeekHoursChange={onWeekHoursChange}
        firstWeek={firstWeek}
        status={status}
        customWeeks={customWeeks}
      />
      <ApprovalActions
        status={status}
        isManager={isManager}
        isViewingOwnTimesheet={isViewingOwnTimesheet}
        onSubmitForReview={onSubmitForReview}
        onApprove={onApprove}
        onReject={onReject}
        disabled={readOnly}
        weekId={weekId}
        adminOverride={adminOverride}
        isUserHead={isUserHead}
        hasEarlierWeeksUnderReview={hasEarlierWeeksUnderReview}
      />
    </div>
  );
};
