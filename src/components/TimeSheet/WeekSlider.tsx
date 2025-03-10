
import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, parse } from 'date-fns';
import { TimeSheetStatus } from '@/types/timesheet';

interface CustomWeek {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  hours: number;
  period_from?: string;
  period_to?: string;
  required_hours?: number;
}

interface WeekSliderProps {
  weeks: CustomWeek[];
  weekStatuses: Record<string, TimeSheetStatus>;
  currentWeekId?: string;
  onWeekSelect: (weekId: string) => void;
}

export const WeekSlider = ({ 
  weeks, 
  weekStatuses, 
  currentWeekId, 
  onWeekSelect 
}: WeekSliderProps) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  if (!weeks || weeks.length === 0) {
    return null;
  }

  const getStatusColor = (week: CustomWeek): string => {
    const weekKey = week.period_from || week.startDate;
    const status = weekStatuses[weekKey] || 'unconfirmed';
    
    switch (status) {
      case 'under-review':
        return 'bg-blue-100 border-blue-400';
      case 'accepted':
        return 'bg-green-100 border-green-400';
      case 'needs-revision':
        return 'bg-red-100 border-red-400';
      default:
        return 'bg-gray-100 border-gray-400';
    }
  };

  const getStatusText = (week: CustomWeek): string => {
    const weekKey = week.period_from || week.startDate;
    const status = weekStatuses[weekKey] || 'unconfirmed';
    
    switch (status) {
      case 'under-review':
        return 'Under Review';
      case 'accepted':
        return 'Accepted';
      case 'needs-revision':
        return 'Needs Revision';
      default:
        return 'Unconfirmed';
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    
    const scrollAmount = 300; // Scroll by 300px each time
    const currentScroll = sliderRef.current.scrollLeft;
    const newScroll = direction === 'left' 
      ? currentScroll - scrollAmount 
      : currentScroll + scrollAmount;
    
    sliderRef.current.scrollTo({
      left: newScroll,
      behavior: 'smooth'
    });

    // Update scroll buttons visibility after scrolling
    setTimeout(() => {
      if (!sliderRef.current) return;
      
      setShowLeftArrow(sliderRef.current.scrollLeft > 0);
      setShowRightArrow(
        sliderRef.current.scrollLeft + sliderRef.current.clientWidth < 
        sliderRef.current.scrollWidth - 10
      );
    }, 300);
  };

  const handleScroll = () => {
    if (!sliderRef.current) return;
    
    setShowLeftArrow(sliderRef.current.scrollLeft > 0);
    setShowRightArrow(
      sliderRef.current.scrollLeft + sliderRef.current.clientWidth < 
      sliderRef.current.scrollWidth - 10
    );
  };

  const formatDateRange = (week: CustomWeek) => {
    const startDate = parse(week.period_from || week.startDate, "yyyy-MM-dd", new Date());
    const endDate = parse(week.period_to || week.endDate, "yyyy-MM-dd", new Date());
    return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
  };

  return (
    <div className="mt-6 relative">
      <h3 className="text-sm font-medium mb-2">Available Weeks:</h3>
      <div className="flex items-center">
        {showLeftArrow && (
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 z-10"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        
        <div 
          ref={sliderRef}
          className="flex gap-3 overflow-x-auto py-2 px-2 scrollbar-hide w-full"
          onScroll={handleScroll}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {weeks.map(week => {
            const isCurrentWeek = week.id === currentWeekId;
            return (
              <TooltipProvider key={week.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className={`
                        flex-shrink-0 px-4 py-2 rounded-md border-2 cursor-pointer
                        hover:scale-105 transition-transform
                        ${getStatusColor(week)}
                        ${isCurrentWeek ? 'ring-2 ring-primary' : ''}
                      `}
                      onClick={() => onWeekSelect(week.id)}
                    >
                      <div className="text-sm font-medium">
                        {formatDateRange(week)}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div>
                      <p className="font-semibold">{week.name}</p>
                      <p className="text-xs">Status: {getStatusText(week)}</p>
                      <p className="text-xs">Hours: {week.required_hours || week.hours}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
        
        {showRightArrow && (
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 z-10"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
