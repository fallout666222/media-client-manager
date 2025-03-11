
import React from 'react';
import { TimeSheetProvider } from '@/components/TimeSheet/TimeSheetProvider';
import { TimeSheetWrapper } from '@/components/TimeSheet/TimeSheetWrapper';
import { TimeSheetStatus, User, Client } from '@/types/timesheet';

interface TimeSheetProps {
  userRole: 'admin' | 'user' | 'manager';
  firstWeek: string;
  currentUser: User;
  users: User[];
  clients: Client[];
  readOnly?: boolean;
  impersonatedUser?: User;
  adminOverride?: boolean;
  customWeeks?: any[];
  initialWeekId?: string | null;
  isUserHead?: boolean;
  onTimeUpdate?: (weekId: string, client: string, mediaType: string, hours: number) => void;
  checkEarlierWeeksUnderReview?: (weekId: string) => boolean;
}

const TimeSheet = (props: TimeSheetProps) => {
  return (
    <TimeSheetProvider {...props}>
      <TimeSheetWrapper {...props} />
    </TimeSheetProvider>
  );
};

export default TimeSheet;
