
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
  selectedUser: User | null;
  onUserSelect: (user: User | null) => void;
  placeholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  autoOpenOnFocus?: boolean;
  clearSearchOnSelect?: boolean;
  className?: string;
}

export const TeamMemberSelector = memo(({
  currentUser,
  users,
  selectedUser,
  onUserSelect,
  placeholder = "Select team member",
  className = "w-[200px]",
  // We're not actually using these props yet, but we're adding them to the interface
  // to prevent TypeScript errors in the consumer components
  searchValue,
  onSearchChange,
  autoOpenOnFocus,
  clearSearchOnSelect,
}: TeamMemberSelectorProps) => {
  const handleUserChange = (userId: string) => {
    if (userId === 'none') {
      onUserSelect(null);
      return;
    }
    
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
      value={selectedUser?.id || 'none'}
      onValueChange={handleUserChange}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {currentUser.id && (
          <SelectItem value={currentUser.id}>My Timesheet</SelectItem>
        )}
        {users.map(user => (
          <SelectItem key={user.id} value={user.id}>
            {user.name || user.username || user.login}
          </SelectItem>
        ))}
        <SelectItem value="none">None</SelectItem>
      </SelectContent>
    </Select>
  );
});

TeamMemberSelector.displayName = 'TeamMemberSelector';
