
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { checkCustomWeekExists, supabase } from '@/integrations/supabase/client';

interface WeekPickerProps {
  currentDate: Date;
  onWeekChange: (date: Date) => void;
  onWeekHoursChange: (hours: number) => void;
  weekPercentage?: number;
  firstWeek?: string;
  customWeeks?: any[];
  viewedUserId?: string;
}

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
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());

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

  const fetchWeeks = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching weeks, last refresh:', new Date(lastRefreshTime).toISOString());
      
      if (propCustomWeeks.length > 0) {
        console.log('Using provided custom weeks:', propCustomWeeks);
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
        console.log('Fetching custom weeks from database...');
        const { data, error } = await getCustomWeeks();
        if (error) {
          console.error('Error fetching custom weeks:', error);
        } else if (data && data.length > 0) {
          console.log('Received custom weeks from database:', data);
          // Transform data to match CustomWeek interface
          const formattedWeeks = data.map(week => ({
            id: week.id,
            name: week.name,
            startDate: week.period_from,
            endDate: week.period_to,
            hours: week.required_hours
          }));
          setAvailableWeeks(formattedWeeks);
        } else {
          console.log('No custom weeks found in database');
        }
      }
    } catch (error) {
      console.error('Error fetching custom weeks:', error);
    } finally {
      setLoading(false);
      setLastRefreshTime(Date.now());
    }
  }, [propCustomWeeks, lastRefreshTime]);

  useEffect(() => {
    fetchWeeks();
    
    // Set up a periodic refresh of weeks
    const refreshInterval = setInterval(() => {
      console.log('Refreshing custom weeks data...');
      fetchWeeks();
    }, 10000); // Refresh every 10 seconds
    
    // Set up real-time subscription for custom_weeks table changes
    const weekSubscription = supabase
      .channel('custom_weeks_changes')
      .on('postgres_changes', {
        event: '*', 
        schema: 'public',
        table: 'custom_weeks'
      }, (payload) => {
        console.log('Detected change in custom_weeks table:', payload);
        fetchWeeks(); // Refresh weeks when changes are detected
      })
      .subscribe();
    
    return () => {
      clearInterval(refreshInterval);
      supabase.removeChannel(weekSubscription);
    };
  }, [fetchWeeks]);

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

  const handleCustomWeekSelect = async (weekId: string) => {
    console.log(`Selecting week with ID: ${weekId}`);
    
    try {
      // First check if this week is in our filtered list
      const selectedWeek = filteredWeeks.find(week => week.id === weekId);
      
      if (selectedWeek) {
        console.log('Found week in filtered list:', selectedWeek);
        applyWeekSelection(selectedWeek);
      } else {
        // If not in filtered list, try to fetch directly from database
        console.log('Week not found in filtered list, checking database...');
        const weekData = await checkCustomWeekExists(weekId);
        
        if (weekData) {
          console.log('Found week in database:', weekData);
          const formattedWeek = {
            id: weekData.id,
            name: weekData.name,
            startDate: weekData.period_from,
            endDate: weekData.period_to,
            hours: weekData.required_hours
          };
          applyWeekSelection(formattedWeek);
          
          // Also refresh our week list to include this week
          fetchWeeks();
        } else {
          console.error(`Could not find week with ID ${weekId}`);
          // Force refresh weeks list to ensure we have the latest data
          await fetchWeeks();
          
          // Try one more time after refresh
          const refreshedWeek = availableWeeks.find(week => week.id === weekId);
          if (refreshedWeek) {
            console.log('Found week after refresh:', refreshedWeek);
            applyWeekSelection(refreshedWeek);
          } else {
            console.error(`Week with ID ${weekId} not found even after refresh`);
          }
        }
      }
    } catch (error) {
      console.error('Error selecting week:', error);
    }
  };
  
  const applyWeekSelection = (week: CustomWeek) => {
    try {
      console.log(`Applying week selection: ${week.name} (${week.id})`);
      
      // Parse the start date string to a Date object
      const date = parse(week.startDate, "yyyy-MM-dd", new Date());
      console.log(`Parsed date:`, date);
      
      // Update the week in parent component
      onWeekChange(date);
      
      // Pass the base hours (not adjusted by percentage)
      onWeekHoursChange(week.hours);
      
      console.log(`Week selection applied successfully`);
    } catch (error) {
      console.error('Error applying week selection:', error);
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
    applyWeekSelection(newWeek);
  };

  const formatWeekLabel = (week: CustomWeek) => {
    const start = format(parse(week.startDate, "yyyy-MM-dd", new Date()), "MMM dd, yyyy");
    const end = format(parse(week.endDate, "yyyy-MM-dd", new Date()), "MMM dd, yyyy");
    
    // Calculate effective hours based on percentage for display only
    const effectiveHours = Math.round(week.hours * (weekPercentage / 100));
    
    return `${week.name}: ${start} - ${end} (${effectiveHours}h)`;
  };

  if (loading && filteredWeeks.length === 0) {
    return <div className="w-full max-w-md mb-4 flex items-center justify-center p-4">Loading weeks...</div>;
  }

  return (
    <div className="w-full max-w-md mb-4 space-y-2">
      {/* Manual refresh button */}
      <div className="flex justify-end mb-1">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchWeeks()}
          className="text-xs py-1 h-7"
        >
          Refresh Weeks
        </Button>
      </div>
      
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
          <SelectContent className="z-50">
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
