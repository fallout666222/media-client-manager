
import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, parse } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CustomWeek {
  id: string;
  startDate: string;
  endDate: string;
  hours: number;
}

interface WeekPickerProps {
  currentDate: Date;
  onWeekChange: (date: Date) => void;
  isCustomWeek?: boolean;
}

const DEFAULT_WEEKS: CustomWeek[] = [
  { id: "1", startDate: "2025-01-01", endDate: "2025-01-06", hours: 48 },
  { id: "2", startDate: "2025-01-10", endDate: "2025-01-03", hours: 40 },
  { id: "3", startDate: "2025-01-13", endDate: "2025-01-17", hours: 40 },
  { id: "4", startDate: "2025-01-20", endDate: "2025-01-24", hours: 40 },
  { id: "5", startDate: "2025-01-27", endDate: "2025-01-31", hours: 40 },
];

export const WeekPicker = ({ currentDate, onWeekChange, isCustomWeek = false }: WeekPickerProps) => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const handlePreviousWeek = () => {
    onWeekChange(subWeeks(currentDate, 1));
  };

  const handleNextWeek = () => {
    onWeekChange(addWeeks(currentDate, 1));
  };

  const handleCustomWeekSelect = (weekId: string) => {
    const selectedWeek = DEFAULT_WEEKS.find(week => week.id === weekId);
    if (selectedWeek) {
      const date = parse(selectedWeek.startDate, "yyyy-MM-dd", new Date());
      onWeekChange(date);
    }
  };

  const formatWeekLabel = (week: CustomWeek) => {
    const start = format(parse(week.startDate, "yyyy-MM-dd", new Date()), "MMM dd, yyyy");
    const end = format(parse(week.endDate, "yyyy-MM-dd", new Date()), "MMM dd, yyyy");
    return `${start} - ${end} (${week.hours}h)`;
  };

  if (isCustomWeek) {
    return (
      <div className="w-full max-w-md mb-4">
        <Select
          value={DEFAULT_WEEKS.find(week => 
            format(parse(week.startDate, "yyyy-MM-dd", new Date()), 'yyyy-MM-dd') === 
            format(weekStart, 'yyyy-MM-dd')
          )?.id}
          onValueChange={handleCustomWeekSelect}
        >
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
    );
  }

  return (
    <div className="flex items-center gap-4 mb-4">
      <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="font-medium">
        {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
      </span>
      <Button variant="outline" size="icon" onClick={handleNextWeek}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
