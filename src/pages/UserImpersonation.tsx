import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { User } from '@/types/timesheet';
import TimeSheet from './TimeSheet';

interface UserImpersonationProps {
  users: User[];
  clients: any[];
}

export const UserImpersonation: React.FC<UserImpersonationProps> = ({ users, clients }) => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const { toast } = useToast();

  const renderUserTimesheet = (user: User) => {
    if (!user.firstWeek) {
      return (
        <div className="p-4 border rounded-lg bg-gray-50">
          <p className="text-center text-gray-500">
            This user does not have a first week set
          </p>
        </div>
      );
    }
    
    return (
      <TimeSheet
        userRole={user.role}
        firstWeek={user.firstWeek}
        currentUser={user}
        users={users}
        readOnly={true}
        clients={clients}
      />
    );
  };

  return (
    <div className="container mx-auto p-4 pt-16">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User Impersonation</h1>
        <Link to="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-medium mb-4">Select User</h2>
        <Table>
          <TableCaption>Select a user to impersonate and view their timesheet</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.username}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <Button onClick={() => setSelectedUser(user.id || null)} variant="outline" size="sm">
                    View Timesheet
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedUser && (
        <div className="mt-8">
          <h2 className="text-lg font-medium mb-4">Timesheet</h2>
          {users.filter(user => user.id === selectedUser).map(renderUserTimesheet)}
        </div>
      )}
    </div>
  );
};
