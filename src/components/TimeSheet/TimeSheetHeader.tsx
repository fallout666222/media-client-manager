
import React from 'react';
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, RotateCcw, Settings2 } from "lucide-react";

interface TimeSheetHeaderProps {
  userRole: string;
  remainingHours: number;
  status: string;
  onReturnToFirstUnsubmittedWeek: () => void;
  onToggleSettings: () => void;
  onExportToExcel: () => void;
  firstWeek?: string;
  weekPercentage?: number;
  totalWeekHours?: number;
}

export const TimeSheetHeader = ({
  userRole,
  remainingHours,
  status,
  onReturnToFirstUnsubmittedWeek,
  onToggleSettings,
  onExportToExcel,
  firstWeek,
  weekPercentage = 100,
  totalWeekHours = 40,
}: TimeSheetHeaderProps) => {
  // Calculate the adjusted total hours based on percentage
  const adjustedTotalHours = Math.round(totalWeekHours * (weekPercentage / 100));
  
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Timesheet</h1>
        <p className="text-sm text-muted-foreground">
          Status: <span className="font-medium capitalize">{status.replace('-', ' ')}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Logged in as: <span className="font-medium capitalize">{userRole || 'Unknown'}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Remaining Hours This Week: <span className="font-medium">{remainingHours}</span>
          {weekPercentage < 100 && (
            <span className="text-muted-foreground"> ({weekPercentage}% of {totalWeekHours}h = {adjustedTotalHours}h)</span>
          )}
        </p>
      </div>
      <div className="flex gap-2">
        {firstWeek && (
          <Button
            variant="outline"
            onClick={onReturnToFirstUnsubmittedWeek}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Return to First Unsubmitted Week
          </Button>
        )}
        <Button
          variant="outline"
          onClick={onToggleSettings}
        >
          <Settings2 className="h-4 w-4 mr-2" />
          Settings
        </Button>
        <Button
          variant="outline"
          onClick={onExportToExcel}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export to Excel
        </Button>
      </div>
    </div>
  );
};
