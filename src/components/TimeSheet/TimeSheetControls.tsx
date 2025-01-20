import React from 'react';
import { WeekPicker } from './WeekPicker';
import { ApprovalActions } from './ApprovalActions';
import { TimeSheetStatus } from '@/types/timesheet';

interface TimeSheetControlsProps {
  currentDate: Date;
  onWeekChange: (date: Date) => void;
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
  status,
  isManager,
  onSubmitForReview,
  onApprove,
  onReject,
  readOnly = false,
}: TimeSheetControlsProps) => {
  return (
    <div className="space-y-4">
      <WeekPicker
        currentDate={currentDate}
        onWeekChange={onWeekChange}
      />
      
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