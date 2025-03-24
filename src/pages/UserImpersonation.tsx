
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserCircle, Eye } from "lucide-react";
import { getUsers, getCustomWeeks, getWeekHours } from '@/integrations/supabase/database';
import { Client, User } from '@/types/timesheet';
import TimeSheet from './TimeSheet';
import { Link } from 'react-router-dom';
import { parse } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface UserImpersonationProps {
  clients: Client[];
}

const UserImpersonation = ({ clients }: UserImpersonationProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [customWeeks, setCustomWeeks] = useState<any[]>([]);
  const [initialWeekId, setInitialWeekId] = useState<string | null>(null);
  const [userDataLoading, setUserDataLoading] = useState(false);
  const { toast } = useToast();

  // Fetch basic data only once on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Parallel requests for initial data
        const [usersResponse, weeksResponse] = await Promise.all([
          getUsers(),
          getCustomWeeks()
        ]);
        
        if (weeksResponse.data) {
          setCustomWeeks(weeksResponse.data);
          console.log(`Loaded ${weeksResponse.data.length} custom weeks from database`);
        }
        
        if (usersResponse.data) {
          // Create admin user for context
          const admin: User = {
            id: 'admin',
            username: 'admin',
            login: 'admin',
            name: 'Administrator',
            role: 'admin',
            type: 'admin',
            password: '',
          };
          
          setAdminUser(admin);
          setUsers(usersResponse.data);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast({
          title: "Error loading data",
          description: "There was a problem loading user data.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [toast]);

  // Optimized function to find a week with hours, with better error handling and caching
  const findWeekWithHours = useCallback(async (userId: string) => {
    if (!userId || customWeeks.length === 0) return null;
    
    try {
      // Start from most recent week (last 10 weeks to improve performance)
      const recentWeeks = customWeeks.slice(-10);
      
      for (const week of recentWeeks) {
        const { data: hoursData, error } = await getWeekHours(userId, week.id);
        
        if (error) {
          console.warn(`Error checking hours for week ${week.id}:`, error);
          continue;
        }
        
        // If this week has hours entries, use it
        if (hoursData && hoursData.length > 0) {
          console.log(`Found recent week with hours: ${week.name}`);
          return week.id;
        }
      }
      
      // If no week with hours found, use the latest week
      if (customWeeks.length > 0) {
        console.log(`No weeks with hours found, using latest week: ${customWeeks[customWeeks.length - 1].name}`);
        return customWeeks[customWeeks.length - 1].id;
      }
      
      return null;
    } catch (error) {
      console.error('Error finding week with hours:', error);
      return null;
    }
  }, [customWeeks]);

  const handleImpersonateUser = async (user: User) => {
    if (userDataLoading) return; // Prevent multiple requests
    
    try {
      setUserDataLoading(true);
      
      // Reset initial week ID
      setInitialWeekId(null);
      
      // Only try to find initial week if user has a first custom week ID
      if (user.id) {
        const weekId = await findWeekWithHours(user.id);
        if (weekId) {
          setInitialWeekId(weekId);
        } else if (user.firstCustomWeekId) {
          setInitialWeekId(user.firstCustomWeekId);
        } else if (customWeeks.length > 0) {
          setInitialWeekId(customWeeks[0].id);
        }
      }
      
      // Set the selected user
      setSelectedUser(user);
    } catch (error) {
      console.error('Error preparing user data:', error);
      toast({
        title: "Error",
        description: "Could not load user timesheet data",
        variant: "destructive"
      });
    } finally {
      setUserDataLoading(false);
    }
  };

  const handleBackToUserList = () => {
    setSelectedUser(null);
    setInitialWeekId(null);
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.login?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedUser && adminUser) {
    return (
      <div className="container mx-auto p-4 pt-16">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Viewing User: {selectedUser.name}</h1>
          <Button onClick={handleBackToUserList} variant="outline">
            Back to User List
          </Button>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>User Details</CardTitle>
            <CardDescription>Information about the selected user</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Name:</strong> {selectedUser.name}</p>
                <p><strong>Login:</strong> {selectedUser.login}</p>
                <p><strong>Email:</strong> {selectedUser.email || 'Not provided'}</p>
              </div>
              <div>
                <p><strong>Role:</strong> {selectedUser.type}</p>
                <p><strong>Job Position:</strong> {selectedUser.job_position || 'Not specified'}</p>
                <p><strong>User ID:</strong> {selectedUser.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {customWeeks.length === 0 && (
          <Card className="mb-6 border-yellow-400 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start">
                <div className="mr-2 mt-0.5 text-yellow-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">No Custom Weeks Found</h4>
                  <p className="mt-1 text-sm text-yellow-700">
                    No custom weeks are available in the database. The timesheet will display correctly,
                    but "Return to First Unsubmitted Week" functionality will be limited.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {userDataLoading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="ml-3 text-lg">Loading timesheet data...</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-4">Timesheet Management</h2>
            <p className="text-sm text-muted-foreground mb-4">
              As an administrator, you can view and edit this user's timesheet, submit weeks for review,
              approve or reject weeks under review, and make changes regardless of the week's status.
            </p>
            
            <TimeSheet 
              userRole="admin" 
              firstWeek={selectedUser.firstWeek || selectedUser.first_week || '2024-01-01'} 
              currentUser={adminUser}
              users={users}
              clients={clients}
              impersonatedUser={selectedUser}
              adminOverride={true}
              customWeeks={customWeeks}
              initialWeekId={initialWeekId}
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pt-16">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      
      <div className="relative mb-6">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search users..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>View and manage all users in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Login</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Loading users...</TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">No users found</TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.login}</TableCell>
                      <TableCell>{user.email || 'Not provided'}</TableCell>
                      <TableCell className="capitalize">{user.type}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleImpersonateUser(user)}
                          className="flex items-center gap-1"
                          disabled={userDataLoading}
                        >
                          {userDataLoading ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-t-2 border-primary" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          Impersonate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} users
          </div>
          <div>
            <Link to="/">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default UserImpersonation;
