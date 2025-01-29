import React from 'react';
import { WeekPicker } from './WeekPicker';
import { ApprovalActions } from './ApprovalActions';
import { TimeSheetStatus } from '@/types/timesheet';
import { WeekTypeSwitch } from './WeekTypeSwitch';

interface TimeSheetControlsProps {
  currentDate: Date;
  onWeekChange: (date: Date) => void;
  status: TimeSheetStatus;
  isManager: boolean;
  onSubmitForReview: () => void;
  onApprove: () => void;
  onReject: () => void;
  isCustomWeek: boolean;
  onWeekTypeChange: (value: boolean) => void;
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
  isCustomWeek,
  onWeekTypeChange,
  readOnly = false,
}: TimeSheetControlsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <WeekPicker
          currentDate={currentDate}
          onWeekChange={onWeekChange}
        />
        <WeekTypeSwitch
          isCustomWeek={isCustomWeek}
          onToggle={onWeekTypeChange}
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