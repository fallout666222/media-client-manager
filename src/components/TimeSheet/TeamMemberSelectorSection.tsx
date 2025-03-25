
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
  const {
    handleUserSelect,
    viewedUser
  } = useTimeSheet();

  // Check for admin or manager role and ensure we're not in impersonation mode
  if (!currentUser || (userRole !== 'manager' && userRole !== 'admin') || impersonatedUser) {
    return null;
  }

  return (
    <div className="mb-4">
      <TeamMemberSelector 
        users={users} 
        selectedUserId={viewedUser?.id} 
        onUserSelect={handleUserSelect}
      />
    </div>
  );
};
