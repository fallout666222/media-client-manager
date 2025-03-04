
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { User, CustomWeek } from "@/types/timesheet";
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
import { getCustomWeeks, updateUser, getUsers } from "@/integrations/supabase/database";

interface UserFirstWeekManagementProps {
  onSetFirstWeek: (username: string, date: string, weekId: string) => void;
}

const UserFirstWeekManagement = ({ onSetFirstWeek }: UserFirstWeekManagementProps) => {
  const { toast } = useToast();
  const [selectedWeeks, setSelectedWeeks] = useState<Record<string, string>>({});
  const [customWeeks, setCustomWeeks] = useState<CustomWeek[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch users from the database
        const { data: usersData, error: usersError } = await getUsers();
        if (usersError) throw usersError;
        setUsers(usersData || []);
        
        // Fetch custom weeks
        const { data: weeksData, error: weeksError } = await getCustomWeeks();
        if (weeksError) throw weeksError;
        setCustomWeeks(weeksData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);

  const handleWeekChange = (userId: string, weekId: string) => {
    setSelectedWeeks(prev => ({ ...prev, [userId]: weekId }));
  };

  const handleSaveWeek = async (user: User, weekId: string) => {
    const selectedWeek = customWeeks.find(week => week.id === weekId);
    if (!selectedWeek) return;
    
    if (user.id) {
      try {
        await updateUser(user.id, {
          first_custom_week_id: weekId,
          first_week: selectedWeek.period_from
        });
        
        onSetFirstWeek(user.username || user.login || '', selectedWeek.period_from, weekId);
        
        toast({
          title: "First week updated",
          description: `First week for ${user.username || user.login} set to ${formatWeekLabel(selectedWeek)}`,
        });
      } catch (error) {
        console.error('Error updating user first week:', error);
        toast({
          title: "Error",
          description: "Failed to update first week",
          variant: "destructive"
        });
      }
    }
  };

  const formatWeekLabel = (week: CustomWeek) => {
    if (!week) return "Unknown week";
    const startDateField = week.period_from || week.startDate;
    const endDateField = week.period_to || week.endDate;
    const hoursField = week.required_hours || week.hours;
    
    if (!startDateField || !endDateField) return week.name || "Unnamed week";
    
    const start = format(parse(startDateField, "yyyy-MM-dd", new Date()), "MMM dd, yyyy");
    const end = format(parse(endDateField, "yyyy-MM-dd", new Date()), "MMM dd, yyyy");
    return `${week.name}: ${start} - ${end} (${hoursField}h)`;
  };

  const getCurrentWeekId = (user: User) => {
    if (user.first_custom_week_id || user.firstCustomWeekId) return user.first_custom_week_id || user.firstCustomWeekId;
    if (!user.first_week && !user.firstWeek) return "";
    
    const firstWeek = user.first_week || user.firstWeek;
    const matchingWeek = customWeeks.find(week => 
      (week.period_from === firstWeek) || (week.startDate === firstWeek)
    );
    
    return matchingWeek ? matchingWeek.id : "";
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 pt-16 text-center">
        <p>Loading users and week data...</p>
      </div>
    );
  }

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
      
      {users.length === 0 ? (
        <div className="text-center py-8">
          <p>No users found. Please add users to the system.</p>
        </div>
      ) : (
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
                const userId = user.id || '';
                const currentWeekId = getCurrentWeekId(user);
                const selectedWeekId = selectedWeeks[userId] || "";
                const currentFirstWeek = customWeeks.find(week => week.id === currentWeekId);
                
                return (
                  <TableRow key={userId}>
                    <TableCell className="font-medium">{user.login || user.username}</TableCell>
                    <TableCell>{user.type || user.role}</TableCell>
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
                          {customWeeks.map((week) => (
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
      )}
    </div>
  );
};

export default UserFirstWeekManagement;
