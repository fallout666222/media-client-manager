import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { parse, format, isAfter, isBefore, addWeeks, startOfWeek, isEqual, isSameDay } from 'date-fns';
import { TimeSheetStatus, TimeSheetData, User } from '@/types/timesheet';
import { TimeSheetHeader } from '@/components/TimeSheet/TimeSheetHeader';
import { TimeSheetControls } from '@/components/TimeSheet/TimeSheetControls';
import { TimeSheetContent } from '@/components/TimeSheet/TimeSheetContent';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TeamMemberSelector } from '@/components/TeamMemberSelector';

const DEFAULT_WEEKS = [
  { id: "1", startDate: "2025-01-01", endDate: "2025-01-06", hours: 48 },
  { id: "2", startDate: "2025-01-10", endDate: "2025-01-03", hours: 40 },
  { id: "3", startDate: "2025-01-13", endDate: "2025-01-17", hours: 40 },
  { id: "4", startDate: "2025-01-20", endDate: "2025-01-24", hours: 40 },
  { id: "5", startDate: "2025-01-27", endDate: "2025-01-31", hours: 40 },
];

const DEFAULT_AVAILABLE_CLIENTS = [
  'Administrative',
  'Education/Training',
  'General Research',
  'Network Requests',
  'New Business',
  'Sick Leave',
  'VACATION'
];

const DEFAULT_AVAILABLE_MEDIA_TYPES = ['TV', 'Radio', 'Print', 'Digital'];

interface TimeSheetProps {
  userRole: 'admin' | 'user' | 'manager';
  firstWeek: string;
  currentUser: User;
  users: User[];
  readOnly?: boolean;
}

