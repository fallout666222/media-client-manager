
import React from 'react';
import { Button } from "@/components/ui/button";
import { RotateCcw, Settings2 } from "lucide-react";
import { User } from '@/types/timesheet';
import { TeamMemberSelector } from '@/components/TeamMemberSelector';

interface TimeSheetHeaderProps {
  userRole: string;
  remainingHours?: number;
  status: string;
  onReturnToFirstUnsubmittedWeek?: () => void;
  onToggleSettings?: () => void;
  onExportToExcel?: () => void;
  firstWeek?: string;
  weekPercentage?: number;
  weekHours?: number;
  hasCustomWeeks?: boolean;
  
  // Add these properties to match what's being passed in TimeSheet.tsx
  user: User;
  users: User[];
  onUserChange: (user: User) => void;
  currentUser: User;
  readOnly: boolean;
  adminOverride: boolean;
  isUserHead: boolean;
}

export const TimeSheetHeader = ({
  userRole,
  remainingHours = 0,
  status,
  onReturnToFirstUnsubmittedWeek,
  onToggleSettings,
  firstWeek,
  weekPercentage = 100,
  weekHours = 40,
  hasCustomWeeks = true,
  user,
  users,
  onUserChange,
  currentUser,
  readOnly,
  adminOverride,
  isUserHead
}: TimeSheetHeaderProps) => {
  // Calculate the effective hours based on percentage
  const effectiveWeekHours = Math.round(weekHours * (weekPercentage / 100));
  
  const showTeamMemberSelector = userRole === 'admin' || userRole === 'manager' || isUserHead;
  
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
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
      
      <div className="flex flex-col md:flex-row gap-2">
        {showTeamMemberSelector && (
          <TeamMemberSelector
            users={users}
            selectedUser={user}
            onUserChange={onUserChange}
            currentUser={currentUser}
            readOnly={readOnly && !adminOverride}
          />
        )}
        
        <div className="flex gap-2">
          {onReturnToFirstUnsubmittedWeek && (
            <Button
              variant="outline"
              onClick={onReturnToFirstUnsubmittedWeek}
              className="flex items-center gap-2"
              disabled={!hasCustomWeeks}
              title={!hasCustomWeeks ? "No custom weeks available" : "Return to first unsubmitted week"}
            >
              <RotateCcw className="h-4 w-4" />
              First Unsubmitted
            </Button>
          )}
          
          {onToggleSettings && (
            <Button
              variant="outline"
              onClick={onToggleSettings}
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Settings
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
