import React, { useState, useEffect, useMemo } from "react";
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
import { getYear, parse } from "date-fns";
import { TeamMemberSelector } from "@/components/TeamMemberSelector";

const DEFAULT_WEEKS: CustomWeek[] = [
  { id: "1", name: "Week 1", startDate: "2025-01-01", endDate: "2025-01-06", hours: 48 },
  { id: "2", name: "Week 2", startDate: "2025-01-10", endDate: "2025-01-03", hours: 40 },
  { id: "3", name: "Week 3", startDate: "2025-01-13", endDate: "2025-01-17", hours: 40 },
  { id: "4", name: "Week 4", startDate: "2025-01-20", endDate: "2025-01-24", hours: 40 },
  { id: "5", name: "Week 5", startDate: "2025-01-27", endDate: "2025-01-31", hours: 40 },
];

const UserWeekPercentage = () => {
  const [selectedUser, setSelectedUser] = useState<string>(() => {
    return localStorage.getItem('userWeekPercentage_selectedUser') || "";
  });
  
  const [weekPercentages, setWeekPercentages] = useState<WeekPercentageEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [customWeeks, setCustomWeeks] = useState<CustomWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastModifiedWeek, setLastModifiedWeek] = useState<string | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    return localStorage.getItem('userWeekPercentage_selectedYear') || "all";
  });
  
  const { toast } = useToast();

  useEffect(() => {
    if (selectedUser) {
      localStorage.setItem('userWeekPercentage_selectedUser', selectedUser);
    }
  }, [selectedUser]);

  useEffect(() => {
    localStorage.setItem('userWeekPercentage_selectedYear', selectedYear);
  }, [selectedYear]);

  interface WeekPercentageEntry {
    userId: string;
    weekId: string;
    percentage: number;
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: usersData, error: usersError } = await getUsers();
        if (usersError) throw usersError;
        setUsers(usersData || []);
        
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

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    
    const weeks = customWeeks.length > 0 ? customWeeks : DEFAULT_WEEKS;
    
    weeks.forEach(week => {
      const startDate = week.period_from || week.startDate;
      if (startDate) {
        const year = getYear(parse(startDate, "yyyy-MM-dd", new Date())).toString();
        years.add(year);
      }
    });
    
    return Array.from(years).sort();
  }, [customWeeks]);

  useEffect(() => {
    const fetchWeekPercentages = async () => {
      if (!selectedUser) return;
      
      try {
        const { data, error } = await getWeekPercentages(selectedUser);
        if (error) throw error;
        
        if (data) {
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
    const exactMatch = weekPercentages.find(
      (wp) => wp.userId === userId && wp.weekId === weekId
    );
    
    if (exactMatch) {
      return exactMatch.percentage;
    }
    
    const weeks = customWeeks.length > 0 ? customWeeks : DEFAULT_WEEKS;
    
    const currentWeekIndex = weeks.findIndex(week => week.id === weekId);
    if (currentWeekIndex === -1) return 100;
    
    const previousWeeks = weeks.slice(0, currentWeekIndex);
    
    for (let i = previousWeeks.length - 1; i >= 0; i--) {
      const prevWeekId = previousWeeks[i].id;
      const prevWeekPercentage = weekPercentages.find(
        (wp) => wp.userId === userId && wp.weekId === prevWeekId
      );
      
      if (prevWeekPercentage) {
        return prevWeekPercentage.percentage;
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

    setLastModifiedWeek(weekId);

    try {
      const updatedPercentages = [...weekPercentages];
      const existingIndex = updatedPercentages.findIndex(
        (wp) => wp.userId === userId && wp.weekId === weekId
      );

      if (existingIndex >= 0) {
        updatedPercentages[existingIndex].percentage = percentage;
      } else {
        updatedPercentages.push({ userId, weekId, percentage });
      }

      const weeks = customWeeks.length > 0 ? customWeeks : DEFAULT_WEEKS;
      const currentWeekIndex = weeks.findIndex(week => week.id === weekId);
      
      if (currentWeekIndex !== -1) {
        const subsequentWeekIds = weeks
          .slice(currentWeekIndex + 1)
          .map(week => week.id);
          
        const filteredPercentages = updatedPercentages.filter(
          wp => !(wp.userId === userId && subsequentWeekIds.includes(wp.weekId))
        );
        
        setWeekPercentages(filteredPercentages);
      } else {
        setWeekPercentages(updatedPercentages);
      }

      await updateWeekPercentage(userId, weekId, percentage);

      toast({
        title: "Percentage Updated",
        description: `Week ${weekId} updated to ${percentage}%. All subsequent weeks will inherit this value.`,
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

  const handleUserSelect = (user: User | null) => {
    if (user && user.id) {
      setSelectedUser(user.id);
      setWeekPercentages([]);
    }
  };
  
  const getFilteredWeeks = () => {
    const weeksToFilter = customWeeks.length > 0 ? customWeeks : DEFAULT_WEEKS;
    
    if (selectedYear === "all") {
      return weeksToFilter;
    }
    
    return weeksToFilter.filter(week => {
      const startDate = week.period_from || week.startDate;
      if (!startDate) return false;
      
      const year = getYear(parse(startDate, "yyyy-MM-dd", new Date())).toString();
      return year === selectedYear;
    });
  };

  const weeksToDisplay = getFilteredWeeks();

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
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium mb-2">Select a user:</label>
            <TeamMemberSelector
              currentUser={{} as User}
              users={users}
              onUserSelect={handleUserSelect}
              selectedUser={selectedUserData}
              searchValue={userSearchQuery}
              onSearchChange={setUserSearchQuery}
              autoOpenOnFocus={true}
              className="w-full md:w-[300px]"
              placeholder="Search and select a user..."
            />
          </div>
          
          {selectedUser && availableYears.length > 0 && (
            <div className="w-full md:w-auto">
              <label className="block text-sm font-medium mb-2">Filter by year:</label>
              <Select
                value={selectedYear}
                onValueChange={setSelectedYear}
              >
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {selectedUser && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Week Percentages for {selectedUserData?.login || selectedUserData?.username}
            {selectedYear !== "all" && ` - ${selectedYear}`}
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
              {weeksToDisplay.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No weeks found for {selectedYear !== "all" ? `year ${selectedYear}` : "any year"}
                  </TableCell>
                </TableRow>
              ) : (
                weeksToDisplay.map((week) => {
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
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default UserWeekPercentage;
