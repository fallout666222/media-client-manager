
import React, { useEffect, useState } from 'react';
import { WeekPicker } from './WeekPicker';
import { ApprovalActions } from './ApprovalActions';
import { TimeSheetStatus } from '@/types/timesheet';
import { parse } from 'date-fns';
import { getCustomWeeks } from '@/integrations/supabase/database';

interface TimeSheetControlsProps {
  currentDate: Date;
  onWeekChange: (date: Date) => void;
  onWeekHoursChange: (hours: number) => void;
  status: TimeSheetStatus;
  isManager?: boolean;
  isViewingOwnTimesheet?: boolean;
  isUserHead?: boolean;
  onSubmitForReview?: () => void;
  onApprove: () => void;
  onReject: () => void;
  readOnly?: boolean;
  firstWeek: string;
  weekId?: string;
  weekPercentage?: number;
  customWeeks?: any[];
  adminOverride?: boolean;
}

export const TimeSheetControls = ({
  currentDate,
  onWeekChange,
  onWeekHoursChange,
  status,
  isManager = false,
  isViewingOwnTimesheet = true,
  isUserHead = false,
  onSubmitForReview,
  onApprove,
  onReject,
  readOnly = false,
  firstWeek,
  weekId,
  weekPercentage = 100,
  customWeeks = [],
  adminOverride = false
}: TimeSheetControlsProps) => {
  const [redirectApplied, setRedirectApplied] = useState(false);
  
  useEffect(() => {
    // Check for redirect information in localStorage
    const redirectData = localStorage.getItem('redirectToWeek');
    if (redirectData && !redirectApplied) {
      try {
        console.log(`[${new Date().toISOString()}] Found redirect data in localStorage:`, redirectData);
        const { weekId: redirectWeekId, date } = JSON.parse(redirectData);
        
        console.log(`[${new Date().toISOString()}] Looking for week with ID:`, redirectWeekId);
        console.log(`[${new Date().toISOString()}] Available custom weeks:`, customWeeks);
        
        // Find the week in customWeeks
        let weekToRedirectTo = customWeeks.find(week => week.id === redirectWeekId);
        
        if (weekToRedirectTo) {
          console.log(`[${new Date().toISOString()}] Found week to redirect to in customWeeks:`, weekToRedirectTo);
          applyRedirect(weekToRedirectTo, date);
        } else if (customWeeks.length === 0) {
          // If customWeeks is empty, fetch the week directly from the database
          console.log(`[${new Date().toISOString()}] customWeeks is empty, fetching week data directly...`);
          fetchWeekAndRedirect(redirectWeekId, date);
        } else {
          console.log(`[${new Date().toISOString()}] Week not found in available weeks`);
          // Clear the redirect data if we can't find the week
          localStorage.removeItem('redirectToWeek');
        }
      } catch (error) {
        console.error('Error processing redirect data:', error);
        localStorage.removeItem('redirectToWeek');
      }
    }
  }, [customWeeks, onWeekChange, onWeekHoursChange, redirectApplied]);
  
  const fetchWeekAndRedirect = async (weekId: string, date: string) => {
    try {
      const { data, error } = await getCustomWeeks();
      if (error) {
        console.error('Error fetching custom weeks:', error);
        return;
      }
      
      if (data && data.length > 0) {
        const weekToRedirectTo = data.find(week => week.id === weekId);
        if (weekToRedirectTo) {
          console.log(`[${new Date().toISOString()}] Found week to redirect to from database:`, weekToRedirectTo);
          applyRedirect(weekToRedirectTo, date);
        } else {
          console.log(`[${new Date().toISOString()}] Week not found in database`);
          localStorage.removeItem('redirectToWeek');
        }
      }
    } catch (error) {
      console.error('Error fetching week data:', error);
      localStorage.removeItem('redirectToWeek');
    }
  };
  
  const applyRedirect = (weekData: any, date: string) => {
    // Convert the date string to a Date object
    const dateObj = parse(date, 'yyyy-MM-dd', new Date());
    
    // Mark redirect as applied to prevent multiple redirects
    setRedirectApplied(true);
    
    // Clear the redirect data immediately to prevent further processing
    localStorage.removeItem('redirectToWeek');
    
    console.log(`[${new Date().toISOString()}] Applying redirect to week:`, weekData.name, 'date:', date, 'hours:', weekData.required_hours);
    
    // Update the week hours first
    if (weekData.required_hours) {
      onWeekHoursChange(weekData.required_hours);
    }
    
    // Then update the current week (triggers data reload)
    onWeekChange(dateObj);
    
    console.log(`[${new Date().toISOString()}] Redirected to week:`, weekData.name);
  };
  
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between p-4 bg-muted rounded-lg">
      <div>
        <WeekPicker
          currentDate={currentDate}
          onWeekChange={onWeekChange}
          onWeekHoursChange={onWeekHoursChange}
          firstWeek={firstWeek}
          weekPercentage={weekPercentage}
          customWeeks={customWeeks}
        />
      </div>
      
      <div className="flex items-center gap-4">
        <ApprovalActions
          status={status}
          isManager={isManager}
          isViewingOwnTimesheet={isViewingOwnTimesheet}
          isUserHead={isUserHead}
          onSubmitForReview={onSubmitForReview}
          onApprove={onApprove}
          onReject={onReject}
          disabled={readOnly && !adminOverride}
          weekId={weekId}
          adminOverride={adminOverride}
        />
      </div>
    </div>
  );
};
