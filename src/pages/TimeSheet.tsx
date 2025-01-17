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
  const [status, setStatus] = useState<TimeSheetStatus>('unconfirmed');
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

  const handleSubmitForReview = () => {
    const firstUnsubmittedWeek = findFirstUnsubmittedWeek(currentDate);
    const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
    
    if (firstUnsubmittedWeek && !isEqual(firstUnsubmittedWeek, currentDate)) {
      const unsubmittedWeekKey = format(firstUnsubmittedWeek, 'yyyy-MM-dd');
      toast({
        title: "Cannot Submit This Week",
        description: `Please submit the week of ${format(firstUnsubmittedWeek, 'MMM d, yyyy')} first`,
        variant: "destructive"
      });
      setCurrentDate(firstUnsubmittedWeek);
      return;
    }

    setSubmittedWeeks(prev => [...prev, currentWeekKey]);
    setStatus('under-review');
    toast({
      title: "Timesheet Submitted",
      description: "Your timesheet has been submitted for review",
    });
  };

  const calculateWeekTotal = (weekKey: string, currentClient: string, currentMediaType: string, newHours: number) => {
    let total = 0;
    const weekEntries = timeEntries[weekKey] || {};
    
    Object.entries(weekEntries).forEach(([client, mediaEntries]) => {
      Object.entries(mediaEntries).forEach(([mediaType, entry]) => {
        if (client === currentClient && mediaType === currentMediaType) {
          return;
        }
        total += entry.hours;
      });
    });
    
    return total + newHours;
  };

  return (
    <div className="space-y-6">
      <TimeSheetHeader
        userRole={userRole}
        remainingHours={40 - calculateWeekTotal(format(currentDate, 'yyyy-MM-dd'), '', '', 0)}
        status={status}
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
        status={status}
        isManager={userRole === 'manager' || userRole === 'admin'}
        onSubmitForReview={handleSubmitForReview}
        onApprove={() => {
          setStatus('accepted');
          toast({
            title: "Timesheet Approved",
            description: "The timesheet has been approved",
          });
        }}
        onReject={() => {
          const weekKey = format(currentDate, 'yyyy-MM-dd');
          setSubmittedWeeks(prev => prev.filter(w => w !== weekKey));
          setStatus('needs-revision');
          toast({
            title: "Timesheet Rejected",
            description: "The timesheet needs revision",
          });
        }}
      />

      <TimeSheetContent
        showSettings={showSettings}
        clients={clients}
        mediaTypes={mediaTypes}
        timeEntries={timeEntries[format(currentDate, 'yyyy-MM-dd')] || {}}
        status={status}
        onTimeUpdate={(client, mediaType, hours) => {
          const weekKey = format(currentDate, 'yyyy-MM-dd');
          setTimeEntries(prev => ({
            ...prev,
            [weekKey]: {
              ...prev[weekKey],
              [client]: {
                ...prev[weekKey]?.[client],
                [mediaType]: { hours, status }
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
