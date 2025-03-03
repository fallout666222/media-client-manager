
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
import { User } from "@/types/timesheet";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface UserManagerAssignmentProps {
  users: User[];
  onUpdateUserManager: (username: string, managerId: string | undefined) => void;
}

const UserManagerAssignment: React.FC<UserManagerAssignmentProps> = ({
  users,
  onUpdateUserManager,
}) => {
  const { toast } = useToast();

  const handleManagerChange = (username: string, managerId: string | undefined) => {
    onUpdateUserManager(username, managerId);
    toast({
      title: "Manager Updated",
      description: `Manager assignment updated for ${username}`,
    });
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
              <TableHead>Manager</TableHead>
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
