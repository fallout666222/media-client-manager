import React, { useState, useEffect } from 'react';
import { format, parse, isSameDay } from 'date-fns';
import { TimeSheetStatus, User, Client } from '@/types/timesheet';
import { useTimeSheetData } from '@/hooks/useTimeSheetData';
import { useTimeSheetActions } from '@/hooks/useTimeSheetActions';
import { useToast } from '@/hooks/use-toast';
import TimeSheetContext from './TimeSheetContext/TimeSheetContext';
import { TimeSheetProviderProps } from './TimeSheetContext/types';
import { useTimeSheetInitialization } from './TimeSheetContext/useTimeSheetInitialization';
import { useClientMediaTypeManagement } from './TimeSheetContext/useClientMediaTypeManagement';

const DEFAULT_AVAILABLE_MEDIA_TYPES = ['TV', 'Radio', 'Print', 'Digital'];

export const TimeSheetProvider: React.FC<TimeSheetProviderProps> = ({
  userRole,
  firstWeek,
  currentUser,
  users,
  clients,
  readOnly = false,
  impersonatedUser,
  adminOverride = false,
  customWeeks: propCustomWeeks,
  initialWeekId = null,
  isUserHead = false,
  onTimeUpdate,
  checkEarlierWeeksUnderReview,
  children
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [viewedUser, setViewedUser] = useState<User>(impersonatedUser || currentUser);
  const viewedUserId = viewedUser.id;
  
  const [filterYear, setFilterYear] = useState<number | null>(() => {
    if (viewedUserId) {
      const savedYearFilter = localStorage.getItem(`selectedYearFilter_${viewedUserId}`);
      if (savedYearFilter) {
        return parseInt(savedYearFilter);
      }
    }
    return null;
  });
  
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (initialWeekId) return new Date();
    
    if (userRole === 'admin' && (!firstWeek || firstWeek === 'null') && !currentUser.firstCustomWeekId) {
      return parse("2024-01-01", 'yyyy-MM-dd', new Date());
    }
    if (currentUser.firstCustomWeekId) {
      return new Date();
    }
    return parse(firstWeek, 'yyyy-MM-dd', new Date());
  });
  
  const [weekHours, setWeekHours] = useState<number>(40);
  const [availableMediaTypes, setAvailableMediaTypes] = useState<string[]>(DEFAULT_AVAILABLE_MEDIA_TYPES);
  const isViewingOwnTimesheet = impersonatedUser ? adminOverride : viewedUser.id === currentUser.id;
  const availableClients = clients.filter(client => !client.hidden).map(client => client.name);
  const [currentCustomWeekState, setCurrentCustomWeekState] = useState<any>(null);

  const { customWeeks } = useTimeSheetInitialization({
    currentUser,
    viewedUser,
    viewedUserId,
    currentDate,
    setCurrentDate,
    setCurrentCustomWeek: setCurrentCustomWeekState,
    setWeekHours,
    propCustomWeeks,
    initialWeekId
  });

  const {
    timeEntries,
    setTimeEntries,
    submittedWeeks,
    setSubmittedWeeks,
    weekStatuses,
    setWeekStatuses,
    weekPercentage,
    selectedClients,
    setSelectedClients,
    selectedMediaTypes,
    setSelectedMediaTypes,
    getCurrentWeekStatus
  } = useTimeSheetData({
    currentUser,
    viewedUser,
    currentDate,
    customWeeks,
    initialWeekId,
    firstWeek,
    userRole,
    adminOverride
  });

  const {
    handleReturnToFirstUnsubmittedWeek,
    handleNavigateToFirstUnderReviewWeek,
    handleTimeUpdate,
    handleSubmitForReview,
    handleApprove,
    handleReject,
    handleReturnToUnconfirmed,
    handleSaveVisibleClients,
    handleSaveVisibleMediaTypes,
    getTotalHoursForWeek,
    hasUnsubmittedEarlierWeek,
    isCurrentWeekSubmitted,
    findWeekHours,
    setCurrentCustomWeek,
    currentCustomWeek
  } = useTimeSheetActions({
    currentUser,
    viewedUser,
    currentDate,
    customWeeks,
    userRole,
    adminOverride,
    weekHours,
    isUserHead,
    isViewingOwnTimesheet,
    firstWeek,
    setCurrentDate,
    weekPercentage,
    weekStatuses,
    submittedWeeks,
    setWeekStatuses,
    setSubmittedWeeks,
    timeEntries,
    setTimeEntries,
    getCurrentWeekStatus,
    checkEarlierWeeksUnderReview,
    filterYear,
    setFilterYear
  });

  const {
    handleAddClient,
    handleAddMediaType,
    handleRemoveClient,
    handleRemoveMediaType,
    handleSelectClient,
    handleSelectMediaType,
    handleReorderClients,
    handleReorderMediaTypes
  } = useClientMediaTypeManagement({
    userRole,
    availableClients,
    availableMediaTypes,
    setAvailableMediaTypes,
    selectedClients,
    setSelectedClients,
    selectedMediaTypes,
    setSelectedMediaTypes,
    readOnly
  });

  useEffect(() => {
    if (impersonatedUser) {
      setViewedUser(impersonatedUser);
    } else {
      setViewedUser(currentUser);
    }
  }, [impersonatedUser, currentUser]);

  useEffect(() => {
    if (currentCustomWeekState && (!currentCustomWeek || currentCustomWeekState.id !== currentCustomWeek.id)) {
      setCurrentCustomWeek(currentCustomWeekState);
    }
  }, [currentCustomWeekState, currentCustomWeek, setCurrentCustomWeek]);

  const handleProgressBarWeekSelect = (weekId: string) => {
    if (!customWeeks.length) return;
    
    const selectedWeek = customWeeks.find(week => week.id === weekId);
    if (selectedWeek) {
      setCurrentDate(parse(selectedWeek.period_from, 'yyyy-MM-dd', new Date()));
      setCurrentCustomWeek(selectedWeek);
      setWeekHours(selectedWeek.required_hours);
      
      if (viewedUserId) {
        localStorage.setItem(`selectedWeek_${viewedUserId}`, selectedWeek.id);
      }
    }
  };

  const handleUserSelect = (user: User) => {
    setViewedUser(user);
  };

  const handleWeekHoursChange = (hours: number) => {
    setWeekHours(hours);
  };

  const clientsWithEntries = Object.entries(timeEntries[format(currentDate, 'yyyy-MM-dd')] || {})
    .filter(([_, mediaEntries]) => 
      Object.values(mediaEntries).some(entry => entry.hours && entry.hours > 0)
    )
    .map(([client]) => client);
  
  const mediaTypesWithEntries = Object.values(timeEntries[format(currentDate, 'yyyy-MM-dd')] || {})
    .flatMap(mediaEntries => 
      Object.entries(mediaEntries)
        .filter(([_, entry]) => entry.hours && entry.hours > 0)
        .map(([mediaType]) => mediaType)
    );

  const timeUpdateHandler = async (client: string, mediaType: string, hours: number) => {
    if (onTimeUpdate && isUserHead) {
      const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
      let weekId = null;
      
      const customWeek = customWeeks.find(week => 
        format(parse(week.period_from, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') === currentWeekKey
      );
      
      if (customWeek) {
        weekId = customWeek.id;
        onTimeUpdate(weekId, client, mediaType, hours);
      }
    } else {
      handleTimeUpdate(client, mediaType, hours);
    }
  };

  const contextValue = {
    showSettings,
    setShowSettings,
    customWeeks,
    viewedUser,
    currentDate,
    setCurrentDate,
    weekHours,
    setWeekHours,
    isViewingOwnTimesheet,
    availableMediaTypes,
    setAvailableMediaTypes,
    availableClients,
    timeEntries,
    submittedWeeks,
    weekStatuses,
    weekPercentage,
    selectedClients,
    setSelectedClients,
    selectedMediaTypes,
    setSelectedMediaTypes,
    handleReturnToFirstUnsubmittedWeek,
    handleNavigateToFirstUnderReviewWeek,
    handleTimeUpdate,
    handleSubmitForReview,
    handleApprove,
    handleReject,
    handleReturnToUnconfirmed,
    handleSaveVisibleClients,
    handleSaveVisibleMediaTypes,
    getTotalHoursForWeek,
    hasUnsubmittedEarlierWeek,
    isCurrentWeekSubmitted,
    handleAddClient,
    handleAddMediaType,
    handleRemoveClient,
    handleRemoveMediaType,
    handleSelectClient,
    handleSelectMediaType,
    handleReorderClients,
    handleReorderMediaTypes,
    timeUpdateHandler,
    handleUserSelect,
    handleWeekHoursChange,
    clientsWithEntries,
    mediaTypesWithEntries,
    getCurrentWeekStatus,
    currentCustomWeek,
    handleProgressBarWeekSelect,
    filterYear,
    setFilterYear
  };

  return (
    <TimeSheetContext.Provider value={contextValue}>
      {children}
    </TimeSheetContext.Provider>
  );
};
