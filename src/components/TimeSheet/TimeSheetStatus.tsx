import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format, startOfWeek, isEqual } from 'date-fns';

interface TimeSheetStatusProps {
  firstUnsubmittedWeek: Date | null;
  currentDate: Date;
}

export const TimeSheetStatus = ({ firstUnsubmittedWeek, currentDate }: TimeSheetStatusProps) => {
  if (firstUnsubmittedWeek && !isEqual(firstUnsubmittedWeek, currentDate)) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>
          You have unsubmitted timesheets from previous weeks. Please submit them in chronological order.
        </AlertDescription>
      </Alert>
    );
  }
  return null;
};