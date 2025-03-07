
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TimeSheet from "./TimeSheet";
import { User, TimeSheetStatus } from '@/types/timesheet';
import { 
  getUsers, 
  getWeekStatuses, 
  updateWeekStatus, 
  getWeekStatusNames, 
  getUserFirstUnconfirmedWeek,
  updateHours
} from '@/integrations/supabase/database';
import { useQuery } from '@tanstack/react-query';
import SearchBar from '@/components/SearchBar';
import { format } from 'date-fns';

interface UserHeadViewProps {
  currentUser: User;
  clients: any[];
}

const UserHeadView: React.FC<UserHeadViewProps> = ({ currentUser, clients }) => {
  const [selectedTeamMember, setSelectedTeamMember] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [firstUnconfirmedWeek, setFirstUnconfirmedWeek] = useState<any>(null);
  const { toast } = useToast();

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await getUsers();
      if (error) throw error;
      return data || [];
    }
  });

  const teamMembers = users.filter(user => 
    user.user_head_id === currentUser.id && !user.hidden
  );

  const filteredTeamMembers = teamMembers.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (user.login || '').toLowerCase().includes(searchLower) ||
      (user.name || '').toLowerCase().includes(searchLower) ||
      (user.type || '').toLowerCase().includes(searchLower)
    );
  });

  const handleTeamMemberSelect = (userId: string) => {
    setSelectedTeamMember(userId);
    fetchFirstUnconfirmedWeek(userId);
  };

  const fetchFirstUnconfirmedWeek = async (userId: string) => {
    try {
      const week = await getUserFirstUnconfirmedWeek(userId);
      setFirstUnconfirmedWeek(week);
      
      if (week) {
        toast({
          title: "First Unconfirmed Week Found",
          description: `${week.name} needs attention`,
        });
      }
    } catch (error) {
      console.error('Error fetching first unconfirmed week:', error);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setSelectedTeamMember(null);
    setFirstUnconfirmedWeek(null);
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

  const handleSubmitForReview = async (userId: string, weekId: string) => {
    try {
      const { data: statusNames } = await getWeekStatusNames();
      const underReviewStatus = statusNames?.find(status => status.name === 'under-review');
      
      if (underReviewStatus && userId) {
        await updateWeekStatus(userId, weekId, underReviewStatus.id);
        
        toast({
          title: "Timesheet Submitted",
          description: "Timesheet has been submitted for review",
        });
        
        if (selectedTeamMember) {
          fetchFirstUnconfirmedWeek(selectedTeamMember);
        }
      }
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      toast({
        title: "Error",
        description: "Failed to submit timesheet",
        variant: "destructive"
      });
    }
  };

  const handleApprove = async (userId: string, weekId: string) => {
    try {
      const { data: statusNames } = await getWeekStatusNames();
      const acceptedStatus = statusNames?.find(status => status.name === 'accepted');
      
      if (acceptedStatus && userId) {
        await updateWeekStatus(userId, weekId, acceptedStatus.id);
        
        toast({
          title: "Timesheet Approved",
          description: "Timesheet has been approved",
        });
        
        if (selectedTeamMember) {
          fetchFirstUnconfirmedWeek(selectedTeamMember);
        }
      }
    } catch (error) {
      console.error('Error approving timesheet:', error);
      toast({
        title: "Error",
        description: "Failed to approve timesheet",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (userId: string, weekId: string) => {
    try {
      const { data: statusNames } = await getWeekStatusNames();
      const needsRevisionStatus = statusNames?.find(status => status.name === 'needs-revision');
      
      if (needsRevisionStatus && userId) {
        await updateWeekStatus(userId, weekId, needsRevisionStatus.id);
        
        toast({
          title: "Timesheet Rejected",
          description: "Timesheet has been rejected and needs revision",
        });
        
        if (selectedTeamMember) {
          fetchFirstUnconfirmedWeek(selectedTeamMember);
        }
      }
    } catch (error) {
      console.error('Error rejecting timesheet:', error);
      toast({
        title: "Error",
        description: "Failed to reject timesheet",
        variant: "destructive"
      });
    }
  };

  // Add this new function to handle updating hours
  const handleTimeUpdate = async (userId: string, weekId: string, client: string, mediaType: string, hours: number) => {
    try {
      console.log(`Updating hours for user ${userId}, week ${weekId}, client ${client}, mediaType ${mediaType}, hours ${hours}`);
      await updateHours(userId, weekId, client, mediaType, hours);
      
      toast({
        title: "Hours Updated",
        description: "Time entry has been updated successfully",
      });
    } catch (error) {
      console.error('Error updating hours:', error);
      toast({
        title: "Error",
        description: "Failed to update time entry",
        variant: "destructive"
      });
    }
  };

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
    
    if (!teamMember.first_week) {
      return (
        <div className="p-4 border rounded-lg bg-gray-50">
          <p className="text-center text-gray-500">
            This user does not have a first week set
          </p>
        </div>
      );
    }
    
    const userForTimesheet: User = {
      id: teamMember.id,
      name: teamMember.name,
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
    
    const initialWeekId = firstUnconfirmedWeek ? firstUnconfirmedWeek.id : null;
    
    return (
      <>
        {firstUnconfirmedWeek && (
          <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <h3 className="font-medium">First Week Needing Attention</h3>
            <p>Week: {firstUnconfirmedWeek.name} ({format(new Date(firstUnconfirmedWeek.period_from), 'MMM d')} - {format(new Date(firstUnconfirmedWeek.period_to), 'MMM d, yyyy')})</p>
            <div className="mt-2 flex gap-2">
              <Button 
                size="sm" 
                onClick={() => handleSubmitForReview(teamMember.id, firstUnconfirmedWeek.id)}
              >
                <Send className="h-4 w-4 mr-2" />
                Submit for Review
              </Button>
            </div>
          </div>
        )}
        <TimeSheet
          userRole={teamMember.type as 'admin' | 'user' | 'manager'}
          firstWeek={teamMember.first_week}
          currentUser={currentUser}
          users={users}
          impersonatedUser={userForTimesheet}
          clients={clients}
          initialWeekId={initialWeekId}
          isUserHead={true}
          onTimeUpdate={(weekId, client, mediaType, hours) => 
            handleTimeUpdate(teamMember.id, weekId, client, mediaType, hours)
          }
        />
      </>
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
