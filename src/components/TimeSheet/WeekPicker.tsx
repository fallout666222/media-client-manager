
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
import { format, startOfWeek, parse } from 'date-fns';

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
}

const DEFAULT_WEEKS: CustomWeek[] = [
  { id: "1", startDate: "2025-01-01", endDate: "2025-01-06", hours: 48 },
  { id: "2", startDate: "2025-01-10", endDate: "2025-01-03", hours: 40 },
  { id: "3", startDate: "2025-01-13", endDate: "2025-01-17", hours: 40 },
  { id: "4", startDate: "2025-01-20", endDate: "2025-01-24", hours: 40 },
  { id: "5", startDate: "2025-01-27", endDate: "2025-01-31", hours: 40 },
];

export const WeekPicker = ({ currentDate, onWeekChange, onWeekHoursChange }: WeekPickerProps) => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const currentWeekId = DEFAULT_WEEKS.find(week => 
    format(parse(week.startDate, "yyyy-MM-dd", new Date()), 'yyyy-MM-dd') === 
    format(weekStart, 'yyyy-MM-dd')
  )?.id;

  const handleCustomWeekSelect = (weekId: string) => {
    const selectedWeek = DEFAULT_WEEKS.find(week => week.id === weekId);
    if (selectedWeek) {
      const date = parse(selectedWeek.startDate, "yyyy-MM-dd", new Date());
      onWeekChange(date);
      onWeekHoursChange(selectedWeek.hours);
    }
  };

  const handleNavigateWeek = (direction: 'prev' | 'next') => {
    const currentIndex = DEFAULT_WEEKS.findIndex(week => week.id === currentWeekId);
    if (currentIndex === -1) return;

    let newIndex;
    if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'next' && currentIndex < DEFAULT_WEEKS.length - 1) {
      newIndex = currentIndex + 1;
    } else {
      return;
    }

    const newWeek = DEFAULT_WEEKS[newIndex];
    const date = parse(newWeek.startDate, "yyyy-MM-dd", new Date());
    onWeekChange(date);
    onWeekHoursChange(newWeek.hours);
  };

  const formatWeekLabel = (week: CustomWeek) => {
    const start = format(parse(week.startDate, "yyyy-MM-dd", new Date()), "MMM dd, yyyy");
    const end = format(parse(week.endDate, "yyyy-MM-dd", new Date()), "MMM dd, yyyy");
    return `${start} - ${end} (${week.hours}h)`;
  };

  return (
    <div className="w-full max-w-md mb-4 flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => handleNavigateWeek('prev')}
        disabled={currentWeekId === DEFAULT_WEEKS[0].id}
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
          {DEFAULT_WEEKS.map((week) => (
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
        disabled={currentWeekId === DEFAULT_WEEKS[DEFAULT_WEEKS.length - 1].id}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
