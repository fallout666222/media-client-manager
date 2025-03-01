
import { useState } from "react";
import { Button } from "@/components/ui/button";
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

// Use the same custom weeks format as in WeekPicker
const DEFAULT_WEEKS = [
  { id: "1", startDate: "2025-01-01", endDate: "2025-01-06", hours: 48 },
  { id: "2", startDate: "2025-01-10", endDate: "2025-01-03", hours: 40 },
  { id: "3", startDate: "2025-01-13", endDate: "2025-01-17", hours: 40 },
  { id: "4", startDate: "2025-01-20", endDate: "2025-01-24", hours: 40 },
  { id: "5", startDate: "2025-01-27", endDate: "2025-01-31", hours: 40 },
];

export const FirstWeekManagement = ({ onSetFirstWeek, users }: FirstWeekManagementProps) => {
  const [username, setUsername] = useState("");
  const [selectedWeekId, setSelectedWeekId] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !selectedWeekId) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    const selectedWeek = DEFAULT_WEEKS.find(week => week.id === selectedWeekId);
    if (!selectedWeek) {
      toast({
        title: "Error",
        description: "Invalid week selected",
        variant: "destructive",
      });
      return;
    }
    
    onSetFirstWeek(username, selectedWeek.startDate);
    setUsername("");
    setSelectedWeekId("");
    toast({
      title: "Success",
      description: "First week set successfully",
    });
  };

  // Filter out users who already have a first week set
  const usersWithoutFirstWeek = users.filter(user => !user.firstWeek);

  const formatWeekLabel = (week: typeof DEFAULT_WEEKS[0]) => {
    return `Week ${week.id}: ${week.startDate} - ${week.endDate} (${week.hours}h)`;
  };

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
          <Label htmlFor="weekSelect">First Week</Label>
          <Select value={selectedWeekId} onValueChange={setSelectedWeekId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a custom week" />
            </SelectTrigger>
            <SelectContent>
              {DEFAULT_WEEKS.map((week) => (
                <SelectItem key={week.id} value={week.id}>
                  {formatWeekLabel(week)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="w-full">
          Set First Week
        </Button>
      </form>
    </div>
  );
};
