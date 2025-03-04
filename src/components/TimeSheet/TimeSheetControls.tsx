
import React from 'react';
import { WeekPicker } from './WeekPicker';
import { TimeSheetStatus } from '@/types/timesheet';
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
  firstWeek = "2025-01-01"
}: TimeSheetControlsProps) => {
  return (
    <div className="mb-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <WeekPicker 
          currentDate={currentDate} 
          onWeekChange={onWeekChange} 
          onWeekHoursChange={onWeekHoursChange}
          firstWeek={firstWeek}
        />
        
        {!readOnly && (
          <ApprovalActions 
            status={status}
            isManager={isManager}
            isViewingOwnTimesheet={isViewingOwnTimesheet}
            onSubmitForReview={onSubmitForReview}
            onApprove={onApprove}
            onReject={onReject}
          />
        )}
      </div>
    </div>
  );
};
