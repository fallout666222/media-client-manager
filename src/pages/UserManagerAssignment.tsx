
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { User, Department } from "@/types/timesheet";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { getUsers, getDepartments, updateUser } from "@/integrations/supabase/database";

interface UserManagerAssignmentProps {
  onUpdateUserManager: (username: string, managerId: string | undefined) => void;
  onUpdateUserDepartment: (username: string, departmentId: string | undefined) => void;
  onToggleUserHidden: (username: string, hidden: boolean) => void;
}

const UserManagerAssignment: React.FC<UserManagerAssignmentProps> = ({
  onUpdateUserManager,
  onUpdateUserDepartment,
  onToggleUserHidden
}) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch users from the database
        const { data: usersData, error: usersError } = await getUsers();
        if (usersError) throw usersError;
        setUsers(usersData || []);
        
        // Fetch departments
        const { data: deptsData, error: deptsError } = await getDepartments();
        if (deptsError) throw deptsError;
        setDepartments(deptsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);

  const handleManagerChange = async (user: User, managerId: string | undefined) => {
    if (!user.id) {
      toast({
        title: "Error",
        description: "User ID not found",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await updateUser(user.id, { manager_id: managerId });
      
      onUpdateUserManager(user.login || user.username || '', managerId);
      
      toast({
        title: "Manager Updated",
        description: `Manager assignment updated for ${user.login || user.username}`,
      });
    } catch (error) {
      console.error('Error updating user manager:', error);
      toast({
        title: "Error",
        description: "Failed to update manager",
        variant: "destructive",
      });
    }
  };

  const handleDepartmentChange = async (user: User, departmentId: string | undefined) => {
    if (!user.id) {
      toast({
        title: "Error",
        description: "User ID not found",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await updateUser(user.id, { department_id: departmentId });
      
      onUpdateUserDepartment(user.login || user.username || '', departmentId);
      
      toast({
        title: "Department Updated",
        description: `Department updated for ${user.login || user.username}`,
      });
    } catch (error) {
      console.error('Error updating user department:', error);
      toast({
        title: "Error",
        description: "Failed to update department",
        variant: "destructive",
      });
    }
  };

  const handleHiddenChange = async (user: User, hidden: boolean) => {
    if (!user.id) {
      toast({
        title: "Error",
        description: "User ID not found",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // We may need to add a 'hidden' column to the users table if it doesn't exist
      await updateUser(user.id, { hidden });
      
      onToggleUserHidden(user.login || user.username || '', hidden);
      
      toast({
        title: "Visibility Updated",
        description: `${user.login || user.username} is now ${hidden ? "hidden from" : "visible in"} manager views`,
      });
    } catch (error) {
      console.error('Error updating user visibility:', error);
      toast({
        title: "Error",
        description: "Failed to update visibility",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 pt-16 text-center">
        <p>Loading users and departments...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pt-16">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User-Manager Assignments</h1>
        <Link to="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2 z-10">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableCaption>Manage user and manager relationships</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Hide from Manager View</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.login || user.username}</TableCell>
                <TableCell>{user.type || user.role}</TableCell>
                <TableCell>
                  <Select
                    value={user.department_id || user.departmentId || "none"}
                    onValueChange={(value) => {
                      handleDepartmentChange(user, value === "none" ? undefined : value);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Department</SelectItem>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={user.manager_id || user.managerId || "none"}
                    onValueChange={(value) => {
                      handleManagerChange(user, value === "none" ? undefined : value);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Manager</SelectItem>
                      <SelectItem value={user.id}>Self-Managed</SelectItem>
                      {users
                        .filter((manager) => (manager.type === "manager" || manager.role === "manager") && manager.id !== user.id)
                        .map((manager) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            {manager.login || manager.username} ({manager.type || manager.role})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center">
                    <Checkbox 
                      checked={user.hidden} 
                      onCheckedChange={(checked) => 
                        handleHiddenChange(user, checked === true)
                      }
                      id={`hide-${user.id}`}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManagerChange(user, undefined)}
                  >
                    Clear Manager
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UserManagerAssignment;
