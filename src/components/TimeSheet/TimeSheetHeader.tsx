
import React, { useState } from 'react';
import { TimeSheetStatus } from '@/types/timesheet';
import { Button } from "@/components/ui/button";
import { SettingsIcon, RefreshCcw, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { WeekProgressBar } from './WeekProgressBar';

interface TimeSheetHeaderProps {
  userRole: 'admin' | 'user' | 'manager';
  remainingHours: number;
  status: TimeSheetStatus;
  onReturnToFirstUnsubmittedWeek: () => void;
  onToggleSettings: () => void;
  firstWeek: string;
  weekPercentage: number;
  weekHours: number;
  hasCustomWeeks: boolean;
  weekStatuses?: any[];
  onWeekSelect?: (date: Date) => void;
}

export const TimeSheetHeader = ({ 
  userRole, 
  remainingHours, 
  status, 
  onReturnToFirstUnsubmittedWeek, 
  onToggleSettings, 
  firstWeek,
  weekPercentage,
  weekHours,
  hasCustomWeeks,
  weekStatuses = [],
  onWeekSelect = () => {}
}: TimeSheetHeaderProps) => {
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const availableYears = [...new Set(weekStatuses.map(week => {
    const date = new Date(week.startDate);
    return date.getFullYear().toString();
  }))].sort();
  
  const getStatusIcon = () => {
    switch (status) {
      case 'unconfirmed':
        return <Clock className="h-5 w-5 text-gray-500" />;
      case 'under-review':
        return <RefreshCcw className="h-5 w-5 text-blue-500" />;
      case 'accepted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'needs-revision':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'unconfirmed':
        return "Unconfirmed";
      case 'under-review':
        return "Under Review";
      case 'accepted':
        return "Accepted";
      case 'needs-revision':
        return "Needs Revision";
      default:
        return "";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'unconfirmed':
        return "bg-gray-100 text-gray-700";
      case 'under-review':
        return "bg-blue-100 text-blue-700";
      case 'accepted':
        return "bg-green-100 text-green-700";
      case 'needs-revision':
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Weekly Timesheet</h1>
        
        <div className="flex flex-wrap gap-3 items-center">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor()}`}>
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </div>
          
          {weekPercentage < 100 && (
            <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full flex items-center gap-2">
              <span>{weekPercentage}% Week</span>
            </div>
          )}
          
          <div className={`px-3 py-1 rounded-full ${
            remainingHours > 0 ? "bg-yellow-100 text-yellow-700" :
            remainingHours < 0 ? "bg-red-100 text-red-700" :
            "bg-green-100 text-green-700"
          }`}>
            <span>
              {remainingHours === 0 ? "Hours Complete" :
               remainingHours > 0 ? `${remainingHours} hours remaining` :
               `${Math.abs(remainingHours)} hours over`}
            </span>
          </div>
          
          {userRole !== 'admin' && (
            <Button 
              size="sm" 
              onClick={onReturnToFirstUnsubmittedWeek}
              variant="outline"
            >
              First Incomplete Week
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            onClick={onToggleSettings}
          >
            <SettingsIcon className="h-4 w-4 mr-1" />
            Settings
          </Button>
        </div>
      </div>
      
      {weekStatuses.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center">
            <label htmlFor="yearFilter" className="mr-2 text-sm font-medium">
              Select Year:
            </label>
            <select 
              id="yearFilter"
              className="px-2 py-1 border rounded-md text-sm"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {availableYears.length > 0 ? (
                availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))
              ) : (
                <option value={new Date().getFullYear().toString()}>
                  {new Date().getFullYear()}
                </option>
              )}
            </select>
          </div>
          
          <WeekProgressBar 
            weekStatuses={weekStatuses} 
            selectedYear={selectedYear} 
            onWeekSelect={onWeekSelect}
          />
        </div>
      )}
    </div>
  );
};
