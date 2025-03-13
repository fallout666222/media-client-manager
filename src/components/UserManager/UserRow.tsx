
import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TeamMemberSelector } from "@/components/TeamMemberSelector";
import { User, Department } from "@/types/timesheet";

interface UserRowProps {
  user: User;
  users: User[];
  departments: Department[];
  adminUser: User;
  findUserById: (id: string | undefined) => User | undefined;
  onDepartmentChange: (user: User, departmentId: string | undefined) => void;
  onUserHeadChange: (user: User, userHeadId: string | undefined) => void;
  onHiddenChange: (user: User, hidden: boolean) => void;
}

const UserRow: React.FC<UserRowProps> = ({
  user,
  users,
  departments,
  adminUser,
  findUserById,
  onDepartmentChange,
  onUserHeadChange,
  onHiddenChange
}) => {
  // Ensure we have a valid user head or use a fallback
  const userHead = findUserById(user.user_head_id) || { id: "none", username: "No User Head" };
  
  return (
    <TableRow key={user.id}>
      <TableCell className="font-medium">{user.login || user.username}</TableCell>
      <TableCell>{user.type || user.role}</TableCell>
      <TableCell>
        <Select
          value={user.department_id || user.departmentId || "none"}
          onValueChange={(value) => {
            onDepartmentChange(user, value === "none" ? undefined : value);
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
        <TeamMemberSelector
          currentUser={adminUser}
          users={users.filter((head) => head.id !== user.id || user.user_head_id === user.id)}
          onUserSelect={(selectedUser) => {
            onUserHeadChange(user, selectedUser.id === "none" ? undefined : selectedUser.id);
          }}
          selectedUser={userHead}
        />
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center">
          <Checkbox 
            checked={user.hidden} 
            onCheckedChange={(checked) => 
              onHiddenChange(user, checked === true)
            }
            id={`hide-${user.id}`}
          />
        </div>
      </TableCell>
    </TableRow>
  );
};

export default UserRow;
