
import React from "react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { TimeSheetStatus } from "@/types/timesheet";
import { WeekPicker } from "@/components/TimeSheet/WeekPicker";
import { Input } from "@/components/ui/input";
import { ApprovalActions } from "@/components/TimeSheet/ApprovalActions";

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
  weekPercentage?: number;
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
  weekPercentage = 100,
}: TimeSheetControlsProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
      <div className="w-full sm:w-auto">
        <WeekPicker 
          currentDate={currentDate} 
          onWeekChange={onWeekChange} 
          onWeekHoursChange={onWeekHoursChange}
          weekPercentage={weekPercentage}
        />
      </div>
      {isViewingOwnTimesheet && status === "unconfirmed" && !readOnly && (
        <Button
          onClick={onSubmitForReview}
          disabled={status !== "unconfirmed"}
          className="w-full sm:w-auto"
        >
          Submit for review
        </Button>
      )}
      {!isViewingOwnTimesheet && isManager && status === "under-review" && (
        <ApprovalActions
          onApprove={onApprove}
          onReject={onReject}
          status={status}
          isManager={isManager}
          isViewingOwnTimesheet={isViewingOwnTimesheet}
          onSubmitForReview={onSubmitForReview}
          disabled={readOnly}
        />
      )}
      {status === "needs-revision" && isViewingOwnTimesheet && !readOnly && (
        <div className="flex flex-col space-y-2 w-full sm:w-auto">
          <div className="text-sm text-red-500 font-medium">
            This timesheet needs revision
          </div>
          <Button
            onClick={onSubmitForReview}
            className="w-full sm:w-auto"
          >
            Re-submit for review
          </Button>
        </div>
      )}
      {status === "accepted" && (
        <div className="text-sm text-green-500 font-medium">
          This timesheet has been approved
        </div>
      )}
    </div>
  );
};
