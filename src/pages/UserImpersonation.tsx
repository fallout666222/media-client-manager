
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import { User, Client, UserFormData } from "@/types/timesheet";
import * as db from "@/integrations/supabase/database";
import { useToast } from "@/hooks/use-toast";
import { UserManagement } from "@/components/Auth/UserManagement";

interface UserImpersonationProps {
  users?: User[];
  clients?: Client[];
}

const UserImpersonation: React.FC<UserImpersonationProps> = ({ clients }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await db.getUsers();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        console.log("Fetched users:", data);
        const mappedUsers = data.map(user => ({
          id: user.id,
          username: user.login,
          name: user.name,
          password: user.password,
          role: user.type as 'admin' | 'user' | 'manager',
          type: user.type,
          login: user.login,
          email: user.email,
          job_position: user.job_position,
          description: user.description,
          department_id: user.department_id,
          departmentId: user.department_id,
          first_week: user.first_week,
          firstWeek: user.first_week,
          first_custom_week_id: user.first_custom_week_id,
          firstCustomWeekId: user.first_custom_week_id,
          deletion_mark: user.deletion_mark,
          departmentName: user.department ? user.department.name : null
        }));
        setUsers(mappedUsers);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: UserFormData) => {
    try {
      const newUser = {
        name: userData.username,
        login: userData.username,
        password: userData.password,
        type: userData.role,
      };
      
      const { data, error } = await db.createUser(newUser);
      
      if (error) {
        console.error('Error creating user:', error);
        throw error;
      }
      
      if (data) {
        // Refresh user list after creating a new user
        fetchUsers();
        
        toast({
          title: "User Created",
          description: `New ${userData.role} account created: ${userData.username}`,
        });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4 pt-16">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Link to="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Add UserManagement component */}
      <div className="mb-8">
        <UserManagement onCreateUser={handleCreateUser} />
      </div>

      {loading ? (
        <div className="text-center py-8">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-8">No users found</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Login</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>First Custom Week</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.login}</TableCell>
                <TableCell>{user.type}</TableCell>
                <TableCell>
                  {user.departmentName || "Not assigned"}
                </TableCell>
                <TableCell>{user.first_custom_week_id || "Not set"}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Implement impersonation logic if needed
                      toast({
                        title: "Impersonation",
                        description: `Impersonating ${user.name} (${user.login})`,
                      });
                    }}
                  >
                    Impersonate
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default UserImpersonation;
