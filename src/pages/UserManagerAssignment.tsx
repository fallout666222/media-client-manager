
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
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { getUsers, getDepartments, updateUser } from "@/integrations/supabase/database";
import SearchBar from "@/components/SearchBar";

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
  
  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchData();
  }, [toast]);

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
      
      // Update the users state to reflect the changes immediately
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === user.id ? { ...u, manager_id: managerId } : u
        )
      );
      
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

  const handleUserHeadChange = async (user: User, userHeadId: string | undefined) => {
    if (!user.id) {
      toast({
        title: "Error",
        description: "User ID not found",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await updateUser(user.id, { user_head_id: userHeadId });
      
      // Update the users state to reflect the changes immediately
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === user.id ? { ...u, user_head_id: userHeadId } : u
        )
      );
      
      toast({
        title: "User Head Updated",
        description: `User Head updated for ${user.login || user.username}`,
      });
    } catch (error) {
      console.error('Error updating user head:', error);
      toast({
        title: "Error",
        description: "Failed to update user head",
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
      
      // Find department name for immediate UI update
      const departmentName = departmentId 
        ? departments.find(dept => dept.id === departmentId)?.name || null
        : null;
      
      // Update the users state to reflect the changes immediately
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === user.id 
            ? { ...u, department_id: departmentId, departmentId: departmentId, departmentName: departmentName } 
            : u
        )
      );
      
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
      await updateUser(user.id, { hidden });
      
      onToggleUserHidden(user.login || user.username || '', hidden);
      
      // Update the users state to reflect the changes immediately
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === user.id ? { ...u, hidden } : u
        )
      );
      
      toast({
        title: "Visibility Updated",
        description: `${user.login || user.username} is now ${hidden ? "hidden from" : "visible in"} User Head views`,
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

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const searchValue = searchTerm.toLowerCase();
    const username = (user.login || user.username || "").toLowerCase();
    const role = (user.type || user.role || "").toLowerCase();
    const department = user.departmentName?.toLowerCase() || "";
    
    return username.includes(searchValue) || 
           role.includes(searchValue) || 
           department.includes(searchValue);
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle search change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing items per page
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
      
      <div className="flex items-center justify-between mb-4">
        <SearchBar 
          value={searchTerm} 
          onChange={handleSearchChange} 
          placeholder="Search users..." 
          className="w-full max-w-sm"
        />
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Items per page:</span>
          <Select 
            value={itemsPerPage.toString()} 
            onValueChange={handleItemsPerPageChange}
          >
            <SelectTrigger className="w-20">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableCaption>Manage user and manager relationships</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>User Head</TableHead>
              <TableHead className="text-center">Hide from User Head View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.map((user) => (
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
                    value={user.user_head_id || "none"}
                    onValueChange={(value) => {
                      handleUserHeadChange(user, value === "none" ? undefined : value);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a user head" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No User Head</SelectItem>
                      {users
                        .filter((head) => head.id !== user.id || user.user_head_id === user.id) // Allow self-assignment if already self-assigned
                        .map((head) => (
                          <SelectItem key={head.id} value={head.id}>
                            {head.login || head.username} ({head.type || head.role})
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagerAssignment;
