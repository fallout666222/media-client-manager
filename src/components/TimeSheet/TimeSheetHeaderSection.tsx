
import React from 'react';
import { TimeSheetHeader } from '@/components/TimeSheet/TimeSheetHeader';
import { format } from 'date-fns';
import { UnsubmittedWeeksAlert } from './UnsubmittedWeeksAlert';
import { AdminOverrideAlert } from './AdminOverrideAlert';
import { useTimeSheet } from './TimeSheetProvider';

interface TimeSheetHeaderSectionProps {
  userRole: 'admin' | 'user' | 'manager';
  firstWeek: string;
  readOnly?: boolean;
  adminOverride?: boolean;
}

export const TimeSheetHeaderSection: React.FC<TimeSheetHeaderSectionProps> = ({
  userRole,
  firstWeek,
  readOnly = false,
  adminOverride = false,
}) => {
  const {
    showSettings,
    setShowSettings,
    viewedUser,
    currentDate,
    weekHours,
    weekPercentage,
    customWeeks,
    hasUnsubmittedEarlierWeek,
    isCurrentWeekSubmitted,
    handleReturnToFirstUnsubmittedWeek,
    getTotalHoursForWeek,
    getCurrentWeekStatus
  } = useTimeSheet();

  return (
    <>
      <AdminOverrideAlert adminOverride={adminOverride} />

      <TimeSheetHeader
        userRole={userRole}
        remainingHours={Math.round(weekHours * (weekPercentage / 100)) - getTotalHoursForWeek()}
        status={getCurrentWeekStatus(format(currentDate, 'yyyy-MM-dd'))}
        onReturnToFirstUnsubmittedWeek={handleReturnToFirstUnsubmittedWeek}
        onToggleSettings={() => setShowSettings(!showSettings)}
        firstWeek={viewedUser.firstWeek || firstWeek}
        weekPercentage={weekPercentage}
        weekHours={weekHours}
        hasCustomWeeks={customWeeks.length > 0}
        showSettings={showSettings}
      />

      <UnsubmittedWeeksAlert 
        readOnly={readOnly} 
        adminOverride={adminOverride} 
      />
    </>
  );
};
