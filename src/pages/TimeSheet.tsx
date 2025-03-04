import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { parse, format, isAfter, isBefore, addWeeks, startOfWeek, isEqual, isSameDay } from 'date-fns';
import { TimeSheetStatus, TimeSheetData, User, Client, TimeEntry } from '@/types/timesheet';
import { TimeSheetHeader } from '@/components/TimeSheet/TimeSheetHeader';
import { TimeSheetControls } from '@/components/TimeSheet/TimeSheetControls';
import { TimeSheetContent } from '@/components/TimeSheet/TimeSheetContent';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TeamMemberSelector } from '@/components/TeamMemberSelector';
import { updateWeekHours, updateWeekStatus, getWeekHours } from '@/integrations/supabase/database';

const DEFAULT_WEEKS = [
  { id: "1", startDate: "2025-01-01", endDate: "2025-01-06", hours: 48 },
  { id: "2", startDate: "2025-01-10", endDate: "2025-01-03", hours: 40 },
  { id: "3", startDate: "2025-01-13", endDate: "2025-01-17", hours: 40 },
  { id: "4", startDate: "2025-01-20", endDate: "2025-01-24", hours: 40 },
  { id: "5", startDate: "2025-01-27", endDate: "2025-01-31", hours: 40 },
];

const DEFAULT_AVAILABLE_MEDIA_TYPES = ['TV', 'Radio', 'Print', 'Digital'];

interface TimeSheetProps {
  userRole: 'admin' | 'user' | 'manager';
  firstWeek: string;
  currentUser: User;
  users: User[];
  clients: Client[];
  readOnly?: boolean;
}

