
// Creating this component to ensure it exists and is optimized
import React, { memo } from 'react';
import { User } from '@/types/timesheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TeamMemberSelectorProps {
  currentUser: User;
  users: User[];
  selectedUser: User;
  onUserSelect: (user: User) => void;
}

export const TeamMemberSelector = memo(({
  currentUser,
  users,
  selectedUser,
  onUserSelect,
}: TeamMemberSelectorProps) => {
  const handleUserChange = (userId: string) => {
    if (userId === currentUser.id) {
      onUserSelect(currentUser);
    } else {
      const selectedTeamMember = users.find(user => user.id === userId);
      if (selectedTeamMember) {
        onUserSelect(selectedTeamMember);
      }
    }
  };

  return (
    <Select 
      value={selectedUser.id}
      onValueChange={handleUserChange}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select team member" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={currentUser.id}>My Timesheet</SelectItem>
        {users.map(user => (
          <SelectItem key={user.id} value={user.id}>
            {user.name || user.username || user.login}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});

TeamMemberSelector.displayName = 'TeamMemberSelector';
