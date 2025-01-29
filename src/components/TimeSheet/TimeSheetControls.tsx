import { WeekPicker } from "./WeekPicker";
import { ApprovalActions } from "./ApprovalActions";
import { WeekTypeSwitch } from "./WeekTypeSwitch";
import { TimeSheetStatus, CustomWeek } from "@/types/timesheet";

interface TimeSheetControlsProps {
  currentDate: Date;
  onWeekChange: (date: Date) => void;
  status: TimeSheetStatus;
  isManager: boolean;
  onSubmitForReview: () => void;
  onApprove: () => void;
  onReject: () => void;
  readOnly: boolean;
  isCustomWeek: boolean;
  onWeekTypeChange: (value: boolean) => void;
  customWeeks?: CustomWeek[];
}

export const TimeSheetControls = ({
  currentDate,
  onWeekChange,
  status,
  isManager,
  onSubmitForReview,
  onApprove,
  onReject,
  readOnly,
  isCustomWeek,
  onWeekTypeChange,
  customWeeks,
}: TimeSheetControlsProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <WeekPicker currentDate={currentDate} onWeekChange={onWeekChange} />
        <WeekTypeSwitch
          isCustomWeek={isCustomWeek}
          onToggle={onWeekTypeChange}
          customWeeks={customWeeks}
        />
      </div>
      <ApprovalActions
        status={status}
        isManager={isManager}
        onSubmitForReview={onSubmitForReview}
        onApprove={onApprove}
        onReject={onReject}
        readOnly={readOnly}
      />
    </div>
  );
};