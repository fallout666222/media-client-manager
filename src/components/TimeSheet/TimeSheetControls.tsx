
import React from 'react';
import { WeekPicker } from './WeekPicker';
import { ApprovalActions } from './ApprovalActions';
import { TimeSheetStatus } from '@/types/timesheet';

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
  firstWeek?: string;
  weekId?: string;
  weekPercentage?: number;
  customWeeks?: any[];
  adminOverride?: boolean;
  isUserHead?: boolean;
  viewedUserId?: string;
  hasEarlierWeeksUnderReview?: boolean;
  onNavigateToFirstUnderReview?: () => void;
  filterYear?: number | null;
}

export const TimeSheetControls: React.FC<TimeSheetControlsProps> = ({
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
  firstWeek,
  weekId,
  weekPercentage,
  customWeeks,
  adminOverride = false,
  isUserHead = false,
  viewedUserId,
  hasEarlierWeeksUnderReview = false,
  onNavigateToFirstUnderReview,
  filterYear
}) => {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
      <WeekPicker 
        currentDate={currentDate} 
        onWeekChange={onWeekChange} 
        onWeekHoursChange={onWeekHoursChange} 
        weekPercentage={weekPercentage}
        firstWeek={firstWeek}
        customWeeks={customWeeks}
        viewedUserId={viewedUserId}
        status={status}
        filterYear={filterYear}
      />
      
      <ApprovalActions 
        status={status}
        isManager={isManager}
        isViewingOwnTimesheet={isViewingOwnTimesheet}
        onSubmitForReview={onSubmitForReview}
        onApprove={onApprove}
        onReject={onReject}
        readOnly={readOnly}
        adminOverride={adminOverride}
        isUserHead={isUserHead}
        hasEarlierWeeksUnderReview={hasEarlierWeeksUnderReview}
        onNavigateToFirstUnderReview={onNavigateToFirstUnderReview}
      />
    </div>
  );
};
