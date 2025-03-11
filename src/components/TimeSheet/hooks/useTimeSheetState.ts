
import { useState } from 'react';
import { User, TimeSheetStatus } from '@/types/timesheet';

export const useTimeSheetState = (
  impersonatedUser: User | undefined,
  currentUser: User
) => {
  const [showSettings, setShowSettings] = useState(false);
  const [customWeeks, setCustomWeeks] = useState<any[]>([]);
  const [viewedUser, setViewedUser] = useState<User>(impersonatedUser || currentUser);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [weekHours, setWeekHours] = useState<number>(40);
  const [availableMediaTypes, setAvailableMediaTypes] = useState<string[]>(['TV', 'Radio', 'Print', 'Digital']);
  const [timeEntries, setTimeEntries] = useState<Record<string, Record<string, Record<string, { hours: number; status: TimeSheetStatus }>>>>({});
  const [submittedWeeks, setSubmittedWeeks] = useState<string[]>([]);
  const [weekStatuses, setWeekStatuses] = useState<Record<string, TimeSheetStatus>>({});
  const [weekPercentage, setWeekPercentage] = useState<number>(100);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [selectedMediaTypes, setSelectedMediaTypes] = useState<string[]>([]);
  const [currentCustomWeek, setCurrentCustomWeek] = useState<any>(null);
  
  return {
    showSettings,
    setShowSettings,
    customWeeks,
    setCustomWeeks,
    viewedUser,
    setViewedUser,
    currentDate,
    setCurrentDate,
    weekHours,
    setWeekHours,
    availableMediaTypes,
    setAvailableMediaTypes,
    timeEntries,
    setTimeEntries,
    submittedWeeks,
    setSubmittedWeeks,
    weekStatuses,
    setWeekStatuses,
    weekPercentage,
    setWeekPercentage,
    selectedClients,
    setSelectedClients,
    selectedMediaTypes,
    setSelectedMediaTypes,
    currentCustomWeek,
    setCurrentCustomWeek
  };
};
