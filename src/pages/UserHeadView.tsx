
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
import { getUsers } from '@/integrations/supabase/database';
import { useQuery } from '@tanstack/react-query';
import SearchBar from '@/components/SearchBar';

interface UserHeadViewProps {
  currentUser: User;
  clients: any[];
}

const UserHeadView: React.FC<UserHeadViewProps> = ({ currentUser, clients }) => {
  const [selectedTeamMember, setSelectedTeamMember] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Fetch all users using React Query
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await getUsers();
      if (error) throw error;
      return data || [];
    }
  });

  // Filter users who have the current user set as their User Head AND are not hidden
  const teamMembers = users.filter(user => 
    user.user_head_id === currentUser.id && !user.hidden
  );

  // Filter team members based on search term
  const filteredTeamMembers = teamMembers.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (user.login || '').toLowerCase().includes(searchLower) ||
      (user.name || '').toLowerCase().includes(searchLower) ||
      (user.type || user.role || '').toLowerCase().includes(searchLower)
    );
  });

  const handleTeamMemberSelect = (userId: string) => {
    setSelectedTeamMember(userId);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setSelectedTeamMember(null); // Reset selection when searching
  };

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load team members",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  const renderTeamMemberTimesheet = () => {
    if (!selectedTeamMember) {
      return null;
    }
    
    const teamMember = users.find(u => u.id === selectedTeamMember);
    if (!teamMember) {
      return (
        <div className="p-4 border rounded-lg bg-gray-50">
          <p className="text-center text-gray-500">
            User not found
          </p>
        </div>
      );
    }
    
    // Check for first_week or first_custom_week_id
    if (!teamMember.first_week) {
      return (
        <div className="p-4 border rounded-lg bg-gray-50">
          <p className="text-center text-gray-500">
            This user does not have a first week set
          </p>
        </div>
      );
    }
    
    // Create a User object with the required properties
    const userForTimesheet: User = {
      id: teamMember.id,
      name: teamMember.name,
      // Convert the string type to the expected 'admin' | 'user' | 'manager' type
      role: teamMember.type as 'admin' | 'user' | 'manager',
      firstWeek: teamMember.first_week,
      firstCustomWeekId: teamMember.first_custom_week_id,
      username: teamMember.login,
      login: teamMember.login,
      type: teamMember.type,
      email: teamMember.email,
      job_position: teamMember.job_position,
      description: teamMember.description,
      department_id: teamMember.department_id,
      departmentId: teamMember.department_id,
      first_week: teamMember.first_week,
      first_custom_week_id: teamMember.first_custom_week_id,
      deletion_mark: teamMember.deletion_mark,
      hidden: teamMember.hidden,
      user_head_id: teamMember.user_head_id
    };
    
    return (
      <TimeSheet
        userRole={teamMember.type as 'admin' | 'user' | 'manager'}
        firstWeek={teamMember.first_week}
        currentUser={userForTimesheet}
        users={users}
        impersonatedUser={userForTimesheet}
        clients={clients}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 pt-16 text-center">
        <p>Loading team members...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pt-16">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Team Timesheets (User Head View)</h1>
        <Link to="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {filteredTeamMembers.length === 0 ? (
        <div className="p-4 border rounded-lg bg-gray-50">
          <p className="text-center text-gray-500">
            {teamMembers.length === 0 ? 
              "You don't have any team members assigned to you as User Head" : 
              "No team members match your search criteria"}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <h2 className="text-lg font-medium">Select Team Member</h2>
              <SearchBar 
                value={searchTerm} 
                onChange={handleSearchChange} 
                placeholder="Search team members..." 
                className="max-w-xs"
              />
            </div>
            <Select onValueChange={handleTeamMemberSelect}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {filteredTeamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.login}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            {selectedTeamMember ? (
              <>
                <h2 className="text-lg font-medium mb-4">
                  Timesheet for {users.find(u => u.id === selectedTeamMember)?.login}
                </h2>
                {renderTeamMemberTimesheet()}
              </>
            ) : (
              <p>Select a team member to view their timesheet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default UserHeadView;
