
import React from 'react';
import { WeekPicker } from './WeekPicker';
import { ApprovalActions } from './ApprovalActions';
import { TimeSheetStatus } from '@/types/timesheet';

interface TimeSheetControlsProps {
  currentDate: Date;
  onWeekChange: (date: Date) => void;
  onWeekHoursChange: (hours: number) => void;
  status: TimeSheetStatus;
  isManager: boolean;
  onSubmitForReview: () => void;
  onApprove: () => void;
  onReject: () => void;
  readOnly?: boolean;
}

export const TimeSheetControls = ({
  currentDate,
  onWeekChange,
  onWeekHoursChange,
  status,
  isManager,
  onSubmitForReview,
  onApprove,
  onReject,
  readOnly = false,
}: TimeSheetControlsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <WeekPicker
          currentDate={currentDate}
          onWeekChange={onWeekChange}
          onWeekHoursChange={onWeekHoursChange}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <ApprovalActions
          status={status}
          isManager={isManager}
          onSubmitForReview={onSubmitForReview}
          onApprove={onApprove}
          onReject={onReject}
        />
      </div>
    </div>
  );
};
