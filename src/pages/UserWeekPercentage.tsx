
import React, { useState, useEffect } from "react";
import { User, CustomWeek, WeekPercentage } from "@/types/timesheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getUsers, getCustomWeeks, getWeekPercentages, updateWeekPercentage } from "@/integrations/supabase/database";

const DEFAULT_WEEKS: CustomWeek[] = [
  { id: "1", name: "Week 1", startDate: "2025-01-01", endDate: "2025-01-06", hours: 48 },
  { id: "2", name: "Week 2", startDate: "2025-01-10", endDate: "2025-01-03", hours: 40 },
  { id: "3", name: "Week 3", startDate: "2025-01-13", endDate: "2025-01-17", hours: 40 },
  { id: "4", name: "Week 4", startDate: "2025-01-20", endDate: "2025-01-24", hours: 40 },
  { id: "5", name: "Week 5", startDate: "2025-01-27", endDate: "2025-01-31", hours: 40 },
];

const UserWeekPercentage = () => {
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [weekPercentages, setWeekPercentages] = useState<WeekPercentageEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [customWeeks, setCustomWeeks] = useState<CustomWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Define the structure for week percentage entries
  interface WeekPercentageEntry {
    userId: string;
    weekId: string;
    percentage: number;
  }

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

  // Fetch week percentages when a user is selected
  useEffect(() => {
    const fetchWeekPercentages = async () => {
      if (!selectedUser) return;
      
      try {
        const { data, error } = await getWeekPercentages(selectedUser);
        if (error) throw error;
        
        if (data) {
          // Convert to the expected format
          const formattedData: WeekPercentageEntry[] = data.map(wp => ({
            userId: wp.user_id,
            weekId: wp.week_id,
            percentage: Number(wp.percentage)
          }));
          
          setWeekPercentages(formattedData);
        }
      } catch (error) {
        console.error('Error fetching week percentages:', error);
        toast({
          title: "Error",
          description: "Failed to load week percentages",
          variant: "destructive"
        });
      }
    };
    
    fetchWeekPercentages();
  }, [selectedUser, toast]);

  const getWeekPercentage = (userId: string, weekId: string): number => {
    const entry = weekPercentages.find(
      (wp) => wp.userId === userId && wp.weekId === weekId
    );
    
    if (entry) {
      return entry.percentage;
    }
    
    const weekIdNum = parseInt(weekId);
    for (let i = weekIdNum - 1; i >= 1; i--) {
      const previousEntry = weekPercentages.find(
        (wp) => wp.userId === userId && wp.weekId === i.toString()
      );
      if (previousEntry) {
        return previousEntry.percentage;
      }
    }
    
    return 100;
  };

  const handlePercentageChange = async (
    userId: string,
    weekId: string,
    percentage: number
  ) => {
    if (percentage < 0 || percentage > 100) {
      toast({
        title: "Invalid Percentage",
        description: "Percentage must be between 0 and 100",
        variant: "destructive",
      });
      return;
    }

    // Update local state
    const updatedPercentages = [...weekPercentages];
    const existingIndex = updatedPercentages.findIndex(
      (wp) => wp.userId === userId && wp.weekId === weekId
    );

    if (existingIndex >= 0) {
      updatedPercentages[existingIndex].percentage = percentage;
    } else {
      updatedPercentages.push({ userId, weekId, percentage });
    }

    setWeekPercentages(updatedPercentages);

    // Update in the database
    try {
      await updateWeekPercentage(userId, weekId, percentage);

      if (percentage === 100) {
        const weekIdNum = parseInt(weekId);
        setWeekPercentages(prev => 
          prev.filter(wp => !(wp.userId === userId && parseInt(wp.weekId) > weekIdNum))
        );
      }

      toast({
        title: "Percentage Updated",
        description: `Week ${weekId} updated to ${percentage}% for selected user`,
      });
    } catch (error) {
      console.error('Error updating week percentage:', error);
      toast({
        title: "Error",
        description: "Failed to update week percentage",
        variant: "destructive",
      });
    }
  };

  const selectedUserData = users.find((user) => user.id === selectedUser);
  const weeksToDisplay = customWeeks.length > 0 ? customWeeks : DEFAULT_WEEKS;

  if (loading) {
    return (
      <div className="container mx-auto p-6 pt-16 text-center">
        <p>Loading data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 pt-16">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User Week Percentage Management</h1>
        <Link to="/">
          <Button variant="outline" size="sm" className="flex items-center gap-2 z-10">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select a user:</label>
        <Select
          value={selectedUser}
          onValueChange={setSelectedUser}
        >
          <SelectTrigger className="w-full md:w-[300px]">
            <SelectValue placeholder="Select a user" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id || ""}>
                {user.login || user.username} ({user.type || user.role})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedUser && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Week Percentages for {selectedUserData?.login || selectedUserData?.username}
          </h2>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Week</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Base Hours</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Effective Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeksToDisplay.map((week) => {
                const weekId = week.id;
                const startDate = week.period_from || week.startDate || '';
                const endDate = week.period_to || week.endDate || '';
                const baseHours = week.required_hours || week.hours || 40;
                
                const percentage = getWeekPercentage(selectedUser, weekId);
                const effectiveHours = Math.round(baseHours * (percentage / 100));
                
                return (
                  <TableRow key={weekId}>
                    <TableCell>Week {week.name || weekId}</TableCell>
                    <TableCell>
                      {startDate} to {endDate}
                    </TableCell>
                    <TableCell>{baseHours}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={percentage}
                          onChange={(e) =>
                            handlePercentageChange(
                              selectedUser,
                              weekId,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-20"
                        />
                        <span>%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {effectiveHours} hours
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

export default UserWeekPercentage;
