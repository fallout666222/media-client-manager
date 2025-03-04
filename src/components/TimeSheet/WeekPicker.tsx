
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfWeek, parse, isSameDay, isBefore } from 'date-fns';

interface CustomWeek {
  id: string;
  startDate: string;
  endDate: string;
  hours: number;
}

interface WeekPickerProps {
  currentDate: Date;
  onWeekChange: (date: Date) => void;
  onWeekHoursChange: (hours: number) => void;
  weekPercentage?: number;
  firstWeek?: string;
}

const DEFAULT_WEEKS: CustomWeek[] = [
  { id: "1", startDate: "2025-01-01", endDate: "2025-01-06", hours: 48 },
  { id: "2", startDate: "2025-01-10", endDate: "2025-01-03", hours: 40 },
  { id: "3", startDate: "2025-01-13", endDate: "2025-01-17", hours: 40 },
  { id: "4", startDate: "2025-01-20", endDate: "2025-01-24", hours: 40 },
  { id: "5", startDate: "2025-01-27", endDate: "2025-01-31", hours: 40 },
];

export const WeekPicker = ({ 
  currentDate, 
  onWeekChange, 
  onWeekHoursChange,
  weekPercentage = 100,
  firstWeek = "2025-01-01" // Default to the earliest week if not specified
}: WeekPickerProps) => {
  // Filter weeks to only include those on or after the user's first week
  const getAvailableWeeks = () => {
    const firstWeekDate = parse(firstWeek, 'yyyy-MM-dd', new Date());
    return DEFAULT_WEEKS.filter(week => {
      const weekStartDate = parse(week.startDate, 'yyyy-MM-dd', new Date());
      return !isBefore(weekStartDate, firstWeekDate);
    }).sort((a, b) => {
      const dateA = parse(a.startDate, 'yyyy-MM-dd', new Date());
      const dateB = parse(b.startDate, 'yyyy-MM-dd', new Date());
      return dateA.getTime() - dateB.getTime();
    });
  };

  const availableWeeks = getAvailableWeeks();

  // Find the current week based on the currentDate
  const getCurrentWeek = () => {
    for (const week of availableWeeks) {
      const weekStartDate = parse(week.startDate, "yyyy-MM-dd", new Date());
      if (isSameDay(weekStartDate, currentDate)) {
        return week;
      }
    }
    return availableWeeks[0]; // Default to the first available week if no match
  };

  const currentWeek = getCurrentWeek();
  const currentWeekId = currentWeek?.id || availableWeeks[0]?.id;

  const handleCustomWeekSelect = (weekId: string) => {
    const selectedWeek = availableWeeks.find(week => week.id === weekId);
    if (selectedWeek) {
      const date = parse(selectedWeek.startDate, "yyyy-MM-dd", new Date());
      onWeekChange(date);
      
      // Apply percentage to hours
      const effectiveHours = Math.round(selectedWeek.hours * (weekPercentage / 100));
      onWeekHoursChange(effectiveHours);
    }
  };

  const handleNavigateWeek = (direction: 'prev' | 'next') => {
    const currentIndex = availableWeeks.findIndex(week => week.id === currentWeekId);
    if (currentIndex === -1) return;

    let newIndex;
    if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'next' && currentIndex < availableWeeks.length - 1) {
      newIndex = currentIndex + 1;
    } else {
      return;
    }

    const newWeek = availableWeeks[newIndex];
    const date = parse(newWeek.startDate, "yyyy-MM-dd", new Date());
    onWeekChange(date);
    
    // Apply percentage to hours
    const effectiveHours = Math.round(newWeek.hours * (weekPercentage / 100));
    onWeekHoursChange(effectiveHours);
  };

  const formatWeekLabel = (week: CustomWeek) => {
    const start = format(parse(week.startDate, "yyyy-MM-dd", new Date()), "MMM dd, yyyy");
    const end = format(parse(week.endDate, "yyyy-MM-dd", new Date()), "MMM dd, yyyy");
    
    // Calculate effective hours based on percentage
    const effectiveHours = Math.round(week.hours * (weekPercentage / 100));
    
    return `${start} - ${end} (${effectiveHours}h / ${weekPercentage}%)`;
  };

  return (
    <div className="w-full max-w-md mb-4 flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => handleNavigateWeek('prev')}
        disabled={!availableWeeks.length || currentWeekId === availableWeeks[0].id}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Select
        value={currentWeekId}
        onValueChange={handleCustomWeekSelect}
      >
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Select a custom week" />
        </SelectTrigger>
        <SelectContent>
          {availableWeeks.map((week) => (
            <SelectItem key={week.id} value={week.id}>
              {formatWeekLabel(week)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={() => handleNavigateWeek('next')}
        disabled={!availableWeeks.length || currentWeekId === availableWeeks[availableWeeks.length - 1].id}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
