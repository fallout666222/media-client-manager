import React from 'react';
import { TimeSheetStatus as Status } from '@/types/timesheet';
import { format, parse, startOfWeek, addWeeks, isBefore, isEqual } from 'date-fns';

interface TimeSheetStateProps {
  firstWeek: string;
  submittedWeeks: string[];
  currentDate: Date;
}

export const findFirstUnsubmittedWeek = ({ firstWeek, submittedWeeks, currentDate }: TimeSheetStateProps): Date | null => {
  let weekToCheck = parse(firstWeek, 'yyyy-MM-dd', new Date());
  const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

  while (isBefore(weekToCheck, currentWeekStart) || isEqual(weekToCheck, currentWeekStart)) {
    const weekKey = format(weekToCheck, 'yyyy-MM-dd');
    if (!submittedWeeks.includes(weekKey)) {
      return weekToCheck;
    }
    weekToCheck = addWeeks(weekToCheck, 1);
  }
  return null;
};

export const getCurrentWeekStatus = (
  currentDate: Date,
  weekStatuses: Record<string, Status>
): Status => {
  const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
  return weekStatuses[currentWeekKey] || 'unconfirmed';
};