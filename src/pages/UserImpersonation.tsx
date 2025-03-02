
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
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface UserImpersonationProps {
  users: User[];
}

const UserImpersonation = ({ users }: UserImpersonationProps) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();
  
  // Find the admin user to use as the current user for viewing
  const adminUser = users.find(user => user.role === 'admin') || users[0];
  
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">View User Timesheets</h1>
        <Link to="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      
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
            currentUser={adminUser} // Pass the admin user as the current user
            users={users} // Pass all users
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