const TimeSheet = ({ userRole, firstWeek, currentUser, users, readOnly = false }: TimeSheetProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(
    parse(firstWeek, 'yyyy-MM-dd', new Date())
  );
  const [weekHours, setWeekHours] = useState(() => {
    const initialWeek = DEFAULT_WEEKS.find(week => 
      isSameDay(parse(week.startDate, 'yyyy-MM-dd', new Date()), parse(firstWeek, 'yyyy-MM-dd', new Date()))
    );
    return initialWeek?.hours || 40;
  });
  
  const [availableClients, setAvailableClients] = useState<string[]>(DEFAULT_AVAILABLE_CLIENTS);
  const [availableMediaTypes, setAvailableMediaTypes] = useState<string[]>(DEFAULT_AVAILABLE_MEDIA_TYPES);
  
  const [selectedClients, setSelectedClients] = useState<string[]>(DEFAULT_AVAILABLE_CLIENTS);
  const [selectedMediaTypes, setSelectedMediaTypes] = useState<string[]>(DEFAULT_AVAILABLE_MEDIA_TYPES);
  
  const [timeEntries, setTimeEntries] = useState<Record<string, TimeSheetData>>({});
  const [submittedWeeks, setSubmittedWeeks] = useState<string[]>([]);
  const [weekStatuses, setWeekStatuses] = useState<Record<string, TimeSheetStatus>>({});
  const { toast } = useToast();

  const findFirstUnsubmittedWeek = () => {
    for (const week of DEFAULT_WEEKS) {
      const weekKey = week.startDate;
      if (!submittedWeeks.includes(weekKey)) {
        return parse(weekKey, 'yyyy-MM-dd', new Date());
      }
    }
    return null;
  };

  const handleReturnToFirstUnsubmittedWeek = () => {
    const firstUnsubmittedWeek = findFirstUnsubmittedWeek();
    if (firstUnsubmittedWeek) {
      const unsubmittedWeek = DEFAULT_WEEKS.find(week => 
        isSameDay(parse(week.startDate, 'yyyy-MM-dd', new Date()), firstUnsubmittedWeek)
      );
      setCurrentDate(firstUnsubmittedWeek);
      if (unsubmittedWeek) {
        setWeekHours(unsubmittedWeek.hours);
      }
    }
  };

  const getCurrentWeekStatus = (): TimeSheetStatus => {
    const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
    return weekStatuses[currentWeekKey] || 'unconfirmed';
  };

  const getTotalHoursForWeek = (): number => {
    const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
    const weekEntries = timeEntries[currentWeekKey] || {};
    
    return Object.values(weekEntries).reduce((clientSum, mediaEntries) => {
      return clientSum + Object.values(mediaEntries).reduce((mediaSum, entry) => {
        return mediaSum + (entry.hours || 0);
      }, 0);
    }, 0);
  };

  const handleSubmitForReview = () => {
    if (readOnly) return;
    
    const firstUnsubmittedWeek = findFirstUnsubmittedWeek();
    const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
    const totalHours = getTotalHoursForWeek();
    const remainingHours = weekHours - totalHours;
    
    if (remainingHours !== 0) {
      toast({
        title: "Cannot Submit Timesheet",
        description: `You must fill in exactly ${weekHours} hours for this week. Remaining: ${remainingHours} hours`,
        variant: "destructive"
      });
      return;
    }
    
    if (firstUnsubmittedWeek && !isSameDay(firstUnsubmittedWeek, currentDate)) {
      toast({
        title: "Cannot Submit This Week",
        description: `Week not submitted because previous weeks haven't been filled in yet.`,
        variant: "destructive"
      });
      
      const unsubmittedWeek = DEFAULT_WEEKS.find(week => 
        isSameDay(parse(week.startDate, 'yyyy-MM-dd', new Date()), firstUnsubmittedWeek)
      );
      setCurrentDate(firstUnsubmittedWeek);
      if (unsubmittedWeek) {
        setWeekHours(unsubmittedWeek.hours);
      }
      
      return;
    }

    setSubmittedWeeks(prev => {
      if (!prev.includes(currentWeekKey)) {
        return [...prev, currentWeekKey];
      }
      return prev;
    });
    
    setWeekStatuses(prev => ({
      ...prev,
      [currentWeekKey]: 'under-review'
    }));
    
    toast({
      title: "Timesheet Under Review",
      description: `Week of ${format(currentDate, 'MMM d, yyyy')} has been submitted and is now under review`,
    });
  };

  const handleApprove = () => {
    if (readOnly) return;
    
    const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
    setWeekStatuses(prev => ({
      ...prev,
      [currentWeekKey]: 'accepted'
    }));
    toast({
      title: "Timesheet Approved",
      description: `Week of ${format(currentDate, 'MMM d, yyyy')} has been approved`,
    });
  };

  const handleReject = () => {
    if (readOnly) return;
    
    const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
    setWeekStatuses(prev => ({
      ...prev,
      [currentWeekKey]: 'needs-revision'
    }));
    setSubmittedWeeks(prev => prev.filter(week => week !== currentWeekKey));
    toast({
      title: "Timesheet Rejected",
      description: `Week of ${format(currentDate, 'MMM d, yyyy')} needs revision`,
    });
  };

  const hasUnsubmittedEarlierWeek = () => {
    const firstUnsubmitted = findFirstUnsubmittedWeek();
    return firstUnsubmitted && !isSameDay(firstUnsubmitted, currentDate);
  }

  const isCurrentWeekSubmitted = () => {
    const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
    return submittedWeeks.includes(currentWeekKey) || 
           weekStatuses[currentWeekKey] === 'under-review' || 
           weekStatuses[currentWeekKey] === 'accepted';
  }

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

  const handleAddClient = (client: string) => {
    if (userRole !== 'admin') return;
    
    if (!availableClients.includes(client)) {
      setAvailableClients(prev => [...prev, client]);
      setSelectedClients(prev => [...prev, client]);
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
    
    if (userRole === 'admin') {
      setAvailableClients(prev => prev.filter(c => c !== client));
    }
    
    setSelectedClients(prev => prev.filter(c => c !== client));
  };

  const handleRemoveMediaType = (type: string) => {
    if (readOnly) return;
    
    if (userRole === 'admin') {
      setAvailableMediaTypes(prev => prev.filter(t => t !== type));
    }
    
    setSelectedMediaTypes(prev => prev.filter(t => t !== type));
  };

  const [viewedUser, setViewedUser] = useState<User>(currentUser);
  const isViewingOwnTimesheet = viewedUser.id === currentUser.id;

  useEffect(() => {
    if (viewedUser.firstWeek) {
      setCurrentDate(parse(viewedUser.firstWeek, 'yyyy-MM-dd', new Date()));
      const initialWeek = DEFAULT_WEEKS.find(week => 
        isSameDay(parse(week.startDate, 'yyyy-MM-dd', new Date()), parse(viewedUser.firstWeek || firstWeek, 'yyyy-MM-dd', new Date()))
      );
      if (initialWeek) {
        setWeekHours(initialWeek.hours);
      }
    }
  }, [viewedUser, firstWeek]);

  return (
    <div className="space-y-6">
      {userRole === 'manager' && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">View Timesheet For:</h3>
          <TeamMemberSelector
            currentUser={currentUser}
            users={users}
            onUserSelect={setViewedUser}
            selectedUser={viewedUser}
          />
        </div>
      )}

      <TimeSheetHeader
        userRole={userRole}
        remainingHours={weekHours - getTotalHoursForWeek()}
        status={getCurrentWeekStatus()}
        onReturnToFirstWeek={handleReturnToFirstUnsubmittedWeek}
        onToggleSettings={() => setShowSettings(!showSettings)}
        onExportToExcel={() => {
          toast({
            title: "Export Started",
            description: "Your timesheet is being exported to Excel",
          });
        }}
        firstWeek={viewedUser.firstWeek || firstWeek}
      />

      {hasUnsubmittedEarlierWeek() && !readOnly && !isCurrentWeekSubmitted() && (
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
          const selectedWeek = DEFAULT_WEEKS.find(week => 
            isSameDay(parse(week.startDate, 'yyyy-MM-dd', new Date()), date)
          );
          if (selectedWeek) {
            setWeekHours(selectedWeek.hours);
          }
        }}
        onWeekHoursChange={setWeekHours}
        status={getCurrentWeekStatus()}
        isManager={userRole === 'manager' || userRole === 'admin'}
        isViewingOwnTimesheet={isViewingOwnTimesheet}
        onSubmitForReview={handleSubmitForReview}
        onApprove={handleApprove}
        onReject={handleReject}
        readOnly={readOnly || (!isViewingOwnTimesheet && userRole !== 'manager' && userRole !== 'admin')}
      />

      <TimeSheetContent
        showSettings={showSettings}
        clients={availableClients}
        mediaTypes={availableMediaTypes}
        timeEntries={timeEntries[format(currentDate, 'yyyy-MM-dd')] || {}}
        status={getCurrentWeekStatus()}
        onTimeUpdate={(client, mediaType, hours) => {
          if (readOnly || !isViewingOwnTimesheet) return;
          const weekKey = format(currentDate, 'yyyy-MM-dd');
          const currentTotal = getTotalHoursForWeek();
          const existingHours = timeEntries[weekKey]?.[client]?.[mediaType]?.hours || 0;
          const newTotalHours = currentTotal - existingHours + hours;

          if (newTotalHours > weekHours) {
            toast({
              title: "Cannot Add Hours",
              description: `Total hours cannot exceed ${weekHours} for this week`,
              variant: "destructive"
            });
            return;
          }

          setTimeEntries(prev => ({
            ...prev,
            [weekKey]: {
              ...prev[weekKey],
              [client]: {
                ...prev[weekKey]?.[client],
                [mediaType]: { hours, status: getCurrentWeekStatus() }
              }
            }
          }));
        }}
        onAddClient={handleAddClient}
        onRemoveClient={handleRemoveClient}
        onAddMediaType={handleAddMediaType}
        onRemoveMediaType={handleRemoveMediaType}
        readOnly={readOnly || !isViewingOwnTimesheet}
        weekHours={weekHours}
        userRole={userRole}
        availableClients={availableClients}
        availableMediaTypes={availableMediaTypes}
        selectedClients={selectedClients}
        selectedMediaTypes={selectedMediaTypes}
        onSelectClient={handleSelectClient}
        onSelectMediaType={handleSelectMediaType}
        isViewingOwnTimesheet={isViewingOwnTimesheet}
      />
    </div>
  );
};

export default TimeSheet;
