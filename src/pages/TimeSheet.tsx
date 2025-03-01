
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { parse, format, isAfter, isBefore, addWeeks, startOfWeek, isEqual, isSameDay } from 'date-fns';
import { TimeSheetStatus, TimeSheetData } from '@/types/timesheet';
import { TimeSheetHeader } from '@/components/TimeSheet/TimeSheetHeader';
import { TimeSheetControls } from '@/components/TimeSheet/TimeSheetControls';
import { TimeSheetContent } from '@/components/TimeSheet/TimeSheetContent';
import { Alert, AlertDescription } from "@/components/ui/alert";

const DEFAULT_WEEKS = [
  { id: "1", startDate: "2025-01-01", endDate: "2025-01-06", hours: 48 },
  { id: "2", startDate: "2025-01-10", endDate: "2025-01-03", hours: 40 },
  { id: "3", startDate: "2025-01-13", endDate: "2025-01-17", hours: 40 },
  { id: "4", startDate: "2025-01-20", endDate: "2025-01-24", hours: 40 },
  { id: "5", startDate: "2025-01-27", endDate: "2025-01-31", hours: 40 },
];

interface TimeSheetProps {
  userRole: 'admin' | 'user' | 'manager';
  firstWeek: string;
  readOnly?: boolean;
}

const TimeSheet = ({ userRole, firstWeek, readOnly = false }: TimeSheetProps) => {
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
  const [clients, setClients] = useState<string[]>([
    'Administrative',
    'Education/Training',
    'General Research',
    'Network Requests',
    'New Business',
    'Sick Leave',
    'VACATION'
  ]);
  const [mediaTypes, setMediaTypes] = useState<string[]>(['TV', 'Radio', 'Print', 'Digital']);
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
    
    // Only display the success toast if all checks pass
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

  return (
    <div className="space-y-6">
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
        firstWeek={firstWeek}
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
        onSubmitForReview={handleSubmitForReview}
        onApprove={handleApprove}
        onReject={handleReject}
        readOnly={readOnly}
      />

      <TimeSheetContent
        showSettings={showSettings}
        clients={clients}
        mediaTypes={mediaTypes}
        timeEntries={timeEntries[format(currentDate, 'yyyy-MM-dd')] || {}}
        status={getCurrentWeekStatus()}
        onTimeUpdate={(client, mediaType, hours) => {
          if (readOnly) return;
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
        onAddClient={(client: string) => {
          if (readOnly) return;
          if (!clients.includes(client)) {
            setClients(prev => [...prev, client]);
          }
        }}
        onRemoveClient={(client: string) => {
          if (readOnly) return;
          setClients(prev => prev.filter(c => c !== client));
        }}
        onAddMediaType={(type: string) => {
          if (readOnly) return;
          if (!mediaTypes.includes(type)) {
            setMediaTypes(prev => [...prev, type]);
          }
        }}
        onRemoveMediaType={(type: string) => {
          if (readOnly) return;
          setMediaTypes(prev => prev.filter(t => t !== type));
        }}
        readOnly={readOnly}
        weekHours={weekHours}
      />
    </div>
  );
};

export default TimeSheet;
