import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TimeSheet from "./TimeSheet";
import { User } from "@/types/timesheet";
import { useToast } from "@/hooks/use-toast";

interface UserImpersonationProps {
  users: User[];
}

const UserImpersonation = ({ users }: UserImpersonationProps) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();
  
  const handleUserSelect = (username: string) => {
    const user = users.find(u => u.username === username);
    if (user) {
      setSelectedUser(user);
      toast({
        title: "Viewing User Timesheet",
        description: `Now viewing timesheet for ${username}`,
      });
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-6">View User Timesheets</h1>
      
      <div className="w-full max-w-md">
        <Select onValueChange={handleUserSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Select a user to view" />
          </SelectTrigger>
          <SelectContent>
            {users
              .filter(user => user.role !== 'admin')
              .map((user) => (
                <SelectItem key={user.username} value={user.username}>
                  {user.username} ({user.role})
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {selectedUser && selectedUser.firstWeek ? (
        <div className="mt-6">
          <TimeSheet 
            userRole={selectedUser.role} 
            firstWeek={selectedUser.firstWeek}
            readOnly={true}
          />
        </div>
      ) : selectedUser && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p>This user hasn't had their first week set yet.</p>
        </div>
      )}
    </div>
  );
};

export default UserImpersonation;