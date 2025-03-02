
import React, { useState } from 'react';
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
      <h1 className="text-2xl font-bold mb-6">User-Manager Assignments</h1>
      
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
                    value={user.managerId || ""}
                    onValueChange={(value) => {
                      handleManagerChange(user.username, value === "" ? undefined : value);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Manager</SelectItem>
                      <SelectItem value={user.username}>Self-Managed</SelectItem>
                      {users
                        .filter((manager) => manager.role === "manager" && manager.username !== user.username)
                        .map((manager) => (
                          <SelectItem key={manager.username} value={manager.username}>
                            {manager.username}
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
