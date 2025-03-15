
import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTimeSheet } from './TimeSheetContext/TimeSheetContext';

interface UnsubmittedWeeksAlertProps {
  readOnly: boolean;
  adminOverride: boolean;
}

export const UnsubmittedWeeksAlert: React.FC<UnsubmittedWeeksAlertProps> = ({ 
  readOnly, 
  adminOverride 
}) => {
  const { hasUnsubmittedEarlierWeek, isCurrentWeekSubmitted } = useTimeSheet();

  if (readOnly || isCurrentWeekSubmitted() || adminOverride || !hasUnsubmittedEarlierWeek()) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertDescription>
        You have unsubmitted timesheets from previous weeks. Please submit them in chronological order.
      </AlertDescription>
    </Alert>
  );
};
