
import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { User, Department } from "@/types/timesheet";
import SearchBar from "@/components/SearchBar";
import UserTable from "@/components/UserManager/UserTable";
import PaginationControls from "@/components/UserManager/PaginationControls";
import ItemsPerPageSelector from "@/components/UserManager/ItemsPerPageSelector";
import {
  fetchUsers,
  fetchDepartments,
  updateUserManager,
  updateUserDepartment,
  updateUserHead,
  updateUserVisibility
} from "@/services/userManagerService";

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

  useEffect(() => {
    fetchData();
  }, [toast]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersData = await fetchUsers();
      setUsers(usersData);
      
      const deptsData = await fetchDepartments();
      setDepartments(deptsData);
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
      await updateUserManager(user.id, managerId);
      
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
      await updateUserHead(user.id, userHeadId);
      
      const updatedValue = userHeadId === undefined || userHeadId === "none" ? null : userHeadId;
      
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === user.id ? { ...u, user_head_id: updatedValue } : u
        )
      );
      
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
      await updateUserDepartment(user.id, departmentId);
      
      onUpdateUserDepartment(user.login || user.username || '', departmentId);
      
      const updatedValue = departmentId === undefined || departmentId === "none" ? null : departmentId;
      
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
      await updateUserVisibility(user.id, hidden);
      
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

  const findUserById = (id: string | undefined): User | undefined => {
    if (!id) return undefined;
    return users.find(u => u.id === id);
  };

  const adminUser: User = {
    id: "admin",
    username: "Admin",
    role: "admin"
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
        
        <ItemsPerPageSelector 
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </div>
      
      <UserTable 
        users={paginatedUsers}
        allUsers={users}
        departments={departments}
        adminUser={adminUser}
        findUserById={findUserById}
        onDepartmentChange={handleDepartmentChange}
        onUserHeadChange={handleUserHeadChange}
        onHiddenChange={handleHiddenChange}
      />
      
      <PaginationControls 
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={filteredUsers.length}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
    </div>
  );
};

export default UserManagerAssignment;
