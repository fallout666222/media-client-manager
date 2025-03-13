
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, Info, AlertCircle, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { parse, format, isWithinInterval, getYear } from 'date-fns';
import { useSettings } from '@/contexts/SettingsContext';

// ------------------- Type Definitions -------------------

export type WeekStatus = 'accepted' | 'under revision' | 'under review' | 'Unconfirmed';
export interface WeekData {
  week: string;
  status: WeekStatus;
  weekId?: string; // Added weekId to identify the week for navigation
  periodFrom?: string; // For date filtering by year
}

// ------------------- StatusCell Component -------------------

interface StatusCellProps {
  weekData: WeekData;
  onSelect: (weekData: WeekData) => void;
  isSelected: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  className?: string;
}
const getStatusColor = (status: WeekStatus): string => {
  switch (status.toLowerCase()) {
    case 'accepted':
      return 'bg-status-accepted hover:bg-status-accepted/90';
    case 'under revision':
      return 'bg-status-under-revision hover:bg-status-under-revision/90';
    case 'under review':
      return 'bg-status-under-review hover:bg-status-under-review/90';
    case 'unconfirmed':
    default:
      return 'bg-status-unconfirmed hover:bg-status-unconfirmed/90';
  }
};
export const StatusCell: React.FC<StatusCellProps> = ({
  weekData,
  onSelect,
  isSelected,
  isFirst = false,
  isLast = false,
  className
}) => {
  const { language } = useSettings();
  const statusColor = getStatusColor(weekData.status);
  const getBorderRadius = () => {
    if (isFirst) return 'rounded-l-md';
    if (isLast) return 'rounded-r-md';
    return '';
  };
  return <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={() => onSelect(weekData)} className={cn("h-12 transition-all duration-200 shadow-sm", statusColor, getBorderRadius(), isSelected && "ring-2 ring-offset-2 ring-black dark:ring-white relative z-10", className)} aria-label={`${weekData.week}: ${getStatusText(weekData.status, language)}`} />
        </TooltipTrigger>
        <TooltipContent>
          <p>{weekData.week}</p>
          <p className="font-medium">{getStatusText(weekData.status, language)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>;
};

// ------------------- StatusTimeline Component -------------------

interface StatusTimelineProps {
  weeks: WeekData[];
  selectedWeek: WeekData | null;
  onSelectWeek: (week: WeekData) => void;
  filterYear?: number | null;
}
export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  weeks,
  selectedWeek,
  onSelectWeek,
  filterYear = null
}) => {
  const { language } = useSettings();
  
  // Filter weeks by year if filterYear is provided
  const filteredWeeks = filterYear ? weeks.filter(week => {
    if (week.periodFrom) {
      try {
        const weekDate = parse(week.periodFrom, 'yyyy-MM-dd', new Date());
        return getYear(weekDate) === filterYear;
      } catch (error) {
        // console.error('Error filtering week by year in timeline:', week.periodFrom, error);
        return false;
      }
    }
    return true;
  }) : weeks;
  return <div className="w-full overflow-x-auto py-4">
      <div className="flex items-center w-full min-w-min px-4">
        {filteredWeeks.map((weekData, index) => <StatusCell key={weekData.week} weekData={weekData} onSelect={onSelectWeek} isSelected={selectedWeek?.week === weekData.week} isFirst={index === 0} isLast={index === filteredWeeks.length - 1} className="flex-1" />)}
      </div>
    </div>;
};

// ------------------- WeekDetails Component -------------------

interface WeekDetailsProps {
  weekData: WeekData | null;
}
const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'accepted':
      return <Check className="h-5 w-5 text-status-accepted" />;
    case 'under revision':
      return <AlertCircle className="h-5 w-5 text-status-under-revision" />;
    case 'under review':
      return <Info className="h-5 w-5 text-status-under-review" />;
    case 'unconfirmed':
    default:
      return <HelpCircle className="h-5 w-5 text-status-unconfirmed" />;
  }
};

const getStatusText = (status: string, language = 'en') => {
  const translations = {
    en: {
      'accepted': 'Accepted',
      'under revision': 'Under Revision',
      'under review': 'Under Review',
      'unconfirmed': 'Unconfirmed',
      'needs-revision': 'Needs Revision'
    },
    ru: {
      'accepted': 'Принято',
      'under revision': 'На доработке',
      'under review': 'На проверке',
      'unconfirmed': 'Не подтверждено',
      'needs-revision': 'Требует доработки'
    }
  };
  
  const statusKey = status.toLowerCase();
  return translations[language][statusKey] || status.charAt(0).toUpperCase() + status.slice(1);
};

export const WeekDetails: React.FC<WeekDetailsProps> = ({ weekData }) => {
  if (!weekData) {
    return null; // This fixes the void return type issue
  }
  
  return (
    <div className="mt-2">
      {/* Optional: You could add week details here */}
    </div>
  );
};
