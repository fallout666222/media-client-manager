import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, parse, isSameDay, isBefore } from 'date-fns';
import { CustomWeek } from '@/types/timesheet';
import { getCustomWeeks, getWeekPercentages } from '@/integrations/supabase/database';

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
  const [userWeekPercentages, setUserWeekPercentages] = useState<Record<string, number>>({});

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

  // Fetch user's week percentages if we have a viewedUserId
  useEffect(() => {
    const fetchUserWeekPercentages = async () => {
      if (viewedUserId) {
        try {
          console.log(`Fetching week percentages for user: ${viewedUserId}`);
          const { data, error } = await getWeekPercentages(viewedUserId);
          
          if (error) {
            console.error('Error fetching week percentages:', error);
            return;
          }
          
          if (data && data.length > 0) {
            const percentagesMap: Record<string, number> = {};
            data.forEach(item => {
              percentagesMap[item.week_id] = Number(item.percentage);
            });
            console.log('User week percentages:', percentagesMap);
            setUserWeekPercentages(percentagesMap);
          }
        } catch (error) {
          console.error('Error fetching user week percentages:', error);
        }
      }
    };
    
    fetchUserWeekPercentages();
  }, [viewedUserId]);

  // Filter weeks to only include those on or after the user's first week
  const getFilteredWeeks = () => {
    if (availableWeeks.length === 0) return [];
    
    const firstWeekDate = parse(firstWeek, 'yyyy-MM-dd', new Date());
    return availableWeeks.filter(week => {
      const weekStartDate = parse(week.startDate, 'yyyy-MM-dd', new Date());
      return !isBefore(weekStartDate, firstWeekDate);
    }).sort((a, b) => {
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

  const getWeekPercentage = (weekId: string): number => {
    // If we have a specific percentage for this week, use it
    if (userWeekPercentages[weekId] !== undefined) {
      return userWeekPercentages[weekId];
    }
    
    // Otherwise use the provided weekPercentage prop
    return weekPercentage;
  };

  const formatWeekLabel = (week: CustomWeek) => {
    const start = format(parse(week.startDate, "yyyy-MM-dd", new Date()), "MMM dd, yyyy");
    const end = format(parse(week.endDate, "yyyy-MM-dd", new Date()), "MMM dd, yyyy");
    
    // Use the user-specific percentage if available
    const effectivePercentage = getWeekPercentage(week.id);
    
    // Calculate effective hours based on percentage for display only
    const effectiveHours = Math.round(week.hours * (effectivePercentage / 100));
    
    return `${week.name}: ${start} - ${end} (${effectiveHours}h)`;
  };

  if (loading || filteredWeeks.length === 0) {
    return <div className="w-full max-w-md mb-4 flex items-center justify-center p-4">Loading weeks...</div>;
  }

  return (
    <div className="w-full max-w-md mb-4 flex items-center gap-2">
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
  );
};
