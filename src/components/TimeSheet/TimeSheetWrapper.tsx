
import React from 'react';
import { User, Client } from '@/types/timesheet';
import { TeamMemberSelectorSection } from './TeamMemberSelectorSection';
import { TimeSheetHeaderSection } from './TimeSheetHeaderSection';
import { TimeSheetControlsSection } from './TimeSheetControlsSection';
import { TimeSheetContentSection } from './TimeSheetContentSection';
import { useTimeSheet } from './TimeSheetProvider';

interface TimeSheetWrapperProps {
  userRole: 'admin' | 'user' | 'manager';
  firstWeek: string;
  currentUser: User;
  users: User[];
  clients: Client[];
  readOnly?: boolean;
  impersonatedUser?: User;
  adminOverride?: boolean;
  isUserHead?: boolean;
  checkEarlierWeeksUnderReview?: (weekId: string) => boolean;
}

export const TimeSheetWrapper: React.FC<TimeSheetWrapperProps> = ({
  userRole,
  firstWeek,
  currentUser,
  users,
  clients,
  readOnly = false,
  impersonatedUser,
  adminOverride = false,
  isUserHead = false,
  checkEarlierWeeksUnderReview
}) => {
  return (
    <div className="space-y-6">
      <TeamMemberSelectorSection 
        currentUser={currentUser}
        users={users}
        userRole={userRole}
        impersonatedUser={impersonatedUser}
      />

      <TimeSheetHeaderSection 
        userRole={userRole}
        firstWeek={firstWeek}
        readOnly={readOnly}
        adminOverride={adminOverride}
      />

      <TimeSheetControlsSection 
        userRole={userRole}
        readOnly={readOnly}
        adminOverride={adminOverride}
        isUserHead={isUserHead}
        checkEarlierWeeksUnderReview={checkEarlierWeeksUnderReview}
      />

      <TimeSheetContentSection 
        userRole={userRole}
        clients={clients}
        readOnly={readOnly}
        adminOverride={adminOverride}
        isUserHead={isUserHead}
      />
    </div>
  );
};
