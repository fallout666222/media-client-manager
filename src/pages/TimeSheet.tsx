import { useState } from "react";
import { TimeSheetContent } from "@/components/TimeSheet/TimeSheetContent";
import { TimeSheetControls } from "@/components/TimeSheet/TimeSheetControls";
import { TimeSheetStatus } from "@/types/timesheet";
import { DEFAULT_WEEKS } from "@/pages/CustomWeeks";

interface TimeSheetProps {
  userRole: string;
  firstWeek: string;
}

const TimeSheet = ({ userRole, firstWeek }: TimeSheetProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [status, setStatus] = useState<TimeSheetStatus>("draft");
  const [isCustomWeek, setIsCustomWeek] = useState(false);
  const isManager = userRole === "manager" || userRole === "admin";

  const handleSubmitForReview = () => {
    setStatus("pending");
  };

  const handleApprove = () => {
    setStatus("approved");
  };

  const handleReject = () => {
    setStatus("rejected");
  };

  return (
    <div className="space-y-8">
      <TimeSheetControls
        currentDate={currentDate}
        onWeekChange={setCurrentDate}
        status={status}
        isManager={isManager}
        onSubmitForReview={handleSubmitForReview}
        onApprove={handleApprove}
        onReject={handleReject}
        isCustomWeek={isCustomWeek}
        onWeekTypeChange={setIsCustomWeek}
        customWeeks={DEFAULT_WEEKS}
      />
      <TimeSheetContent
        currentDate={currentDate}
        status={status}
        readOnly={status === "approved"}
        isCustomWeek={isCustomWeek}
        customWeeks={DEFAULT_WEEKS}
      />
    </div>
  );
};

export default TimeSheet;