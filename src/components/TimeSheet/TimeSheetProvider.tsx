
import React, { createContext, useContext } from 'react';
import { format } from 'date-fns';
import { User } from '@/types/timesheet';
import { useTimeSheetData } from '@/hooks/useTimeSheetData';
import { useTimeSheetActions } from '@/hooks/useTimeSheetActions';
import { TimeSheetContextType } from './types/TimeSheetContextType';
import { useTimeSheetState } from './hooks/useTimeSheetState';
import { useTimeSheetEffects } from './hooks/useTimeSheetEffects';

const TimeSheetContext = createContext<TimeSheetContextType | undefined>(undefined);

export const useTimeSheet = () => {
  const context = useContext(TimeSheetContext);
  if (context === undefined) {
    throw new Error('useTimeSheet must be used within a TimeSheetProvider');
  }
  return context;
};

interface TimeSheetProviderProps {
  userRole: 'admin' | 'user' | 'manager';
  firstWeek: string;
  currentUser: User;
  users: User[];
  clients: any[];
  readOnly?: boolean;
  impersonatedUser?: User;
  adminOverride?: boolean;
  customWeeks?: any[];
  initialWeekId?: string | null;
  isUserHead?: boolean;
  onTimeUpdate?: (weekId: string, client: string, mediaType: string, hours: number) => void;
  checkEarlierWeeksUnderReview?: (weekId: string) => boolean;
  children: React.ReactNode;
}

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
  const state = useTimeSheetState(impersonatedUser, currentUser);
  
  const {
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
    getCurrentWeekStatus
  } = useTimeSheetData({
    currentUser,
    viewedUser: state.viewedUser,
    currentDate: state.currentDate,
    customWeeks: state.customWeeks,
    initialWeekId,
    firstWeek,
    userRole,
    adminOverride
  });

  const timeSheetActions = useTimeSheetActions({
    currentUser,
    viewedUser: state.viewedUser,
    currentDate: state.currentDate,
    customWeeks: state.customWeeks,
    userRole,
    adminOverride,
    weekHours: state.weekHours,
    isUserHead,
    isViewingOwnTimesheet: impersonatedUser ? adminOverride : state.viewedUser.id === currentUser.id,
    firstWeek,
    setCurrentDate: state.setCurrentDate,
    weekPercentage,
    weekStatuses,
    submittedWeeks,
    setWeekStatuses,
    setSubmittedWeeks,
    timeEntries,
    setTimeEntries,
    getCurrentWeekStatus,
    checkEarlierWeeksUnderReview
  });

  useTimeSheetEffects({
    currentUser,
    viewedUser: state.viewedUser,
    currentDate: state.currentDate,
    customWeeks: state.customWeeks,
    setSelectedClients,
    setSelectedMediaTypes,
    setWeekStatuses,
    setSubmittedWeeks,
    setWeekPercentage,
    setTimeEntries,
    getCurrentWeekStatus,
    firstWeek
  });

  const contextValue: TimeSheetContextType = {
    ...state,
    ...timeSheetActions,
    currentUser,
    timeEntries,
    submittedWeeks,
    weekStatuses,
    weekPercentage,
    selectedClients,
    setSelectedClients,
    selectedMediaTypes,
    setSelectedMediaTypes,
    getCurrentWeekStatus,
    isViewingOwnTimesheet: impersonatedUser ? adminOverride : state.viewedUser.id === currentUser.id,
    availableClients: clients.map(client => client.name),
    clientsWithEntries: Object.keys(timeEntries[format(state.currentDate, 'yyyy-MM-dd')] || {}),
    mediaTypesWithEntries: Object.values(timeEntries[format(state.currentDate, 'yyyy-MM-dd')] || {})
      .flatMap(mediaEntries => Object.keys(mediaEntries)),
    timeUpdateHandler: async (client: string, mediaType: string, hours: number) => {
      if (onTimeUpdate && isUserHead && state.currentCustomWeek?.id) {
        onTimeUpdate(state.currentCustomWeek.id, client, mediaType, hours);
      } else {
        timeSheetActions.handleTimeUpdate(client, mediaType, hours);
      }
    },
    // Add missing handlers required by TimeSheetContextType
    handleAddClient: (client: string) => {
      console.log('Adding client:', client);
      // Implementation will be handled by client code
    },
    handleAddMediaType: (type: string) => {
      console.log('Adding media type:', type);
      // Implementation will be handled by client code
    },
    handleRemoveClient: (client: string) => {
      console.log('Removing client:', client);
      // Implementation will be handled by client code
    },
    handleRemoveMediaType: (type: string) => {
      console.log('Removing media type:', type);
      // Implementation will be handled by client code
    },
    handleSelectClient: (client: string) => {
      const isSelected = selectedClients.includes(client);
      if (isSelected) {
        setSelectedClients(prev => prev.filter(c => c !== client));
      } else {
        setSelectedClients(prev => [...prev, client]);
      }
    },
    handleSelectMediaType: (type: string) => {
      const isSelected = selectedMediaTypes.includes(type);
      if (isSelected) {
        setSelectedMediaTypes(prev => prev.filter(t => t !== type));
      } else {
        setSelectedMediaTypes(prev => [...prev, type]);
      }
    },
    handleReorderClients: (newOrder: string[]) => {
      setSelectedClients(newOrder);
    },
    handleReorderMediaTypes: (newOrder: string[]) => {
      setSelectedMediaTypes(newOrder);
    },
    handleUserSelect: (user: User) => {
      state.setViewedUser(user);
    },
    handleWeekHoursChange: (hours: number) => {
      state.setWeekHours(hours);
    }
  };

  return (
    <TimeSheetContext.Provider value={contextValue}>
      {children}
    </TimeSheetContext.Provider>
  );
};
