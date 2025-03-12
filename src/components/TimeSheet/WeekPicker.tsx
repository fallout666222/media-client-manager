
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
  
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    const savedYear = localStorage.getItem('selectedYear');
    return savedYear || 'all';
  });

  // Add this to track the currently selected week ID
  const [currentWeekId, setCurrentWeekId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('selectedYear', selectedYear);
  }, [selectedYear]);

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
          const formattedWeeks = propCustomWeeks.map(week => ({
            id: week.id,
            name: week.name,
            startDate: week.period_from || week.startDate,
            endDate: week.period_to || week.endDate,
            hours: week.required_hours || week.hours
          }));
          console.log("Setting available weeks from props:", formattedWeeks.length);
          setAvailableWeeks(formattedWeeks);
        } else {
          const { data } = await getCustomWeeks();
          if (data && data.length > 0) {
            const formattedWeeks = data.map(week => ({
              id: week.id,
              name: week.name,
              startDate: week.period_from,
              endDate: week.period_to,
              hours: week.required_hours
            }));
            console.log("Setting available weeks from API:", formattedWeeks.length);
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

  const getFilteredWeeks = () => {
    if (availableWeeks.length === 0) return [];
    
    const firstWeekDate = parse(firstWeek, 'yyyy-MM-dd', new Date());
    let filtered = availableWeeks.filter(week => {
      const weekStartDate = parse(week.startDate, 'yyyy-MM-dd', new Date());
      return !isBefore(weekStartDate, firstWeekDate);
    });
    
    if (selectedYear !== 'all') {
      filtered = filtered.filter(week => {
        const weekYear = getYear(parse(week.startDate, 'yyyy-MM-dd', new Date())).toString();
        return weekYear === selectedYear;
      });
    }
    
    return filtered.sort((a, b) => {
      const dateA = parse(a.startDate, 'yyyy-MM-dd', new Date());
      const dateB = parse(b.startDate, 'yyyy-MM-dd', new Date());
      return dateA.getTime() - dateB.getTime();
    });
  };

  const filteredWeeks = getFilteredWeeks();

  const getCurrentWeek = () => {
    if (filteredWeeks.length === 0) return null;
    
    if (viewedUserId) {
      const savedWeekId = localStorage.getItem(`selectedWeek_${viewedUserId}`);
      console.log(`Checking saved week for user ${viewedUserId}:`, savedWeekId);
      
      if (savedWeekId) {
        const savedWeek = filteredWeeks.find(week => week.id === savedWeekId);
        if (savedWeek) {
          console.log(`Found saved week in localStorage: ${savedWeek.name}`);
          return savedWeek;
        }
      }
    }
    
    for (const week of filteredWeeks) {
      const weekStartDate = parse(week.startDate, "yyyy-MM-dd", new Date());
      if (isSameDay(weekStartDate, currentDate)) {
        return week;
      }
    }
    
    return filteredWeeks[0];
  };

  // Update currentWeekId when currentDate changes
  useEffect(() => {
    const matchingWeek = filteredWeeks.find(week => 
      isSameDay(parse(week.startDate, "yyyy-MM-dd", new Date()), currentDate)
    );
    
    if (matchingWeek) {
      console.log(`WeekPicker: Current date changed, updating selected week to ${matchingWeek.name} (${matchingWeek.id})`);
      setCurrentWeekId(matchingWeek.id);
      
      if (viewedUserId) {
        localStorage.setItem(`selectedWeek_${viewedUserId}`, matchingWeek.id);
        console.log(`WeekPicker: Saved week ${matchingWeek.id} to localStorage for user ${viewedUserId}`);
      }
      
      onWeekHoursChange(matchingWeek.hours);
    }
  }, [currentDate, filteredWeeks]);

  const currentWeek = getCurrentWeek();
  const effectiveWeekId = currentWeekId || currentWeek?.id || filteredWeeks[0]?.id;

  useEffect(() => {
    if (currentWeek) {
      console.log(`WeekPicker: Current week updated to ${currentWeek.name} (${currentWeek.id})`);
      const weekStartDate = parse(currentWeek.startDate, "yyyy-MM-dd", new Date());
      
      if (!isSameDay(weekStartDate, currentDate)) {
        console.log(`WeekPicker: Updating current date to ${format(weekStartDate, 'yyyy-MM-dd')}`);
        onWeekChange(weekStartDate);
      }
      
      onWeekHoursChange(currentWeek.hours);
      
      if (viewedUserId) {
        localStorage.setItem(`selectedWeek_${viewedUserId}`, currentWeek.id);
        console.log(`WeekPicker: Saved week ${currentWeek.id} to localStorage for user ${viewedUserId}`);
      }
      
      setCurrentWeekId(currentWeek.id);
    }
  }, [currentWeek?.id]);

  useEffect(() => {
    if (effectiveWeekId && viewedUserId) {
      localStorage.setItem(`selectedWeek_${viewedUserId}`, effectiveWeekId);
      console.log(`WeekPicker: Saved selected week ${effectiveWeekId} for user ${viewedUserId}`);
    }
  }, [effectiveWeekId, viewedUserId]);

  const handleCustomWeekSelect = (weekId: string) => {
    const selectedWeek = filteredWeeks.find(week => week.id === weekId);
    if (selectedWeek) {
      console.log(`WeekPicker: Selected week ${selectedWeek.name} (${selectedWeek.id})`);
      const date = parse(selectedWeek.startDate, "yyyy-MM-dd", new Date());
      onWeekChange(date);
      
      if (viewedUserId) {
        localStorage.setItem(`selectedWeek_${viewedUserId}`, weekId);
        console.log(`WeekPicker: Saved week ${weekId} to localStorage for user ${viewedUserId}`);
      }
      
      onWeekHoursChange(selectedWeek.hours);
      setCurrentWeekId(weekId);
    }
  };

  const handleNavigateWeek = (direction: 'prev' | 'next') => {
    const currentIndex = filteredWeeks.findIndex(week => week.id === effectiveWeekId);
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
    console.log(`WeekPicker: Navigating to ${direction} week: ${newWeek.name} (${newWeek.id})`);
    const date = parse(newWeek.startDate, "yyyy-MM-dd", new Date());
    onWeekChange(date);
    
    if (viewedUserId) {
      localStorage.setItem(`selectedWeek_${viewedUserId}`, newWeek.id);
      console.log(`WeekPicker: Saved week ${newWeek.id} to localStorage for user ${viewedUserId}`);
    }
    
    onWeekHoursChange(newWeek.hours);
    setCurrentWeekId(newWeek.id);
  };

  const formatWeekLabel = (week: CustomWeek) => {
    const start = format(parse(week.startDate, "yyyy-MM-dd", new Date()), "MMM dd, yyyy");
    const end = format(parse(week.endDate, "yyyy-MM-dd", new Date()), "MMM dd, yyyy");
    
    const effectiveHours = Math.round(week.hours * (weekPercentage / 100));
    
    return `${week.name}: ${start} - ${end} (${effectiveHours}h)`;
  };

  if (loading || filteredWeeks.length === 0) {
    return <div className="w-full max-w-md mb-4 flex items-center justify-center p-4">Loading weeks...</div>;
  }

  return (
    <div className="w-full max-w-md mb-4 space-y-2">
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

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleNavigateWeek('prev')}
          disabled={!filteredWeeks.length || effectiveWeekId === filteredWeeks[0].id}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Select
          value={effectiveWeekId}
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
          disabled={!filteredWeeks.length || effectiveWeekId === filteredWeeks[filteredWeeks.length - 1].id}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
