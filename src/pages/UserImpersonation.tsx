
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserCircle, Eye } from "lucide-react";
import { getUsers } from '@/integrations/supabase/database';
import { Client, User } from '@/types/timesheet';
import TimeSheet from './TimeSheet';
import { Link } from 'react-router-dom';

interface UserImpersonationProps {
  clients: Client[];
}

const UserImpersonation = ({ clients }: UserImpersonationProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const { data } = await getUsers();
        
        if (data) {
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
          setUsers(data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  const handleImpersonateUser = (user: User) => {
    setSelectedUser(user);
  };

  const handleBackToUserList = () => {
    setSelectedUser(null);
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
        
        {/* Timesheet with admin privileges */}
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
