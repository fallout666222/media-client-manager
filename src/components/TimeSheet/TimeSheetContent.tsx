import { TimeSheetGrid } from "./TimeSheetGrid";
import { TimeSheetStatus, CustomWeek } from "@/types/timesheet";

interface TimeSheetContentProps {
  currentDate: Date;
  status: TimeSheetStatus;
  readOnly: boolean;
  isCustomWeek: boolean;
  customWeeks?: CustomWeek[];
}

export const TimeSheetContent = ({
  currentDate,
  status,
  readOnly,
  isCustomWeek,
  customWeeks,
}: TimeSheetContentProps) => {
  return (
    <div className="space-y-4">
      <TimeSheetGrid
        currentDate={currentDate}
        status={status}
        readOnly={readOnly}
        isCustomWeek={isCustomWeek}
        customWeeks={customWeeks}
      />
    </div>
  );
};