
import React from 'react';
import { Button } from "@/components/ui/button";
import { RotateCcw, Settings2 } from "lucide-react";

interface TimeSheetHeaderProps {
  userRole: string;
  remainingHours: number;
  status: string;
  onReturnToFirstUnsubmittedWeek: () => void;
  onToggleSettings: () => void;
  onExportToExcel?: () => void;  // Made optional
  firstWeek?: string;
  weekPercentage?: number;
  weekHours?: number;
  hasCustomWeeks?: boolean;
  showSettings?: boolean; // New prop to track if settings are shown
}

export const TimeSheetHeader = ({
  userRole,
  remainingHours,
  status,
  onReturnToFirstUnsubmittedWeek,
  onToggleSettings,
  firstWeek,
  weekPercentage = 100,
  weekHours = 40,
  hasCustomWeeks = true,
  showSettings = false, // Default to false
}: TimeSheetHeaderProps) => {
  // Calculate the effective hours based on percentage
  const effectiveWeekHours = Math.round(weekHours * (weekPercentage / 100));
  
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
          Remaining Hours This Week: <span className="font-medium">{remainingHours}</span> of {effectiveWeekHours}
        </p>
        {weekPercentage !== 100 && (
          <p className="text-sm text-muted-foreground">
            Week Percentage: <span className="font-medium">{weekPercentage}%</span>
          </p>
        )}
      </div>
      <div className="flex gap-2">
        {firstWeek && (
          <Button
            variant="outline"
            onClick={onReturnToFirstUnsubmittedWeek}
            className="flex items-center gap-2"
            disabled={!hasCustomWeeks}
            title={!hasCustomWeeks ? "No custom weeks available" : "Go to the first week that needs your attention (Unconfirmed or Needs Revision)"}
          >
            <RotateCcw className="h-4 w-4" />
            Go to First Unconfirmed/Revision Week
          </Button>
        )}
        <Button
          variant={showSettings ? "active" : "outline"}
          onClick={onToggleSettings}
        >
          <Settings2 className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>
    </div>
  );
};
