
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import TimeSheet from '@/pages/TimeSheet';
import { User } from '@/types/timesheet';
import { supabase } from '@/integrations/supabase/client';

const UserHeadView = () => {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [selectedTeamMember, setSelectedTeamMember] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [customWeeks, setCustomWeeks] = useState([]);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    fetchCurrentUser();
    fetchCustomWeeks();
    fetchClients();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const sessionResponse = await supabase.auth.getSession();
      if (!sessionResponse.data.session) {
        toast({
          title: "Not authenticated",
          description: "Please login to view this page",
          variant: "destructive"
        });
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('login', sessionResponse.data.session.user.email)
        .single();

      if (userError) throw userError;
      setCurrentUser(userData);

      fetchTeamMembers(userData.id);
    } catch (error) {
      console.error('Error fetching current user:', error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive"
      });
    }
  };

  const fetchTeamMembers = async (userHeadId: string) => {
    setLoading(true);
    try {
      const { data: membersData, error: membersError } = await supabase
        .from('users')
        .select('*')
        .eq('user_head_id', userHeadId)
        .eq('deletion_mark', false);

      if (membersError) throw membersError;
      
      setTeamMembers(membersData || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast({
        title: "Error",
        description: "Failed to load team members",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const fetchCustomWeeks = async () => {
    try {
      const { data, error } = await supabase.from('custom_weeks').select('*').order('period_from', { ascending: true });
      if (error) throw error;
      setCustomWeeks(data || []);
    } catch (error) {
      console.error('Error fetching custom weeks:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase.from('clients').select('*').eq('deletion_mark', false);
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleTeamMemberChange = (memberId: string) => {
    const teamMember = teamMembers.find(member => member.id === memberId);
    if (teamMember) {
      setSelectedTeamMember(teamMember);
    }
  };

  if (loading || !currentUser) {
    return <div className="container mx-auto p-6 text-center">Loading...</div>;
  }

  if (teamMembers.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">User Head View</h1>
          <Link to="/">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <div className="bg-muted p-6 rounded-lg text-center">
          <p>You don't have any team members assigned to you yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User Head View</h1>
        <Link to="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Select Team Member:</h2>
        <Select onValueChange={handleTeamMemberChange} value={selectedTeamMember?.id || ''}>
          <SelectTrigger className="w-full md:w-1/2">
            <SelectValue placeholder="Select a team member" />
          </SelectTrigger>
          <SelectContent>
            {teamMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name} ({member.login})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedTeamMember && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-4">
            Viewing Timesheet for: {selectedTeamMember.name}
          </h2>
          <TimeSheet
            userRole="user"
            firstWeek={selectedTeamMember.first_week || null}
            currentUser={currentUser as any}
            users={teamMembers}
            clients={clients}
            impersonatedUser={selectedTeamMember as any}
            readOnly={false}
            customWeeks={customWeeks}
          />
        </div>
      )}
    </div>
  );
};

export default UserHeadView;
