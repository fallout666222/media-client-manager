
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { User, CustomWeek } from "@/types/timesheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getCustomWeeks } from "@/integrations/supabase/database";

interface FirstWeekManagementProps {
  onSetFirstWeek: (username: string, date: string, weekId?: string) => void;
  users: User[];
}

export const FirstWeekManagement = ({ onSetFirstWeek, users }: FirstWeekManagementProps) => {
  const [username, setUsername] = useState("");
  const [selectedWeekId, setSelectedWeekId] = useState("");
  const { toast } = useToast();
  const [customWeeks, setCustomWeeks] = useState<CustomWeek[]>([]);

  useEffect(() => {
    const fetchCustomWeeks = async () => {
      try {
        const { data } = await getCustomWeeks();
        if (data) {
          setCustomWeeks(data);
        }
      } catch (error) {
        console.error('Error fetching custom weeks:', error);
      }
    };
    
    fetchCustomWeeks();
  }, []);

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
    
    const selectedWeek = customWeeks.find(week => week.id === selectedWeekId);
    if (!selectedWeek) {
      toast({
        title: "Error",
        description: "Invalid week selected",
        variant: "destructive",
      });
      return;
    }
    
    const startDate = selectedWeek.period_from || selectedWeek.startDate;
    if (!startDate) {
      toast({
        title: "Error",
        description: "Selected week has no start date",
        variant: "destructive",
      });
      return;
    }
    
    onSetFirstWeek(username, startDate, selectedWeekId);
    setUsername("");
    setSelectedWeekId("");
    toast({
      title: "Success",
      description: "First week set successfully",
    });
  };

  // Filter out users who already have a first week set
  const usersWithoutFirstWeek = users.filter(user => !user.firstWeek && !user.firstCustomWeekId);

  const formatWeekLabel = (week: CustomWeek) => {
    if (!week) return "Unknown week";
    const startDateField = week.period_from || week.startDate;
    const endDateField = week.period_to || week.endDate;
    const hoursField = week.required_hours || week.hours;
    
    if (!startDateField || !endDateField) return week.name || "Unnamed week";
    
    return `${week.name}: ${startDateField} - ${endDateField} (${hoursField}h)`;
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
              {customWeeks.map((week) => (
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
