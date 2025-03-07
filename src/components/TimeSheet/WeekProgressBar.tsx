
import React, { useState, useEffect } from 'react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TimeSheetStatus } from '@/types/timesheet';
import { format, parse } from 'date-fns';

interface WeekStatusData {
  weekId: string;
  weekName: string;
  startDate: string;
  status: TimeSheetStatus;
}

interface WeekProgressBarProps {
  weekStatuses: WeekStatusData[];
  selectedYear: string;
  onWeekSelect: (date: Date) => void;
}

export const WeekProgressBar: React.FC<WeekProgressBarProps> = ({ 
  weekStatuses, 
  selectedYear,
  onWeekSelect 
}) => {
  const [filteredWeeks, setFilteredWeeks] = useState<WeekStatusData[]>([]);

  useEffect(() => {
    // Filter weeks for the selected year
    const weeksInYear = weekStatuses.filter(week => {
      const weekDate = parse(week.startDate, 'yyyy-MM-dd', new Date());
      return format(weekDate, 'yyyy') === selectedYear;
    });
    
    setFilteredWeeks(weeksInYear);
  }, [weekStatuses, selectedYear]);

  if (filteredWeeks.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center p-2">
        No weeks data available for {selectedYear}
      </div>
    );
  }

  const getStatusColor = (status: TimeSheetStatus): string => {
    switch (status) {
      case 'unconfirmed':
        return 'bg-gray-300';
      case 'under-review':
        return 'bg-blue-400';
      case 'accepted':
        return 'bg-green-500';
      case 'needs-revision':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };
  
  const getStatusLabel = (status: TimeSheetStatus): string => {
    switch (status) {
      case 'unconfirmed':
        return 'Unconfirmed';
      case 'under-review':
        return 'Under Review';
      case 'accepted':
        return 'Accepted';
      case 'needs-revision':
        return 'Needs Revision';
      default:
        return 'Unknown';
    }
  };

  const handleWeekClick = (week: WeekStatusData) => {
    const date = parse(week.startDate, 'yyyy-MM-dd', new Date());
    onWeekSelect(date);
  };

  return (
    <div className="mt-2 mb-6">
      <h3 className="text-sm font-medium mb-2">Weekly Status Overview - {selectedYear}</h3>
      <div className="flex w-full h-8 rounded-md overflow-hidden">
        {filteredWeeks.map((week, index) => (
          <TooltipProvider key={week.weekId}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className={`${getStatusColor(week.status)} hover:opacity-80 cursor-pointer transition-opacity`}
                  style={{ width: `${100 / filteredWeeks.length}%` }}
                  onClick={() => handleWeekClick(week)}
                >
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="text-sm">
                  <p className="font-semibold">{week.weekName}</p>
                  <p>{format(parse(week.startDate, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy')}</p>
                  <p>Status: {getStatusLabel(week.status)}</p>
                  <p className="text-xs italic mt-1">Click to view this week</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
      <div className="flex justify-between mt-1 text-xs text-gray-500">
        <span>Week 1</span>
        <span>Week {filteredWeeks.length}</span>
      </div>
    </div>
  );
};
