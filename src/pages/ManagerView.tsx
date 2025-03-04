import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TimeSheet from "./TimeSheet";
import { User } from '@/types/timesheet';

interface ManagerViewProps {
  currentUser: User;
  users: User[];
  clients: any[];
}

const ManagerView: React.FC<ManagerViewProps> = ({ currentUser, users, clients }) => {
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [selectedTeamMember, setSelectedTeamMember] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Filter users who report to the current manager
    const filteredTeamMembers = users.filter(user => user.managerId === currentUser.id);
    setTeamMembers(filteredTeamMembers);
  }, [currentUser, users]);

  const handleTeamMemberSelect = (userId: string) => {
    setSelectedTeamMember(userId);
  };

  const renderTeamMemberTimesheet = () => {
    if (!selectedTeamMember) {
      return null;
    }
    
    const teamMember = users.find(u => u.id === selectedTeamMember);
    if (!teamMember || !teamMember.firstWeek) {
      return (
        <div className="p-4 border rounded-lg bg-gray-50">
          <p className="text-center text-gray-500">
            This user does not have a first week set
          </p>
        </div>
      );
    }
    
    return (
      <TimeSheet
        userRole={teamMember.role}
        firstWeek={teamMember.firstWeek}
        currentUser={teamMember}
        users={users}
        readOnly={true}
        clients={clients}
      />
    );
  };

  return (
    <div className="container mx-auto p-4 pt-16">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Team Timesheets</h1>
        <Link to="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-medium mb-4">Select Team Member</h2>
        <Select onValueChange={handleTeamMemberSelect}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select team member" />
          </SelectTrigger>
          <SelectContent>
            {teamMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.username}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        {selectedTeamMember ? (
          <>
            <h2 className="text-lg font-medium mb-4">
              Timesheet for {users.find(u => u.id === selectedTeamMember)?.username}
            </h2>
            {renderTeamMemberTimesheet()}
          </>
        ) : (
          <p>Select a team member to view their timesheet.</p>
        )}
      </div>
    </div>
  );
};

export default ManagerView;
