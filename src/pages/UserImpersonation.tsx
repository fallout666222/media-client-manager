import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const { data: usersData } = await getUsers();
        
        const { data: weeksData } = await getCustomWeeks();
        
        if (weeksData) {
          setCustomWeeks(weeksData);
          console.log(`Loaded ${weeksData.length} custom weeks from database`);
        }
        
        if (usersData) {
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
          setUsers(usersData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleImpersonateUser = async (user: User) => {
    try {
      setInitialWeekId(null);
      
      if (user.id && customWeeks.length > 0) {
        let mostRecentWeekWithHours = null;
        
        for (const week of customWeeks) {
          const { data: hoursData } = await getWeekHours(user.id, week.id);
          
          if (hoursData && hoursData.length > 0) {
            mostRecentWeekWithHours = week;
            break;
          }
        }
        
        if (mostRecentWeekWithHours) {
          console.log(`Found recent week with hours: ${mostRecentWeekWithHours.name}`);
          setInitialWeekId(mostRecentWeekWithHours.id);
        } else if (customWeeks.length > 0) {
          console.log(`No weeks with hours found, using first week: ${customWeeks[0].name}`);
          setInitialWeekId(customWeeks[0].id);
        }
      }
      
      setSelectedUser(user);
    } catch (error) {
      console.error('Error finding week with hours:', error);
      setSelectedUser(user);
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
        
        <div>
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
        </div>
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
                        >
                          <Eye className="h-4 w-4" />
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
