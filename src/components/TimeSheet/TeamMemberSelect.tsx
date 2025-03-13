
import React from 'react';
import { User } from '@/types/timesheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users } from 'lucide-react';

interface TeamMemberSelectProps {
  users: User[];
  currentUser: User;
  selectedTeamMember: string;
  onSelectTeamMember: (username: string) => void;
}

export const TeamMemberSelect = ({
  users,
  currentUser,
  selectedTeamMember,
  onSelectTeamMember,
}: TeamMemberSelectProps) => {
  // Filter users who have this person as their manager
  const teamMembers = users.filter(user => user.managerId === currentUser.username);
  
  if (teamMembers.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 mb-4 p-4 bg-muted rounded-lg">
      <Users className="h-5 w-5 text-muted-foreground" />
      <span className="text-sm font-medium">View Team Member: </span>
      <Select 
        value={selectedTeamMember}
        onValueChange={onSelectTeamMember}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select team member" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={currentUser.username}>My Timesheet</SelectItem>
          {teamMembers.map(member => (
            <SelectItem key={member.username} value={member.username}>
              {member.username}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
