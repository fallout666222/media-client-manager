import React, { useState, useEffect, createContext, useContext } from 'react';
import { format, parse, isSameDay } from 'date-fns';
import { TimeSheetStatus, User, Client } from '@/types/timesheet';
import { useTimeSheetData } from '@/hooks/useTimeSheetData';
import { useTimeSheetActions } from '@/hooks/useTimeSheetActions';
import { useToast } from '@/hooks/use-toast';
import { getCustomWeeks } from '@/integrations/supabase/database';

interface TimeSheetContextType {
  showSettings: boolean;
  setShowSettings: React.Dispatch<React.SetStateAction<boolean>>;
  customWeeks: any[];
  viewedUser: User;
  currentDate: Date;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  weekHours: number;
  setWeekHours: React.Dispatch<React.SetStateAction<number>>;
  isViewingOwnTimesheet: boolean;
  availableMediaTypes: string[];
  setAvailableMediaTypes: React.Dispatch<React.SetStateAction<string[]>>;
  availableClients: string[];
  timeEntries: Record<string, Record<string, Record<string, { hours: number; status: TimeSheetStatus }>>>;
  submittedWeeks: string[];
  weekStatuses: Record<string, TimeSheetStatus>;
  weekPercentage: number;
  selectedClients: string[];
  setSelectedClients: React.Dispatch<React.SetStateAction<string[]>>;
  selectedMediaTypes: string[];
  setSelectedMediaTypes: React.Dispatch<React.SetStateAction<string[]>>;
  handleReturnToFirstUnsubmittedWeek: () => void;
  handleNavigateToFirstUnderReviewWeek: () => void;
  handleTimeUpdate: (client: string, mediaType: string, hours: number) => void;
  handleSubmitForReview: () => void;
  handleApprove: () => void;
  handleReject: () => void;
  handleReturnToUnconfirmed: () => void;
  handleSaveVisibleClients: (clients: string[]) => void;
  handleSaveVisibleMediaTypes: (types: string[]) => void;
  getTotalHoursForWeek: () => number;
  hasUnsubmittedEarlierWeek: () => boolean;
  isCurrentWeekSubmitted: () => boolean;
  handleAddClient: (client: string) => void;
  handleAddMediaType: (type: string) => void;
  handleRemoveClient: (client: string) => void;
  handleRemoveMediaType: (type: string) => void;
  handleSelectClient: (client: string) => void;
  handleSelectMediaType: (type: string) => void;
  handleReorderClients: (newOrder: string[]) => void;
  handleReorderMediaTypes: (newOrder: string[]) => void;
  timeUpdateHandler: (client: string, mediaType: string, hours: number) => void;
  handleUserSelect: (user: User) => void;
  handleWeekHoursChange: (hours: number) => void;
  clientsWithEntries: string[];
  mediaTypesWithEntries: string[];
  getCurrentWeekStatus: (weekKey: string) => TimeSheetStatus;
  currentCustomWeek: any;
  handleProgressBarWeekSelect: (weekId: string) => void;
  filterYear: number | null;
  setFilterYear: React.Dispatch<React.SetStateAction<number | null>>;
}

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
  clients: Client[];
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
  const [showSettings, setShowSettings] = useState(false);
  const [customWeeks, setCustomWeeks] = useState<any[]>([]);
  const [viewedUser, setViewedUser] = useState<User>(impersonatedUser || currentUser);
  const viewedUserId = viewedUser.id;
  
  const [filterYear, setFilterYear] = useState<number | null>(() => {
    if (viewedUserId) {
      const savedYearFilter = localStorage.getItem(`selectedYearFilter_${viewedUserId}`);
      if (savedYearFilter) {
        console.log(`Initializing year filter ${savedYearFilter} from localStorage for user ${viewedUserId}`);
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
  const isViewingOwnTimesheet = impersonatedUser ? adminOverride : viewedUser.id === currentUser.id;
  const [availableMediaTypes, setAvailableMediaTypes] = useState<string[]>(DEFAULT_AVAILABLE_MEDIA_TYPES);
  const availableClients = clients.filter(client => !client.hidden).map(client => client.name);
  const { toast } = useToast();

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
    checkEarlierWeeksUnderReview
  });

  useEffect(() => {
    const fetchCustomWeeks = async () => {
      try {
        let weeksData;
        
        if (propCustomWeeks && propCustomWeeks.length > 0) {
          weeksData = propCustomWeeks;
          console.log(`Using ${weeksData.length} custom weeks from props`);
        } else {
          const { data } = await getCustomWeeks();
          weeksData = data || [];
          console.log(`Fetched ${weeksData.length} custom weeks from database`);
        }
        
        setCustomWeeks(weeksData);
        
        const savedWeekId = viewedUserId ? localStorage.getItem(`selectedWeek_${viewedUserId}`) : null;
        
        if (savedWeekId && weeksData.length > 0) {
          const savedWeek = weeksData.find((week: any) => week.id === savedWeekId);
          if (savedWeek) {
            console.log(`Setting to saved week from localStorage: ${savedWeek.name}`);
            setCurrentDate(parse(savedWeek.period_from, 'yyyy-MM-dd', new Date()));
            setCurrentCustomWeek(savedWeek);
            setWeekHours(savedWeek.required_hours);
            return;
          }
        }
        
        if (initialWeekId && weeksData.length > 0) {
          const initialWeek = weeksData.find((week: any) => week.id === initialWeekId);
          if (initialWeek) {
            console.log(`Setting initial week to: ${initialWeek.name}`);
            setCurrentDate(parse(initialWeek.period_from, 'yyyy-MM-dd', new Date()));
            setCurrentCustomWeek(initialWeek);
            setWeekHours(initialWeek.required_hours);
          }
        } else if (currentUser.firstCustomWeekId) {
          const userFirstWeek = weeksData.find((week: any) => week.id === currentUser.firstCustomWeekId);
          if (userFirstWeek) {
            setCurrentDate(parse(userFirstWeek.period_from, 'yyyy-MM-dd', new Date()));
            setCurrentCustomWeek(userFirstWeek);
            setWeekHours(userFirstWeek.required_hours);
          }
        }
      } catch (error) {
        console.error('Error fetching custom weeks:', error);
      }
    };
    
    fetchCustomWeeks();
  }, [currentUser.firstCustomWeekId, propCustomWeeks, initialWeekId, viewedUserId]);

  useEffect(() => {
    if (impersonatedUser) {
      setViewedUser(impersonatedUser);
    } else {
      setViewedUser(currentUser);
    }
  }, [impersonatedUser, currentUser]);

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

  const handleAddClient = (client: string) => {
    if (userRole !== 'admin') return;
    
    if (!availableClients.includes(client)) {
      toast({
        title: "Client Management Moved",
        description: "Please add new clients from the Client Tree page",
      });
    }
  };

  const handleAddMediaType = (type: string) => {
    if (userRole !== 'admin') return;
    
    if (!availableMediaTypes.includes(type)) {
      setAvailableMediaTypes(prev => [...prev, type]);
      setSelectedMediaTypes(prev => [...prev, type]);
    }
  };

  const handleRemoveClient = (client: string) => {
    if (readOnly) return;
    setSelectedClients(prev => prev.filter(c => c !== client));
  };

  const handleRemoveMediaType = (type: string) => {
    if (readOnly) return;
    
    if (userRole === 'admin') {
      setAvailableMediaTypes(prev => prev.filter(t => t !== type));
    }
    
    setSelectedMediaTypes(prev => prev.filter(t => t !== type));
  };

  const handleSelectClient = (client: string) => {
    if (!selectedClients.includes(client)) {
      setSelectedClients(prev => [...prev, client]);
    }
  };

  const handleSelectMediaType = (type: string) => {
    if (!selectedMediaTypes.includes(type)) {
      setSelectedMediaTypes(prev => [...prev, type]);
    }
  };

  const handleReorderClients = (newOrder: string[]) => {
    setSelectedClients(newOrder);
  };

  const handleReorderMediaTypes = (newOrder: string[]) => {
    setSelectedMediaTypes(newOrder);
  };

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

  const contextValue: TimeSheetContextType = {
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
