import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';

interface WeekPickerProps {
  currentDate: Date;
  onWeekChange: (date: Date) => void;
}

export const WeekPicker = ({ currentDate, onWeekChange }: WeekPickerProps) => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const handlePreviousWeek = () => {
    onWeekChange(subWeeks(currentDate, 1));
  };

  const handleNextWeek = () => {
    onWeekChange(addWeeks(currentDate, 1));
  };

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