
import React, { memo } from 'react';
import { User } from '@/types/timesheet';
import { TeamMemberSelector } from '@/components/TeamMemberSelector';
import { useTimeSheet } from './TimeSheetContext/TimeSheetContext';

interface TeamMemberSelectorSectionProps {
  currentUser: User;
  users: User[];
  userRole: string;
  impersonatedUser?: User;
}

// Using memo to prevent unnecessary re-renders
export const TeamMemberSelectorSection: React.FC<TeamMemberSelectorSectionProps> = memo(({
  currentUser,
  users,
  userRole,
  impersonatedUser
}) => {
  const { handleUserSelect, viewedUser } = useTimeSheet();

  // Skip rendering if not needed
  if (userRole !== 'manager' || impersonatedUser) {
    return null;
  }

  // Filter users to only include those who have this user as manager
  const teamMembers = users.filter(user => user.managerId === currentUser.id);
  
  // Skip rendering if no team members
  if (teamMembers.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium mb-2">View Timesheet For:</h3>
      <TeamMemberSelector
        currentUser={currentUser}
        users={teamMembers} // Only pass relevant users
        onUserSelect={handleUserSelect}
        selectedUser={viewedUser}
        placeholder="Select team member"
      />
    </div>
  );
});

// Add display name for better debugging
TeamMemberSelectorSection.displayName = 'TeamMemberSelectorSection';
