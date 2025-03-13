
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
  filterYear: number | null;
  setFilterYear: (year: number | null) => void;
}

export const WeekPicker = ({ 
  currentDate, 
  onWeekChange, 
  onWeekHoursChange,
  weekPercentage = 100,
  firstWeek = "2025-01-01", // Default to the earliest week if not specified
  customWeeks: propCustomWeeks = [],
  viewedUserId,
  status,
  filterYear,
  setFilterYear
}: WeekPickerProps) => {
  const [availableWeeks, setAvailableWeeks] = useState<CustomWeek[]>([]);
  const [loading, setLoading] = useState(true);

  // Add this to track the currently selected week ID
  const [currentWeekId, setCurrentWeekId] = useState<string | null>(null);

  const availableYears = useMemo(() => {
    if (availableWeeks.length === 0) return [];
    
    const years = new Set<string>();
    
    availableWeeks.forEach(week => {
      if (week.startDate) {
        try {
          const year = getYear(parse(week.startDate, 'yyyy-MM-dd', new Date())).toString();
          years.add(year);
        } catch (error) {
          console.error('Error parsing date:', week.startDate, error);
        }
      }
    });
    
    return Array.from(years).sort();
  }, [availableWeeks]);

  // Save filterYear to localStorage whenever it changes
  useEffect(() => {
    if (viewedUserId && filterYear !== null) {
      localStorage.setItem(`selectedYearFilter_${viewedUserId}`, filterYear.toString());
      console.log(`Saved year filter ${filterYear} to localStorage for user ${viewedUserId}`);
    } else if (viewedUserId && filterYear === null) {
      localStorage.removeItem(`selectedYearFilter_${viewedUserId}`);
    }
  }, [filterYear, viewedUserId]);

  // Load filterYear from localStorage on initial load
  useEffect(() => {
    if (viewedUserId) {
      const savedYearFilter = localStorage.getItem(`selectedYearFilter_${viewedUserId}`);
      if (savedYearFilter) {
        const yearValue = parseInt(savedYearFilter);
        console.log(`Loading year filter ${yearValue} from localStorage for user ${viewedUserId}`);
        setFilterYear(yearValue);
      }
    }
  }, [viewedUserId, setFilterYear]);

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
          setLoading(false);
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
            setLoading(false);
          } else {
            console.log("No weeks found from API");
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error fetching custom weeks:', error);
        setLoading(false);
      }
    };

    fetchWeeks();
  }, [propCustomWeeks]);

  const getFilteredWeeks = () => {
    if (availableWeeks.length === 0) return [];
    
    let firstWeekDate;
    try {
      firstWeekDate = parse(firstWeek, 'yyyy-MM-dd', new Date());
    } catch (error) {
      console.error('Error parsing first week date:', firstWeek, error);
      firstWeekDate = new Date(2020, 0, 1); // Default to Jan 1, 2020 if parsing fails
    }
    
    let filtered = availableWeeks.filter(week => {
      if (!week.startDate) return false;
      
      try {
        const weekStartDate = parse(week.startDate, 'yyyy-MM-dd', new Date());
        return !isBefore(weekStartDate, firstWeekDate);
      } catch (error) {
        console.error('Error filtering week by date:', week.startDate, error);
        return false;
      }
    });
    
    if (filterYear !== null) {
      filtered = filtered.filter(week => {
        if (!week.startDate) return false;
        
        try {
          const weekYear = getYear(parse(week.startDate, 'yyyy-MM-dd', new Date())).toString();
          return weekYear === filterYear.toString();
        } catch (error) {
          console.error('Error filtering week by year:', week.startDate, error);
          return false;
        }
      });
    }
    
    return filtered.sort((a, b) => {
      if (!a.startDate || !b.startDate) return 0;
      
      try {
        const dateA = parse(a.startDate, 'yyyy-MM-dd', new Date());
        const dateB = parse(b.startDate, 'yyyy-MM-dd', new Date());
        return dateA.getTime() - dateB.getTime();
      } catch (error) {
        console.error('Error sorting weeks:', a.startDate, b.startDate, error);
        return 0;
      }
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
      if (!week.startDate) continue;
      
      try {
        const weekStartDate = parse(week.startDate, "yyyy-MM-dd", new Date());
        if (isSameDay(weekStartDate, currentDate)) {
          return week;
        }
      } catch (error) {
        console.error('Error checking current week:', week.startDate, error);
      }
    }
    
    return filteredWeeks[0];
  };

  // Update currentWeekId when currentDate changes
  useEffect(() => {
    const matchingWeek = filteredWeeks.find(week => {
      if (!week.startDate) return false;
      
      try {
        return isSameDay(parse(week.startDate, "yyyy-MM-dd", new Date()), currentDate);
      } catch (error) {
        console.error('Error matching week to current date:', week.startDate, error);
        return false;
      }
    });
    
    if (matchingWeek) {
      console.log(`WeekPicker: Current date changed, updating selected week to ${matchingWeek.name} (${matchingWeek.id})`);
      setCurrentWeekId(matchingWeek.id);
      
      if (viewedUserId) {
        localStorage.setItem(`selectedWeek_${viewedUserId}`, matchingWeek.id);
        console.log(`WeekPicker: Saved week ${matchingWeek.id} to localStorage for user ${viewedUserId}`);
      }
      
      onWeekHoursChange(matchingWeek.hours);
    }
  }, [currentDate, filteredWeeks, viewedUserId, onWeekHoursChange]);

  const currentWeek = getCurrentWeek();
  const effectiveWeekId = currentWeekId || currentWeek?.id || filteredWeeks[0]?.id;

  useEffect(() => {
    if (currentWeek) {
      console.log(`WeekPicker: Current week updated to ${currentWeek.name} (${currentWeek.id})`);
      
      if (!currentWeek.startDate) {
        console.error('Current week has no start date:', currentWeek);
        return;
      }
      
      try {
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
      } catch (error) {
        console.error('Error processing current week:', currentWeek.startDate, error);
      }
    }
  }, [currentWeek?.id, currentWeek, currentDate, onWeekChange, onWeekHoursChange, viewedUserId]);

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
      
      if (!selectedWeek.startDate) {
        console.error('Selected week has no start date:', selectedWeek);
        return;
      }
      
      try {
        const date = parse(selectedWeek.startDate, "yyyy-MM-dd", new Date());
        onWeekChange(date);
        
        if (viewedUserId) {
          localStorage.setItem(`selectedWeek_${viewedUserId}`, weekId);
          console.log(`WeekPicker: Saved week ${weekId} to localStorage for user ${viewedUserId}`);
        }
        
        onWeekHoursChange(selectedWeek.hours);
        setCurrentWeekId(weekId);
      } catch (error) {
        console.error('Error handling week selection:', selectedWeek.startDate, error);
      }
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
    if (!newWeek || !newWeek.startDate) {
      console.error('New week has no start date:', newWeek);
      return;
    }
    
    try {
      console.log(`WeekPicker: Navigating to ${direction} week: ${newWeek.name} (${newWeek.id})`);
      const date = parse(newWeek.startDate, "yyyy-MM-dd", new Date());
      onWeekChange(date);
      
      if (viewedUserId) {
        localStorage.setItem(`selectedWeek_${viewedUserId}`, newWeek.id);
        console.log(`WeekPicker: Saved week ${newWeek.id} to localStorage for user ${viewedUserId}`);
      }
      
      onWeekHoursChange(newWeek.hours);
      setCurrentWeekId(newWeek.id);
    } catch (error) {
      console.error('Error navigating to week:', newWeek.startDate, error);
    }
  };

  const formatWeekLabel = (week: CustomWeek) => {
    if (!week.startDate || !week.endDate) {
      return `${week.name}: Invalid dates`;
    }
    
    try {
      const start = format(parse(week.startDate, "yyyy-MM-dd", new Date()), "MMM dd, yyyy");
      const end = format(parse(week.endDate, "yyyy-MM-dd", new Date()), "MMM dd, yyyy");
      
      const effectiveHours = Math.round(week.hours * (weekPercentage / 100));
      
      return `${week.name}: ${start} - ${end} (${effectiveHours}h)`;
    } catch (error) {
      console.error('Error formatting week label:', week, error);
      return `${week.name}: Date format error`;
    }
  };

  if (loading) {
    return <div className="w-full max-w-md mb-4 flex items-center justify-center p-4">Loading weeks...</div>;
  }

  if (filteredWeeks.length === 0) {
    return <div className="w-full max-w-md mb-4 flex items-center justify-center p-4">
      No weeks available for {filterYear ? `year ${filterYear}` : 'the selected filter'}. Try changing the filter.
    </div>;
  }

  return (
    <div className="w-full max-w-md mb-4 space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <label className="text-sm font-medium whitespace-nowrap">Filter by year:</label>
        <Select
          value={filterYear ? filterYear.toString() : "all"}
          onValueChange={(value) => setFilterYear(value === "all" ? null : parseInt(value))}
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
          value={effectiveWeekId || ""}
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
