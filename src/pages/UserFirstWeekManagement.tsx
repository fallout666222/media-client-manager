import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/types/timesheet";
import {
  Table,
  TableBody,
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
import { format, parse } from "date-fns";
import { Calendar, CheckCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const DEFAULT_WEEKS = [
  { id: "1", startDate: "2025-01-01", endDate: "2025-01-06", hours: 48 },
  { id: "2", startDate: "2025-01-10", endDate: "2025-01-03", hours: 40 },
  { id: "3", startDate: "2025-01-13", endDate: "2025-01-17", hours: 40 },
  { id: "4", startDate: "2025-01-20", endDate: "2025-01-24", hours: 40 },
  { id: "5", startDate: "2025-01-27", endDate: "2025-01-31", hours: 40 },
];

interface UserFirstWeekManagementProps {
  users: User[];
  onSetFirstWeek: (username: string, date: string) => void;
}

const UserFirstWeekManagement = ({ users, onSetFirstWeek }: UserFirstWeekManagementProps) => {
  const { toast } = useToast();
  const [selectedWeeks, setSelectedWeeks] = useState<Record<string, string>>({});

  const handleWeekChange = (userId: string, weekId: string) => {
    setSelectedWeeks(prev => ({ ...prev, [userId]: weekId }));
  };

  const handleSaveWeek = (user: User, weekId: string) => {
    const selectedWeek = DEFAULT_WEEKS.find(week => week.id === weekId);
    if (!selectedWeek) return;
    
    onSetFirstWeek(user.username, selectedWeek.startDate);
    toast({
      title: "First week updated",
      description: `First week for ${user.username} set to ${formatWeekLabel(selectedWeek)}`,
    });
  };

  const formatWeekLabel = (week: typeof DEFAULT_WEEKS[0]) => {
    const start = format(parse(week.startDate, "yyyy-MM-dd", new Date()), "MMM dd, yyyy");
    const end = format(parse(week.endDate, "yyyy-MM-dd", new Date()), "MMM dd, yyyy");
    return `${start} - ${end} (${week.hours}h)`;
  };

  const getCurrentWeekId = (firstWeek: string | undefined) => {
    if (!firstWeek) return "";
    const matchingWeek = DEFAULT_WEEKS.find(week => week.startDate === firstWeek);
    return matchingWeek ? matchingWeek.id : "";
  };

  return (
    <div className="container mx-auto py-10 pt-16">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          User First Week Management
        </h1>
        <Link to="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2 z-10">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Current First Week</TableHead>
              <TableHead>New First Week</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const userId = user.id || user.username;
              const currentWeekId = getCurrentWeekId(user.firstWeek);
              const selectedWeekId = selectedWeeks[userId] || "";
              const currentFirstWeek = user.firstWeek 
                ? DEFAULT_WEEKS.find(week => week.startDate === user.firstWeek)
                : undefined;
              
              return (
                <TableRow key={userId}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    {currentFirstWeek 
                      ? formatWeekLabel(currentFirstWeek)
                      : <span className="text-muted-foreground italic">Not set</span>}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={selectedWeekId}
                      onValueChange={(value) => handleWeekChange(userId, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a week" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_WEEKS.map((week) => (
                          <SelectItem key={week.id} value={week.id}>
                            {formatWeekLabel(week)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      disabled={!selectedWeekId || selectedWeekId === currentWeekId}
                      onClick={() => handleSaveWeek(user, selectedWeekId)}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Save
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UserFirstWeekManagement;
