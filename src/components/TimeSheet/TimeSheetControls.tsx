
import React from 'react';
import { WeekPicker } from './WeekPicker';
import { ApprovalActions } from './ApprovalActions';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  weekId
}: TimeSheetControlsProps) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between p-4 bg-muted rounded-lg">
      <div>
        <WeekPicker
          currentDate={currentDate}
          onWeekChange={onWeekChange}
          onWeekHoursChange={onWeekHoursChange}
          firstWeek={firstWeek}
        />
      </div>
      
      <div className="flex items-center gap-4">
        {(status === 'unconfirmed' || status === 'needs-revision') && isViewingOwnTimesheet && !readOnly && (
          <div className="flex items-center">
            <Label htmlFor="week-hours" className="mr-2 text-sm font-medium">
              Week Hours:
            </Label>
            <Input
              id="week-hours"
              type="number"
              className="w-20"
              value={40}
              onChange={(e) => onWeekHoursChange(parseInt(e.target.value))}
              min={0}
              max={168}
            />
          </div>
        )}
        
        <ApprovalActions
          status={status}
          isManager={isManager}
          isViewingOwnTimesheet={isViewingOwnTimesheet}
          onSubmitForReview={onSubmitForReview}
          onApprove={onApprove}
          onReject={onReject}
          disabled={readOnly}
          weekId={weekId}
        />
      </div>
    </div>
  );
};
