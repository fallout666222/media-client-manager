import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, AlertCircle } from "lucide-react";
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
  updateHours,
  getWeekHours
} from '@/integrations/supabase/database';
import { useQuery } from '@tanstack/react-query';
import { format, parse, isBefore, getYear } from 'date-fns';
import { TeamMemberSelector } from '@/components/TeamMemberSelector';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserHeadViewProps {
  currentUser: User;
  clients: any[];
}

const UserHeadView: React.FC<UserHeadViewProps> = ({ currentUser, clients }) => {
  const [selectedTeamMember, setSelectedTeamMember] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [firstUnconfirmedWeek, setFirstUnconfirmedWeek] = useState<any>(null);
  const [weekStatuses, setWeekStatuses] = useState<any[]>([]);
  const [firstUnderReviewWeek, setFirstUnderReviewWeek] = useState<any>(null);
  const [forceRefresh, setForceRefresh] = useState<number>(0);
  const [filterYear, setFilterYear] = useState<number | null>(null);
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

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleTeamMemberSelect = (user: User) => {
    setSelectedTeamMember(user.id);
    
    // Load the saved year filter from localStorage if it exists
    const savedYearFilter = localStorage.getItem(`selectedYearFilter_${user.id}`);
    if (savedYearFilter) {
      setFilterYear(parseInt(savedYearFilter));
    } else {
      // Default to current year if no saved filter
      setFilterYear(new Date().getFullYear());
    }
    
    fetchFirstUnconfirmedWeek(user.id);
    fetchWeekStatuses(user.id);
    findFirstUnderReviewWeek(user.id);
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
      // console.error('Error fetching first unconfirmed week:', error);
    }
  };

  const fetchWeekStatuses = async (userId: string) => {
    try {
      const { data } = await getWeekStatuses(userId);
      if (data) {
        setWeekStatuses(data);
        findFirstUnderReviewWeek(userId, data);
      }
    } catch (error) {
      // console.error('Error fetching week statuses:', error);
    }
  };

  const findFirstUnderReviewWeek = async (userId: string, statusData?: any[]) => {
    try {
      const data = statusData || weekStatuses;
      if (!data || data.length === 0) {
        const { data: freshData } = await getWeekStatuses(userId);
        if (!freshData || freshData.length === 0) {
          setFirstUnderReviewWeek(null);
          return;
        }
        
        findFirstUnderReviewWeek(userId, freshData);
        return;
      }
      
      const sortedWeeks = [...data].sort((a, b) => {
        if (!a.week || !b.week) return 0;
        
        const dateA = new Date(a.week.period_from);
        const dateB = new Date(b.week.period_from);
        return dateA.getTime() - dateB.getTime();
      });
      
      const firstUnderReview = sortedWeeks.find(status => 
        status.status?.name === 'under-review'
      );
      
      // console.log("First under review week found:", firstUnderReview);
      setFirstUnderReviewWeek(firstUnderReview);
    } catch (error) {
      // console.error('Error finding first under-review week:', error);
      setFirstUnderReviewWeek(null);
    }
  };

  const navigateToFirstUnderReviewWeek = () => {
    if (firstUnderReviewWeek && selectedTeamMember) {
      // console.log("Navigating to first under review week:", firstUnderReviewWeek.week);
      
      if (firstUnderReviewWeek.week && selectedTeamMember) {
        localStorage.setItem(`selectedWeek_${selectedTeamMember}`, firstUnderReviewWeek.week_id);
        // console.log(`Saved selected week to localStorage: selectedWeek_${selectedTeamMember} = ${firstUnderReviewWeek.week_id}`);
        
        // Update the year filter to match the year of the found week
        if (firstUnderReviewWeek.week.period_from) {
          try {
            const weekDate = new Date(firstUnderReviewWeek.week.period_from);
            const weekYear = getYear(weekDate);
            setFilterYear(weekYear);
            localStorage.setItem(`selectedYearFilter_${selectedTeamMember}`, weekYear.toString());
            console.log(`Updated year filter to ${weekYear} for user ${selectedTeamMember}`);
          } catch (error) {
            console.error("Error updating year filter:", error);
          }
        }
        
        setForceRefresh(prev => prev + 1);
        
        fetchWeekStatuses(selectedTeamMember);
        
        toast({
          title: "Navigated to First Week Under Review",
          description: `Week: ${firstUnderReviewWeek.week?.name}`,
        });
        
        const timeSheetContainer = document.getElementById('timesheet-container');
        if (timeSheetContainer) {
          timeSheetContainer.classList.add('refresh-trigger');
          setTimeout(() => {
            timeSheetContainer.classList.remove('refresh-trigger');
          }, 50);
        }
      }
    } else {
      toast({
        title: "No Weeks Under Review",
        description: "There are no weeks currently under review.",
        variant: "destructive"
      });
    }
  };

  const checkForEarlierWeeksUnderReview = (weekId: string) => {
    if (!weekStatuses.length) return false;
    
    const currentWeek = weekStatuses.find(status => 
      status.week_id === weekId
    );
    
    if (!currentWeek || !currentWeek.week) return false;
    
    const currentWeekDate = new Date(currentWeek.week.period_from);
    // console.log("Current week date:", format(currentWeekDate, 'yyyy-MM-dd'));
    
    const earlierWeeksUnderReview = weekStatuses.filter(status => {
      if (!status.week || !status.status) return false;
      
      const weekDate = new Date(status.week.period_from);
      
      // Only consider weeks with 'under-review' status, ignore 'needs-revision'
      const isEarlier = isBefore(weekDate, currentWeekDate);
      const isUnderReview = status.status.name === 'under-review';
      
      if (isEarlier && isUnderReview) {
        // console.log(`Earlier week ${status.week.name} is still under review`);
        return true;
      }
      
      return false;
    });
    
    // console.log(`Found ${earlierWeeksUnderReview.length} earlier weeks under review`);
    return earlierWeeksUnderReview.length > 0;
  };

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
        
        fetchWeekStatuses(userId);
        
        if (selectedTeamMember) {
          fetchFirstUnconfirmedWeek(selectedTeamMember);
          findFirstUnderReviewWeek(selectedTeamMember);
        }
        
        setForceRefresh(prev => prev + 1);
      }
    } catch (error) {
      // console.error('Error submitting timesheet:', error);
      toast({
        title: "Error",
        description: "Failed to submit timesheet",
        variant: "destructive"
      });
    }
  };

  const handleApprove = async (userId: string, weekId: string) => {
    try {
      const hasEarlierWeeks = checkForEarlierWeeksUnderReview(weekId);
      
      if (hasEarlierWeeks) {
        toast({
          title: "Cannot Approve",
          description: "Earlier weeks must be approved first. Navigating to the first week under review.",
          variant: "destructive"
        });
        
        await fetchWeekStatuses(userId);
        findFirstUnderReviewWeek(userId);
        navigateToFirstUnderReviewWeek();
        return;
      }
      
      const { data: statusNames } = await getWeekStatusNames();
      const acceptedStatus = statusNames?.find(status => status.name === 'accepted');
      
      if (acceptedStatus && userId) {
        await updateWeekStatus(userId, weekId, acceptedStatus.id);
        
        toast({
          title: "Timesheet Approved",
          description: "Timesheet has been approved",
        });
        
        fetchWeekStatuses(userId);
        
        if (selectedTeamMember) {
          fetchFirstUnconfirmedWeek(selectedTeamMember);
          findFirstUnderReviewWeek(selectedTeamMember);
        }
        
        setForceRefresh(prev => prev + 1);
      }
    } catch (error) {
      // console.error('Error approving timesheet:', error);
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
        
        fetchWeekStatuses(userId);
        
        if (selectedTeamMember) {
          fetchFirstUnconfirmedWeek(selectedTeamMember);
          findFirstUnderReviewWeek(selectedTeamMember);
        }
        
        setForceRefresh(prev => prev + 1);
      }
    } catch (error) {
      // console.error('Error rejecting timesheet:', error);
      toast({
        title: "Error",
        description: "Failed to reject timesheet",
        variant: "destructive"
      });
    }
  };

  const handleTimeUpdate = async (userId: string, weekId: string, client: string, mediaType: string, hours: number) => {
    try {
      // console.log(`Updating hours for user ${userId}, week ${weekId}, client ${client}, mediaType ${mediaType}, hours ${hours}`);
      await updateHours(userId, weekId, client, mediaType, hours);
      
      toast({
        title: "Hours Updated",
        description: "Time entry has been updated successfully",
      });
    } catch (error) {
      // console.error('Error updating hours:', error);
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
    
    const initialWeekId = firstUnderReviewWeek ? 
      firstUnderReviewWeek.week_id : 
      (firstUnconfirmedWeek ? firstUnconfirmedWeek.id : null);
    
    return (
      <>
        <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {firstUnconfirmedWeek && (
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
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
        </div>
        
        <div id="timesheet-container">
          <TimeSheet
            key={`timesheet-${selectedTeamMember}-${initialWeekId}-${forceRefresh}`}
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
            checkEarlierWeeksUnderReview={(weekId) => checkForEarlierWeeksUnderReview(weekId)}
          />
        </div>
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

      {teamMembers.length === 0 ? (
        <div className="p-4 border rounded-lg bg-gray-50">
          <p className="text-center text-gray-500">
            You don't have any team members assigned to you as User Head
          </p>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <h2 className="text-lg font-medium">My Team</h2>
              
              <TeamMemberSelector 
                currentUser={currentUser}
                users={teamMembers}
                onUserSelect={handleTeamMemberSelect}
                selectedUser={selectedTeamMember ? users.find(u => u.id === selectedTeamMember) || null : null}
                searchValue={searchTerm}
                onSearchChange={handleSearchChange}
                autoOpenOnFocus={true}
                clearSearchOnSelect={true}
                showNoResultsMessage={true}
                className="w-full md:w-[320px]"
              />
            </div>
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
              <div className="p-4 border rounded-lg bg-gray-50">
                <p className="text-center text-gray-500">
                  Select a team member to view their timesheet
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default UserHeadView;
