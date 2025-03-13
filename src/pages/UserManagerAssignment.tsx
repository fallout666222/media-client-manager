
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
import { ArrowLeft, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { getUsers, getDepartments, updateUser } from "@/integrations/supabase/database";
import SearchBar from "@/components/SearchBar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
  
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // For popover states
  const [openUserHeadPopovers, setOpenUserHeadPopovers] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    fetchData();
  }, [toast]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: usersData, error: usersError } = await getUsers();
      if (usersError) throw usersError;
      setUsers(usersData || []);
      
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
      console.log('Updating user head, user_head_id value:', userHeadId);
      
      const updatedValue = userHeadId === undefined || userHeadId === "none" ? null : userHeadId;
      
      await updateUser(user.id, { user_head_id: updatedValue });
      
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === user.id ? { ...u, user_head_id: updatedValue } : u
        )
      );
      
      setOpenUserHeadPopovers(prev => ({...prev, [user.id]: false}));
      
      toast({
        title: "User Head Updated",
        description: `User Head ${updatedValue ? 'updated' : 'removed'} for ${user.login || user.username}`,
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
      console.log('Updating department, department_id value:', departmentId);
      
      const updatedValue = departmentId === undefined || departmentId === "none" ? null : departmentId;
      
      await updateUser(user.id, { department_id: updatedValue });
      
      onUpdateUserDepartment(user.login || user.username || '', updatedValue || undefined);
      
      const departmentName = updatedValue 
        ? departments.find(dept => dept.id === updatedValue)?.name || null
        : null;
      
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === user.id 
            ? { 
                ...u, 
                department_id: updatedValue, 
                departmentId: updatedValue, 
                departmentName: departmentName 
              } 
            : u
        )
      );
      
      toast({
        title: "Department Updated",
        description: `Department ${updatedValue ? 'updated' : 'removed'} for ${user.login || user.username}`,
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

  const filteredUsers = users.filter(user => {
    const searchValue = searchTerm.toLowerCase();
    const username = (user.login || user.username || "").toLowerCase();
    const role = (user.type || user.role || "").toLowerCase();
    const department = user.departmentName?.toLowerCase() || "";
    
    return username.includes(searchValue) || 
           role.includes(searchValue) || 
           department.includes(searchValue);
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const toggleUserHeadPopover = (userId: string) => {
    setOpenUserHeadPopovers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
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
                  <Popover 
                    open={openUserHeadPopovers[user.id]} 
                    onOpenChange={() => toggleUserHeadPopover(user.id)}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openUserHeadPopovers[user.id]}
                        className="w-full justify-between"
                      >
                        {user.user_head_id ? 
                          users.find(u => u.id === user.user_head_id)?.login || "Select a user head" : 
                          "No User Head"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <div className="flex items-center border-b px-3">
                          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                          <CommandInput placeholder="Search user head..." className="border-0 focus:ring-0" />
                        </div>
                        <CommandEmpty>No user head found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="none"
                            onSelect={() => handleUserHeadChange(user, undefined)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                !user.user_head_id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            No User Head
                          </CommandItem>
                          {users
                            .filter((head) => head.id !== user.id || user.user_head_id === user.id)
                            .map((head) => (
                              <CommandItem
                                key={head.id}
                                value={head.login || head.username || ""}
                                onSelect={() => handleUserHeadChange(user, head.id)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    user.user_head_id === head.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {head.login || head.username} ({head.type || head.role})
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
