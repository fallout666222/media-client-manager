
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { parse, format, isAfter, isBefore, addWeeks, startOfWeek, isEqual, isSameDay } from 'date-fns';
import { TimeSheetStatus, TimeSheetData, User, Client, TimeEntry } from '@/types/timesheet';
import { TimeSheetHeader } from '@/components/TimeSheet/TimeSheetHeader';
import { TimeSheetControls } from '@/components/TimeSheet/TimeSheetControls';
import { TimeSheetContent } from '@/components/TimeSheet/TimeSheetContent';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TeamMemberSelector } from '@/components/TeamMemberSelector';
import { 
  getCustomWeeks, 
  getClients, 
  getMediaTypes
} from '@/integrations/supabase/database';
import { useTimeSheetData } from '@/hooks/useTimeSheetData';
import { useTimeSheetActions } from '@/hooks/useTimeSheetActions';

const DEFAULT_AVAILABLE_MEDIA_TYPES = ['TV', 'Radio', 'Print', 'Digital'];

interface TimeSheetProps {
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
}

const TimeSheet = ({ 
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
  checkEarlierWeeksUnderReview
}: TimeSheetProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const [customWeeks, setCustomWeeks] = useState<any[]>([]);
  const [viewedUser, setViewedUser] = useState<User>(impersonatedUser || currentUser);
  const viewedUserId = viewedUser.id;
  
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

  // Use our custom hooks
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
    // Update viewedUser when impersonatedUser changes
    if (impersonatedUser) {
      setViewedUser(impersonatedUser);
    } else {
      setViewedUser(currentUser);
    }
  }, [impersonatedUser, currentUser]);

  const handleUserSelect = (user: User) => {
    setViewedUser(user);
  };

  const handleWeekHoursChange = (hours: number) => {
    setWeekHours(hours);
  };

  // Get all clients and media types that have entries with hours > 0
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
      // Find the current weekId
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

  return (
    <div className="space-y-6">
      {userRole === 'manager' && !impersonatedUser && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">View Timesheet For:</h3>
          <TeamMemberSelector
            currentUser={currentUser}
            users={users}
            onUserSelect={handleUserSelect}
            selectedUser={viewedUser}
          />
        </div>
      )}

      {adminOverride && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Admin Override Mode:</strong> You have full control over this user's timesheet, including submitting, approving, rejecting, and modifying hours regardless of week status.
              </p>
            </div>
          </div>
        </div>
      )}

      <TimeSheetHeader
        userRole={userRole}
        remainingHours={Math.round(weekHours * (weekPercentage / 100)) - getTotalHoursForWeek()}
        status={getCurrentWeekStatus(format(currentDate, 'yyyy-MM-dd'))}
        onReturnToFirstUnsubmittedWeek={handleReturnToFirstUnsubmittedWeek}
        onToggleSettings={() => setShowSettings(!showSettings)}
        firstWeek={viewedUser.firstWeek || firstWeek}
        weekPercentage={weekPercentage}
        weekHours={weekHours}
        hasCustomWeeks={customWeeks.length > 0}
        showSettings={showSettings}
      />

      {hasUnsubmittedEarlierWeek() && !readOnly && !isCurrentWeekSubmitted() && !adminOverride && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            You have unsubmitted timesheets from previous weeks. Please submit them in chronological order.
          </AlertDescription>
        </Alert>
      )}

      <TimeSheetControls
        currentDate={currentDate}
        onWeekChange={(date) => {
          setCurrentDate(date);
          const hours = findWeekHours(date);
          setWeekHours(hours);
          
          const selectedWeek = customWeeks.find(week => 
            isSameDay(parse(week.period_from, 'yyyy-MM-dd', new Date()), date)
          );
          
          if (selectedWeek) {
            setCurrentCustomWeek(selectedWeek);
          } else {
            setCurrentCustomWeek(null);
          }
          
          if (viewedUserId) {
            localStorage.setItem(`selectedWeek_${viewedUserId}`, selectedWeek?.id || '');
          }
        }}
        onWeekHoursChange={handleWeekHoursChange}
        status={getCurrentWeekStatus(format(currentDate, 'yyyy-MM-dd'))}
        isManager={userRole === 'manager' || userRole === 'admin'}
        isViewingOwnTimesheet={isViewingOwnTimesheet}
        onSubmitForReview={handleSubmitForReview}
        onApprove={handleApprove}
        onReject={handleReject}
        readOnly={readOnly || (!isViewingOwnTimesheet && userRole !== 'manager' && userRole !== 'admin' && !adminOverride && !isUserHead)}
        firstWeek={viewedUser.firstWeek || firstWeek}
        weekId={currentCustomWeek?.id}
        weekPercentage={weekPercentage}
        customWeeks={customWeeks}
        adminOverride={adminOverride}
        isUserHead={isUserHead}
        viewedUserId={viewedUserId}
        hasEarlierWeeksUnderReview={isUserHead && checkEarlierWeeksUnderReview && currentCustomWeek?.id 
          ? checkEarlierWeeksUnderReview(currentCustomWeek.id) 
          : false}
        onNavigateToFirstUnderReview={isUserHead ? handleNavigateToFirstUnderReviewWeek : undefined}
      />

      <TimeSheetContent
        showSettings={showSettings}
        clients={availableClients}
        mediaTypes={availableMediaTypes}
        timeEntries={timeEntries[format(currentDate, 'yyyy-MM-dd')] || {}}
        status={getCurrentWeekStatus(format(currentDate, 'yyyy-MM-dd'))}
        onTimeUpdate={timeUpdateHandler}
        onAddClient={handleAddClient}
        onRemoveClient={handleRemoveClient}
        onAddMediaType={handleAddMediaType}
        onRemoveMediaType={handleRemoveMediaType}
        onSaveVisibleClients={handleSaveVisibleClients}
        onSaveVisibleMediaTypes={handleSaveVisibleMediaTypes}
        readOnly={readOnly || (!isViewingOwnTimesheet && !adminOverride && !isUserHead)}
        weekHours={weekHours}
        weekPercentage={weekPercentage}
        userRole={userRole}
        availableClients={availableClients}
        availableMediaTypes={availableMediaTypes}
        selectedClients={selectedClients}
        selectedMediaTypes={selectedMediaTypes}
        onSelectClient={handleSelectClient}
        onSelectMediaType={handleSelectMediaType}
        isViewingOwnTimesheet={isViewingOwnTimesheet || adminOverride || isUserHead}
        clientObjects={clients}
        adminOverride={adminOverride}
        onReorderClients={handleReorderClients}
        onReorderMediaTypes={handleReorderMediaTypes}
        currentUserId={currentUser.id}
        isUserHead={isUserHead}
      />
    </div>
  );
};

export default TimeSheet;
