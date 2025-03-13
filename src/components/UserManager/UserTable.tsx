
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
import UserRow from "./UserRow";
import { User, Department } from "@/types/timesheet";

interface UserTableProps {
  users: User[];
  allUsers: User[];
  departments: Department[];
  adminUser: User;
  findUserById: (id: string | undefined) => User | undefined;
  onDepartmentChange: (user: User, departmentId: string | undefined) => void;
  onUserHeadChange: (user: User, userHeadId: string | undefined) => void;
  onHiddenChange: (user: User, hidden: boolean) => void;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  allUsers,
  departments,
  adminUser,
  findUserById,
  onDepartmentChange,
  onUserHeadChange,
  onHiddenChange
}) => {
  return (
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
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              users={allUsers}
              departments={departments}
              adminUser={adminUser}
              findUserById={findUserById}
              onDepartmentChange={onDepartmentChange}
              onUserHeadChange={onUserHeadChange}
              onHiddenChange={onHiddenChange}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserTable;
