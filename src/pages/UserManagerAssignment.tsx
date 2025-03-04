
import React from 'react';
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
import { ArrowLeft, Folder } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface UserManagerAssignmentProps {
  users: User[];
  departments: Department[];
  onUpdateUserManager: (username: string, managerId: string | undefined) => void;
  onUpdateUserDepartment: (username: string, departmentId: string | undefined) => void;
  onToggleHideFromManager: (username: string, hide: boolean) => void;
}

const UserManagerAssignment: React.FC<UserManagerAssignmentProps> = ({
  users,
  departments,
  onUpdateUserManager,
  onUpdateUserDepartment,
  onToggleHideFromManager,
}) => {
  const { toast } = useToast();

  const handleManagerChange = (username: string, managerId: string | undefined) => {
    onUpdateUserManager(username, managerId);
    toast({
      title: "Manager Updated",
      description: `Manager assignment updated for ${username}`,
    });
  };

  const handleDepartmentChange = (username: string, departmentId: string | undefined) => {
    onUpdateUserDepartment(username, departmentId);
    toast({
      title: "Department Updated",
      description: `Department assignment updated for ${username}`,
    });
  };

  const handleHideToggle = (username: string, checked: boolean) => {
    onToggleHideFromManager(username, checked);
    toast({
      title: checked ? "User Hidden" : "User Visible",
      description: `User ${username} is now ${checked ? "hidden from" : "visible to"} managers`,
    });
  };

  const getDepartmentName = (departmentId: string | undefined) => {
    if (!departmentId) return "None";
    const department = departments.find(dept => dept.id === departmentId);
    return department ? department.name : "Unknown";
  };

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
              <TableHead>Hide from Manager</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.username}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <Select
                    value={user.departmentId || "none"}
                    onValueChange={(value) => {
                      handleDepartmentChange(user.username, value === "none" ? undefined : value);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a department">
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4" />
                          {getDepartmentName(user.departmentId)}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4" />
                          No Department
                        </div>
                      </SelectItem>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          <div className="flex items-center gap-2">
                            <Folder className="h-4 w-4" />
                            {department.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={user.managerId || "none"}
                    onValueChange={(value) => {
                      handleManagerChange(user.username, value === "none" ? undefined : value);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Manager</SelectItem>
                      <SelectItem value={user.username}>Self-Managed</SelectItem>
                      {users
                        .filter((manager) => (manager.role === "manager" || manager.role === "user") && manager.username !== user.username)
                        .map((manager) => (
                          <SelectItem key={manager.username} value={manager.username}>
                            {manager.username} ({manager.role})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Checkbox 
                    checked={user.hideFromManager || false}
                    onCheckedChange={(checked) => {
                      handleHideToggle(user.username, !!checked);
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManagerChange(user.username, undefined)}
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