const TimeSheet = ({ userRole, firstWeek, currentUser, users, clients, readOnly = false }: TimeSheetProps) => {
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
  
  const availableClients = clients.filter(client => !client.hidden).map(client => client.name);
  const [availableMediaTypes, setAvailableMediaTypes] = useState<string[]>(DEFAULT_AVAILABLE_MEDIA_TYPES);
  
  const [selectedClients, setSelectedClients] = useState<string[]>(availableClients);
  const [selectedMediaTypes, setSelectedMediaTypes] = useState<string[]>(DEFAULT_AVAILABLE_MEDIA_TYPES);
  
  const [timeEntries, setTimeEntries] = useState<Record<string, TimeSheetData>>({});
  const [submittedWeeks, setSubmittedWeeks] = useState<string[]>([]);
  const [weekStatuses, setWeekStatuses] = useState<Record<string, TimeSheetStatus>>({});
  const { toast } = useToast();

  const getUserWeeks = () => {
    const firstWeekDate = parse(firstWeek, 'yyyy-MM-dd', new Date());
    return DEFAULT_WEEKS.filter(week => {
      const weekStartDate = parse(week.startDate, 'yyyy-MM-dd', new Date());
      return !isBefore(weekStartDate, firstWeekDate);
    }).sort((a, b) => {
      const dateA = parse(a.startDate, 'yyyy-MM-dd', new Date());
      const dateB = parse(b.startDate, 'yyyy-MM-dd', new Date());
      return dateA.getTime() - dateB.getTime();
    });
  };

  const userWeeks = getUserWeeks();

  const findFirstUnsubmittedWeek = () => {
    for (const week of userWeeks) {
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
      const unsubmittedWeek = userWeeks.find(week => 
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

  const handleSubmitForReview = async () => {
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
      
      const unsubmittedWeek = userWeeks.find(week => 
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
    
    try {
      const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
      const week = userWeeks.find(w => format(parse(w.startDate, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') === currentWeekKey);
      
      if (week && currentUser.id) {
        const { data: statusNames } = await import('@/integrations/supabase/database').then(db => db.getWeekStatusNames());
        const underReviewStatus = statusNames?.find(status => status.name === 'under-review');
        
        if (underReviewStatus) {
          await updateWeekStatus(currentUser.id, week.id, underReviewStatus.id);
        }
      }
      
      toast({
        title: "Timesheet Under Review",
        description: `Week of ${format(currentDate, 'MMM d, yyyy')} has been submitted and is now under review`,
      });
    } catch (error) {
      console.error('Error updating week status:', error);
      toast({
        title: "Error",
        description: "Failed to update timesheet status",
        variant: "destructive"
      });
    }
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

  const [viewedUser, setViewedUser] = useState<User>(currentUser);
  const isViewingOwnTimesheet = viewedUser.id === currentUser.id;

  useEffect(() => {
    const loadUserData = async () => {
      if (viewedUser.id) {
        try {
          const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
          const week = userWeeks.find(w => format(parse(w.startDate, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') === currentWeekKey);
          
          if (week) {
            const { data } = await getWeekHours(viewedUser.id, week.id);
            
            if (data) {
              const entries: Record<string, TimeSheetData> = {};
              entries[currentWeekKey] = {};
              
              data.forEach(entry => {
                if (!entries[currentWeekKey][entry.client.name]) {
                  entries[currentWeekKey][entry.client.name] = {};
                }
                
                entries[currentWeekKey][entry.client.name][entry.media_type.name] = {
                  hours: entry.hours,
                  status: getCurrentWeekStatus()
                };
              });
              
              setTimeEntries(entries);
            }
          }
        } catch (error) {
          console.error('Error loading timesheet data:', error);
        }
      }
    };
    
    loadUserData();
  }, [viewedUser, currentDate]);

  const handleTimeUpdate = async (client: string, mediaType: string, hours: number) => {
    if (readOnly || !isViewingOwnTimesheet) return;
    
    const currentTotal = getTotalHoursForWeek();
    const existingHours = timeEntries[format(currentDate, 'yyyy-MM-dd')]?.[client]?.[mediaType]?.hours || 0;
    const newTotalHours = currentTotal - existingHours + hours;
    
    if (newTotalHours > weekHours) {
      toast({
        title: "Cannot Add Hours",
        description: `Total hours cannot exceed ${weekHours} for this week`,
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (viewedUser.id) {
        const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
        const week = userWeeks.find(w => format(parse(w.startDate, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd') === currentWeekKey);
        
        if (week) {
          const { data: clientsData } = await import('@/integrations/supabase/database').then(db => db.getClients());
          const { data: mediaTypesData } = await import('@/integrations/supabase/database').then(db => db.getMediaTypes());
          
          const clientObj = clientsData?.find(c => c.name === client);
          const mediaTypeObj = mediaTypesData?.find(m => m.name === mediaType);
          
          if (clientObj && mediaTypeObj) {
            await updateWeekHours(viewedUser.id, week.id, clientObj.id, mediaTypeObj.id, hours);
          }
        }
      }
      
      const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
      
      setTimeEntries(prev => {
        const newEntries = { ...prev };
        
        if (!newEntries[currentWeekKey]) {
          newEntries[currentWeekKey] = {};
        }
        
        if (!newEntries[currentWeekKey][client]) {
          newEntries[currentWeekKey][client] = {};
        }
        
        newEntries[currentWeekKey][client][mediaType] = { 
          hours, 
          status: getCurrentWeekStatus() 
        };
        
        return newEntries;
      });
    } catch (error) {
      console.error('Error updating hours:', error);
      toast({
        title: "Error",
        description: "Failed to update hours",
        variant: "destructive"
      });
    }
  };

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
          const selectedWeek = userWeeks.find(week => 
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
        firstWeek={viewedUser.firstWeek || firstWeek}
      />

      <TimeSheetContent
        showSettings={showSettings}
        clients={availableClients}
        mediaTypes={availableMediaTypes}
        timeEntries={timeEntries[format(currentDate, 'yyyy-MM-dd')] || {}}
        status={getCurrentWeekStatus()}
        onTimeUpdate={handleTimeUpdate}
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
