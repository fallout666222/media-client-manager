import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { parse, format, isAfter, isBefore, addWeeks, startOfWeek, isEqual } from 'date-fns';
import { TimeSheetStatus, TimeSheetData } from '@/types/timesheet';
import { TimeSheetHeader } from '@/components/TimeSheet/TimeSheetHeader';
import { TimeSheetControls } from '@/components/TimeSheet/TimeSheetControls';
import { TimeSheetContent } from '@/components/TimeSheet/TimeSheetContent';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TimeSheetProps {
  userRole: 'admin' | 'user' | 'manager';
  firstWeek: string;
}

const TimeSheet = ({ userRole, firstWeek }: TimeSheetProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(
    parse(firstWeek, 'yyyy-MM-dd', new Date())
  );
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

  const findFirstUnsubmittedWeek = (currentWeekDate: Date): Date | null => {
    let weekToCheck = parse(firstWeek, 'yyyy-MM-dd', new Date());
    const currentWeekStart = startOfWeek(currentWeekDate, { weekStartsOn: 1 });

    while (isBefore(weekToCheck, currentWeekStart) || isEqual(weekToCheck, currentWeekStart)) {
      const weekKey = format(weekToCheck, 'yyyy-MM-dd');
      if (!submittedWeeks.includes(weekKey)) {
        return weekToCheck;
      }
      weekToCheck = addWeeks(weekToCheck, 1);
    }
    return null;
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
    const totalHours = getTotalHoursForWeek();
    const firstUnsubmittedWeek = findFirstUnsubmittedWeek(currentDate);
    const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
    
    if (totalHours === 0) {
      toast({
        title: "Cannot Submit Empty Timesheet",
        description: "Please fill in your hours before submitting.",
        variant: "destructive"
      });
      return;
    }

    if (totalHours < 40) {
      toast({
        title: "Insufficient Hours",
        description: `You must fill in all 40 hours for the week. Current total: ${totalHours} hours`,
        variant: "destructive"
      });
      return;
    }
    
    if (firstUnsubmittedWeek && !isEqual(firstUnsubmittedWeek, currentDate)) {
      const unsubmittedWeekKey = format(firstUnsubmittedWeek, 'MMM d, yyyy');
      toast({
        title: "Cannot Submit This Week",
        description: `You must submit timesheets in chronological order. Please submit the week of ${unsubmittedWeekKey} first.`,
        variant: "destructive"
      });
      setCurrentDate(firstUnsubmittedWeek);
      return;
    }

    if (totalHours === 40 && (!firstUnsubmittedWeek || isEqual(firstUnsubmittedWeek, currentDate))) {
      setSubmittedWeeks(prev => [...prev, currentWeekKey]);
      setWeekStatuses(prev => ({
        ...prev,
        [currentWeekKey]: 'under-review'
      }));
      toast({
        title: "Timesheet Submitted",
        description: `Week of ${format(currentDate, 'MMM d, yyyy')} has been submitted for review`,
      });
    }
  };

  const handleApprove = () => {
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

  return (
    <div className="space-y-6">
      <TimeSheetHeader
        userRole={userRole}
        remainingHours={40 - getTotalHoursForWeek()}
        status={getCurrentWeekStatus()}
        onReturnToFirstWeek={() => setCurrentDate(parse(firstWeek, 'yyyy-MM-dd', new Date()))}
        onToggleSettings={() => setShowSettings(!showSettings)}
        onExportToExcel={() => {
          toast({
            title: "Export Started",
            description: "Your timesheet is being exported to Excel",
          });
        }}
        firstWeek={firstWeek}
      />

      {findFirstUnsubmittedWeek(currentDate) && 
       !isEqual(findFirstUnsubmittedWeek(currentDate), currentDate) && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            You have unsubmitted timesheets from previous weeks. Please submit them in chronological order.
          </AlertDescription>
        </Alert>
      )}

      <TimeSheetControls
        currentDate={currentDate}
        onWeekChange={setCurrentDate}
        status={getCurrentWeekStatus()}
        isManager={userRole === 'manager' || userRole === 'admin'}
        onSubmitForReview={handleSubmitForReview}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <TimeSheetContent
        showSettings={showSettings}
        clients={clients}
        mediaTypes={mediaTypes}
        timeEntries={timeEntries[format(currentDate, 'yyyy-MM-dd')] || {}}
        status={getCurrentWeekStatus()}
        onTimeUpdate={(client, mediaType, hours) => {
          const weekKey = format(currentDate, 'yyyy-MM-dd');
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
          if (!clients.includes(client)) {
            setClients(prev => [...prev, client]);
          }
        }}
        onRemoveClient={(client: string) => {
          setClients(prev => prev.filter(c => c !== client));
        }}
        onAddMediaType={(type: string) => {
          if (!mediaTypes.includes(type)) {
            setMediaTypes(prev => [...prev, type]);
          }
        }}
        onRemoveMediaType={(type: string) => {
          setMediaTypes(prev => prev.filter(t => t !== type));
        }}
      />
    </div>
  );
};

export default TimeSheet;
