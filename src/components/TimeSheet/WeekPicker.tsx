
import React, { useState, useEffect, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, parse, isSameDay, isBefore, getYear } from 'date-fns';
import { CustomWeek, TimeSheetStatus } from '@/types/timesheet';
import { getCustomWeeks } from '@/integrations/supabase/database';

interface WeekPickerProps {
  currentDate: Date;
  onWeekChange: (date: Date) => void;
  onWeekHoursChange: (hours: number) => void;
  weekPercentage?: number;
  firstWeek?: string;
  customWeeks?: any[];
  viewedUserId?: string;
  status?: TimeSheetStatus;
}

export const WeekPicker = ({ 
  currentDate, 
  onWeekChange, 
  onWeekHoursChange,
  weekPercentage = 100,
  firstWeek = "2025-01-01", // Default to the earliest week if not specified
  customWeeks: propCustomWeeks = [],
  viewedUserId,
  status
}: WeekPickerProps) => {
  const [availableWeeks, setAvailableWeeks] = useState<CustomWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // Get unique years from available weeks
  const availableYears = useMemo(() => {
    if (availableWeeks.length === 0) return [];
    
    const years = new Set<string>();
    
    availableWeeks.forEach(week => {
      const year = getYear(parse(week.startDate, 'yyyy-MM-dd', new Date())).toString();
      years.add(year);
    });
    
    return Array.from(years).sort();
  }, [availableWeeks]);

  useEffect(() => {
    const fetchWeeks = async () => {
      try {
        setLoading(true);
        if (propCustomWeeks.length > 0) {
          // Transform data to match CustomWeek interface if needed
          const formattedWeeks = propCustomWeeks.map(week => ({
            id: week.id,
            name: week.name,
            startDate: week.period_from || week.startDate,
            endDate: week.period_to || week.endDate,
            hours: week.required_hours || week.hours
          }));
          setAvailableWeeks(formattedWeeks);
        } else {
          const { data } = await getCustomWeeks();
          if (data && data.length > 0) {
            // Transform data to match CustomWeek interface
            const formattedWeeks = data.map(week => ({
              id: week.id,
              name: week.name,
              startDate: week.period_from,
              endDate: week.period_to,
              hours: week.required_hours
            }));
            setAvailableWeeks(formattedWeeks);
          }
        }
      } catch (error) {
        console.error('Error fetching custom weeks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeks();
  }, [propCustomWeeks]);

  // Filter weeks by year if a year is selected
  const getFilteredWeeks = () => {
    if (availableWeeks.length === 0) return [];
    
    // First filter by firstWeek
    const firstWeekDate = parse(firstWeek, 'yyyy-MM-dd', new Date());
    let filtered = availableWeeks.filter(week => {
      const weekStartDate = parse(week.startDate, 'yyyy-MM-dd', new Date());
      return !isBefore(weekStartDate, firstWeekDate);
    });
    
    // Then filter by year if a specific year is selected
    if (selectedYear !== 'all') {
      filtered = filtered.filter(week => {
        const weekYear = getYear(parse(week.startDate, 'yyyy-MM-dd', new Date())).toString();
        return weekYear === selectedYear;
      });
    }
    
    // Sort by date
    return filtered.sort((a, b) => {
      const dateA = parse(a.startDate, 'yyyy-MM-dd', new Date());
      const dateB = parse(b.startDate, 'yyyy-MM-dd', new Date());
      return dateA.getTime() - dateB.getTime();
    });
  };

  const filteredWeeks = getFilteredWeeks();

  // Find the current week based on the currentDate
  const getCurrentWeek = () => {
    for (const week of filteredWeeks) {
      const weekStartDate = parse(week.startDate, "yyyy-MM-dd", new Date());
      if (isSameDay(weekStartDate, currentDate)) {
        return week;
      }
    }
    return filteredWeeks[0]; // Default to the first available week if no match
  };

  const currentWeek = getCurrentWeek();
  const currentWeekId = currentWeek?.id || filteredWeeks[0]?.id;

  const handleCustomWeekSelect = (weekId: string) => {
    const selectedWeek = filteredWeeks.find(week => week.id === weekId);
    if (selectedWeek) {
      const date = parse(selectedWeek.startDate, "yyyy-MM-dd", new Date());
      onWeekChange(date);
      
      // Pass the base hours (not adjusted by percentage) - the TimeSheet component will apply the percentage
      onWeekHoursChange(selectedWeek.hours);
    }
  };

  const handleNavigateWeek = (direction: 'prev' | 'next') => {
    const currentIndex = filteredWeeks.findIndex(week => week.id === currentWeekId);
    if (currentIndex === -1) return;

    let newIndex;
    if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'next' && currentIndex < filteredWeeks.length - 1) {
      newIndex = currentIndex + 1;
    } else {
      return;
    }

    const newWeek = filteredWeeks[newIndex];
    const date = parse(newWeek.startDate, "yyyy-MM-dd", new Date());
    onWeekChange(date);
    
    // Pass the base hours (not adjusted by percentage)
    onWeekHoursChange(newWeek.hours);
  };

  const formatWeekLabel = (week: CustomWeek) => {
    const start = format(parse(week.startDate, "yyyy-MM-dd", new Date()), "MMM dd, yyyy");
    const end = format(parse(week.endDate, "yyyy-MM-dd", new Date()), "MMM dd, yyyy");
    
    // Calculate effective hours based on percentage for display only
    const effectiveHours = Math.round(week.hours * (weekPercentage / 100));
    
    return `${week.name}: ${start} - ${end} (${effectiveHours}h)`;
  };

  if (loading || filteredWeeks.length === 0) {
    return <div className="w-full max-w-md mb-4 flex items-center justify-center p-4">Loading weeks...</div>;
  }

  return (
    <div className="w-full max-w-md mb-4 space-y-2">
      {/* Year filter */}
      <div className="flex items-center gap-2 mb-2">
        <label className="text-sm font-medium whitespace-nowrap">Filter by year:</label>
        <Select
          value={selectedYear}
          onValueChange={setSelectedYear}
        >
          <SelectTrigger className="h-8 flex-1">
            <SelectValue placeholder="All years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All years</SelectItem>
            {availableYears.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Week picker controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleNavigateWeek('prev')}
          disabled={!filteredWeeks.length || currentWeekId === filteredWeeks[0].id}
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
            {filteredWeeks.map((week) => (
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
          disabled={!filteredWeeks.length || currentWeekId === filteredWeeks[filteredWeeks.length - 1].id}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

