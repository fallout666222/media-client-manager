
import React from 'react';
import { WeekPicker } from './WeekPicker';
import { ApprovalActions } from './ApprovalActions';
import { TimeSheetStatus } from '@/types/timesheet';

interface TimeSheetControlsProps {
  currentDate: Date;
  onWeekChange: (date: Date) => void;
  onWeekHoursChange: (hours: number) => void;
  status: TimeSheetStatus;
  isManager?: boolean;
  isViewingOwnTimesheet?: boolean;
  onSubmitForReview?: () => void;
  onApprove: () => void;
  onReject: () => void;
  readOnly?: boolean;
  firstWeek: string;
  weekId?: string;
  weekPercentage?: number;
  customWeeks?: any[];
  adminOverride?: boolean;
}

export const TimeSheetControls = ({
  currentDate,
  onWeekChange,
  onWeekHoursChange,
  status,
  isManager = false,
  isViewingOwnTimesheet = true,
  onSubmitForReview,
  onApprove,
  onReject,
  readOnly = false,
  firstWeek,
  weekId,
  weekPercentage = 100,
  customWeeks = [],
  adminOverride = false
}: TimeSheetControlsProps) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between p-4 bg-muted rounded-lg">
      <div>
        <WeekPicker
          currentDate={currentDate}
          onWeekChange={onWeekChange}
          onWeekHoursChange={onWeekHoursChange}
          firstWeek={firstWeek}
          weekPercentage={weekPercentage}
          customWeeks={customWeeks}
        />
      </div>
      
      <div className="flex items-center gap-4">
        <ApprovalActions
          status={status}
          isManager={isManager}
          isViewingOwnTimesheet={isViewingOwnTimesheet}
          onSubmitForReview={onSubmitForReview}
          onApprove={onApprove}
          onReject={onReject}
          disabled={readOnly && !adminOverride}
          weekId={weekId}
          adminOverride={adminOverride}
        />
      </div>
    </div>
  );
};
