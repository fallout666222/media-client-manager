
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
}

const DEFAULT_WEEKS: CustomWeek[] = [
  { id: "1", startDate: "2025-01-01", endDate: "2025-01-06", hours: 48 },
  { id: "2", startDate: "2025-01-10", endDate: "2025-01-03", hours: 40 },
  { id: "3", startDate: "2025-01-13", endDate: "2025-01-17", hours: 40 },
  { id: "4", startDate: "2025-01-20", endDate: "2025-01-24", hours: 40 },
  { id: "5", startDate: "2025-01-27", endDate: "2025-01-31", hours: 40 },
];

export const WeekPicker = ({ currentDate, onWeekChange }: WeekPickerProps) => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

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
};
