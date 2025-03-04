
import React from 'react';
import { Button } from "@/components/ui/button";
import { RotateCcw, Settings2, FileDown } from "lucide-react";

interface TimeSheetHeaderProps {
  userRole: string;
  remainingHours: number;
  status: string;
  onReturnToFirstWeek: () => void;
  onToggleSettings: () => void;
  onExportToExcel: () => void;
  firstWeek?: string;
}

export const TimeSheetHeader = ({
  userRole,
  remainingHours,
  status,
  onReturnToFirstWeek,
  onToggleSettings,
  onExportToExcel,
  firstWeek,
}: TimeSheetHeaderProps) => {
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
        </p>
      </div>
      <div className="flex gap-2">
        {firstWeek && (
          <Button
            variant="outline"
            onClick={onReturnToFirstWeek}
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
          <FileDown className="h-4 w-4 mr-2" />
          Export to Excel
        </Button>
      </div>
    </div>
  );
};
