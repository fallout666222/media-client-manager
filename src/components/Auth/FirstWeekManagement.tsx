import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/types/timesheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface FirstWeekManagementProps {
  onSetFirstWeek: (username: string, date: string) => void;
  users: User[];
}

export const FirstWeekManagement = ({ onSetFirstWeek, users }: FirstWeekManagementProps) => {
  const [username, setUsername] = useState("");
  const [startDate, setStartDate] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !startDate) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    onSetFirstWeek(username, startDate);
    setUsername("");
    setStartDate("");
    toast({
      title: "Success",
      description: "First week set successfully",
    });
  };

  // Filter out users who already have a first week set
  const usersWithoutFirstWeek = users.filter(user => !user.firstWeek);

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold">Set User's First Working Week</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Select User</Label>
          <Select value={username} onValueChange={setUsername}>
            <SelectTrigger>
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent>
              {usersWithoutFirstWeek.map((user) => (
                <SelectItem key={user.username} value={user.username}>
                  {user.username} ({user.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="startDate">First Week Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full">
          Set First Week
        </Button>
      </form>
    </div>
  );
};