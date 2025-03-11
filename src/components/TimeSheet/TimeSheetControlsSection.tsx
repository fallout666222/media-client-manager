
import React from 'react';
import { format } from 'date-fns';
import { TimeSheetControls } from '@/components/TimeSheet/TimeSheetControls';
import { useTimeSheet } from './TimeSheetProvider';

interface TimeSheetControlsSectionProps {
  userRole: 'admin' | 'user' | 'manager';
  readOnly?: boolean;
  adminOverride?: boolean;
  isUserHead?: boolean;
  checkEarlierWeeksUnderReview?: (weekId: string) => boolean;
}

export const TimeSheetControlsSection: React.FC<TimeSheetControlsSectionProps> = ({
  userRole,
  readOnly = false,
  adminOverride = false,
  isUserHead = false,
  checkEarlierWeeksUnderReview
}) => {
  const {
    currentDate,
    setCurrentDate,
    weekHours,
    isViewingOwnTimesheet,
    weekPercentage,
    customWeeks,
    viewedUser,
    currentCustomWeek,
    handleSubmitForReview,
    handleApprove,
    handleReject,
    handleNavigateToFirstUnderReviewWeek,
    handleWeekHoursChange,
    getCurrentWeekStatus
  } = useTimeSheet();

  return (
    <TimeSheetControls
      currentDate={currentDate}
      onWeekChange={(date) => {
        setCurrentDate(date);
      }}
      onWeekHoursChange={handleWeekHoursChange}
      status={getCurrentWeekStatus(format(currentDate, 'yyyy-MM-dd'))}
      isManager={userRole === 'manager' || userRole === 'admin'}
      isViewingOwnTimesheet={isViewingOwnTimesheet}
      onSubmitForReview={handleSubmitForReview}
      onApprove={handleApprove}
      onReject={handleReject}
      readOnly={readOnly || (!isViewingOwnTimesheet && userRole !== 'manager' && userRole !== 'admin' && !adminOverride && !isUserHead)}
      firstWeek={viewedUser.firstWeek}
      weekId={currentCustomWeek?.id}
      weekPercentage={weekPercentage}
      customWeeks={customWeeks}
      adminOverride={adminOverride}
      isUserHead={isUserHead}
      viewedUserId={viewedUser.id}
      hasEarlierWeeksUnderReview={isUserHead && checkEarlierWeeksUnderReview && currentCustomWeek?.id 
        ? checkEarlierWeeksUnderReview(currentCustomWeek.id) 
        : false}
      onNavigateToFirstUnderReview={isUserHead ? handleNavigateToFirstUnderReviewWeek : undefined}
    />
  );
};
