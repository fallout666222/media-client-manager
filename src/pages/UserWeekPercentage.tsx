import React, { useState } from "react";
import { User } from "@/types/timesheet";
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

interface CustomWeek {
  id: string;
  startDate: string;
  endDate: string;
  hours: number;
}

interface UserWeekPercentageProps {
  users: User[];
  initialWeeks?: CustomWeek[]; // Make initialWeeks optional
}

const DEFAULT_WEEKS: CustomWeek[] = [
  { id: "1", startDate: "2025-01-01", endDate: "2025-01-06", hours: 48 },
  { id: "2", startDate: "2025-01-10", endDate: "2025-01-03", hours: 40 },
  { id: "3", startDate: "2025-01-13", endDate: "2025-01-17", hours: 40 },
  { id: "4", startDate: "2025-01-20", endDate: "2025-01-24", hours: 40 },
  { id: "5", startDate: "2025-01-27", endDate: "2025-01-31", hours: 40 },
];

const UserWeekPercentage = ({ users }: UserWeekPercentageProps) => {
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [weekPercentages, setWeekPercentages] = useState<UserWeekPercentage[]>([
    { userId: "1", weekId: "1", percentage: 100 },
    { userId: "2", weekId: "1", percentage: 100 },
    { userId: "3", weekId: "1", percentage: 100 },
  ]);
  const { toast } = useToast();

  const getWeekPercentage = (userId: string, weekId: string): number => {
    const entry = weekPercentages.find(
      (wp) => wp.userId === userId && wp.weekId === weekId
    );
    
    if (entry) {
      return entry.percentage;
    }
    
    // If no entry exists for this week, look for previous weeks
    const weekIdNum = parseInt(weekId);
    for (let i = weekIdNum - 1; i >= 1; i--) {
      const previousEntry = weekPercentages.find(
        (wp) => wp.userId === userId && wp.weekId === i.toString()
      );
      if (previousEntry) {
        return previousEntry.percentage;
      }
    }
    
    // Default to 100% if no previous settings found
    return 100;
  };

  const handlePercentageChange = (
    userId: string,
    weekId: string,
    percentage: number
  ) => {
    // Validate percentage is between 0 and 100
    if (percentage < 0 || percentage > 100) {
      toast({
        title: "Invalid Percentage",
        description: "Percentage must be between 0 and 100",
        variant: "destructive",
      });
      return;
    }

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

    // Apply the same percentage to all subsequent weeks if it's 100%
    if (percentage === 100) {
      const weekIdNum = parseInt(weekId);
      // Remove any existing settings for subsequent weeks
      setWeekPercentages(prev => 
        prev.filter(wp => !(wp.userId === userId && parseInt(wp.weekId) > weekIdNum))
      );
    }

    toast({
      title: "Percentage Updated",
      description: `Week ${weekId} updated to ${percentage}% for selected user`,
    });
  };

  const selectedUserData = users.find((user) => user.id === selectedUser);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">User Week Percentage Management</h1>
      
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
                {user.username} ({user.role})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedUser && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Week Percentages for {selectedUserData?.username}
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
              {DEFAULT_WEEKS.map((week) => {
                const percentage = getWeekPercentage(selectedUser, week.id);
                const effectiveHours = Math.round(week.hours * (percentage / 100));
                
                return (
                  <TableRow key={week.id}>
                    <TableCell>Week {week.id}</TableCell>
                    <TableCell>
                      {week.startDate} to {week.endDate}
                    </TableCell>
                    <TableCell>{week.hours}</TableCell>
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
                              week.id,
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
