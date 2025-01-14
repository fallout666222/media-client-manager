import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/types/timesheet";
import { format } from "date-fns";

interface FirstWeekManagementProps {
  onSetFirstWeek: (username: string, date: string) => void;
}

export const FirstWeekManagement = ({ onSetFirstWeek }: FirstWeekManagementProps) => {
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

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold">Set User's First Working Week</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <Input
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