
import React from 'react';
import { User } from '@/types/timesheet';
import { TeamMemberSelector } from '@/components/TeamMemberSelector';
import { useTimeSheet } from './TimeSheetContext/TimeSheetContext';

interface TeamMemberSelectorSectionProps {
  currentUser: User;
  users: User[];
  userRole: string;
  impersonatedUser?: User;
}

export const TeamMemberSelectorSection: React.FC<TeamMemberSelectorSectionProps> = ({
  currentUser,
  users,
  userRole,
  impersonatedUser
}) => {
  const { handleUserSelect, viewedUser } = useTimeSheet();

  // Check for admin or manager role and ensure we're not in impersonation mode
  if ((userRole !== 'manager' && userRole !== 'admin') || impersonatedUser) {
    return null;
  }

  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium mb-2">View Timesheet For:</h3>
      <TeamMemberSelector
        currentUser={currentUser}
        users={users || []} // Add fallback for null users
        onUserSelect={handleUserSelect}
        selectedUser={viewedUser}
      />
    </div>
  );
};
