
import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTimeSheet } from './TimeSheetProvider';
import { useSettings } from '@/contexts/SettingsContext';

interface UnsubmittedWeeksAlertProps {
  readOnly: boolean;
  adminOverride: boolean;
}

export const UnsubmittedWeeksAlert: React.FC<UnsubmittedWeeksAlertProps> = ({ 
  readOnly, 
  adminOverride 
}) => {
  const { hasUnsubmittedEarlierWeek, isCurrentWeekSubmitted } = useTimeSheet();
  const { language } = useSettings();

  if (readOnly || isCurrentWeekSubmitted() || adminOverride || !hasUnsubmittedEarlierWeek()) {
    return null;
  }

  const message = language === 'en' 
    ? "You have unsubmitted timesheets from previous weeks. Please submit them in chronological order."
    : "У вас есть непредставленные табели за предыдущие недели. Пожалуйста, отправляйте их в хронологическом порядке.";

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertDescription>
        {message}
      </AlertDescription>
    </Alert>
  );
};
