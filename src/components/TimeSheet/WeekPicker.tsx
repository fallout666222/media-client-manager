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
import { CustomWeek } from '@/types/timesheet';
import { getCustomWeeks } from '@/integrations/supabase/database';

interface WeekPickerProps {
  currentDate: Date;
  onWeekChange: (date: Date) => void;
  onWeekHoursChange: (hours: number) => void;
  weekPercentage?: number;
  firstWeek?: string;
  customWeeks?: any[];
  viewedUserId?: string;
}

const STORAGE_KEY = 'selectedWeekId';

export const WeekPicker = ({ 
  currentDate, 
  onWeekChange, 
  onWeekHoursChange,
  weekPercentage = 100,
  firstWeek = "2025-01-01", // Default to the earliest week if not specified
  customWeeks: propCustomWeeks = [],
  viewedUserId
}: WeekPickerProps) => {
  const [availableWeeks, setAvailableWeeks] = useState<CustomWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [initialLoadDone, setInitialLoadDone] = useState(false);

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

  // Handle initial load and week selection
  useEffect(() => {
    if (!initialLoadDone && filteredWeeks.length > 0) {
      const savedWeekId = localStorage.getItem(STORAGE_KEY);
      
      if (savedWeekId) {
        const savedWeek = filteredWeeks.find(week => week.id === savedWeekId);
        if (savedWeek) {
          // Apply the saved week on initial load
          const date = parse(savedWeek.startDate, "yyyy-MM-dd", new Date());
          onWeekChange(date);
          onWeekHoursChange(savedWeek.hours);
          setInitialLoadDone(true);
          return;
        }
      }
      
      // Fall back to default behavior if no saved week found
      setInitialLoadDone(true);
    }
  }, [filteredWeeks, initialLoadDone, onWeekChange, onWeekHoursChange]);

  // Find the current week ID based on the selected week or default
  const getCurrentWeekId = () => {
    // First check localStorage for saved week ID
    const savedWeekId = localStorage.getItem(STORAGE_KEY);
    if (savedWeekId) {
      const savedWeek = filteredWeeks.find(week => week.id === savedWeekId);
      if (savedWeek) {
        return savedWeek.id;
      }
    }
    
    // Default behavior: find week based on current date
    for (const week of filteredWeeks) {
      const weekStartDate = parse(week.startDate, "yyyy-MM-dd", new Date());
      if (isSameDay(weekStartDate, currentDate)) {
        return week.id;
      }
    }
    
    // Default to first week if nothing else matches
    return filteredWeeks.length > 0 ? filteredWeeks[0].id : undefined;
  };

  const currentWeekId = getCurrentWeekId();

  // Save current week ID to localStorage whenever it changes
  useEffect(() => {
    if (currentWeekId) {
      localStorage.setItem(STORAGE_KEY, currentWeekId);
    }
  }, [currentWeekId]);

  const handleCustomWeekSelect = (weekId: string) => {
    const selectedWeek = filteredWeeks.find(week => week.id === weekId);
    if (selectedWeek) {
      // Update localStorage with the selected week ID
      localStorage.setItem(STORAGE_KEY, selectedWeek.id);
      
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
    // Save the newly selected week to localStorage
    localStorage.setItem(STORAGE_KEY, newWeek.id);
    
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
          value={currentWeekId || ''}
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
