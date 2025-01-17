import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { parse, format, isAfter, isBefore, addWeeks, startOfWeek, isEqual } from 'date-fns';
import { TimeSheetStatus, TimeSheetData } from '@/types/timesheet';
import { TimeSheetHeader } from '@/components/TimeSheet/TimeSheetHeader';
import { TimeSheetControls } from '@/components/TimeSheet/TimeSheetControls';
import { TimeSheetContent } from '@/components/TimeSheet/TimeSheetContent';

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

  // Check if all previous weeks are submitted
  const areAllPreviousWeeksSubmitted = (targetDate: Date): boolean => {
    let currentWeek = parse(firstWeek, 'yyyy-MM-dd', new Date());
    const targetWeek = startOfWeek(targetDate, { weekStartsOn: 1 });

    while (isBefore(currentWeek, targetWeek)) {
      const weekKey = format(currentWeek, 'yyyy-MM-dd');
      if (!submittedWeeks.includes(weekKey)) {
        return false;
      }
      currentWeek = addWeeks(currentWeek, 1);
    }
    return true;
  };

  const handleWeekChange = (date: Date) => {
    const firstWeekDate = parse(firstWeek, 'yyyy-MM-dd', new Date());
    
    // Prevent selecting weeks before first week
    if (isBefore(date, firstWeekDate)) {
      toast({
        title: "Invalid Week Selection",
        description: "Cannot select weeks before your first working week",
        variant: "destructive"
      });
      return;
    }

    // Prevent selecting future weeks
    if (isAfter(date, new Date())) {
      toast({
        title: "Invalid Week Selection",
        description: "Cannot select future weeks",
        variant: "destructive"
      });
      return;
    }

    setCurrentDate(date);
    const weekKey = format(date, 'yyyy-MM-dd');
    setStatus(submittedWeeks.includes(weekKey) ? 'under-review' : 'unconfirmed');
  };

  const handleTimeUpdate = (client: string, mediaType: string, hours: number) => {
    if (status === 'under-review' || status === 'accepted') {
      toast({
        title: "Cannot modify timesheet",
        description: "This timesheet is currently under review or has been accepted",
        variant: "destructive",
      });
      return;
    }

    const weekKey = format(currentDate, 'yyyy-MM-dd');
    const currentWeekTotal = calculateWeekTotal(weekKey, client, mediaType, hours);

    if (currentWeekTotal > 40) {
      toast({
        title: "Exceeded weekly limit",
        description: "Total hours for the week cannot exceed 40",
        variant: "destructive",
      });
      return;
    }

    setTimeEntries(prev => ({
      ...prev,
      [weekKey]: {
        ...prev[weekKey],
        [client]: {
          ...(prev[weekKey]?.[client] || {}),
          [mediaType]: { hours, status }
        }
      }
    }));
  };

  const handleSubmitForReview = () => {
    if (!areAllPreviousWeeksSubmitted(currentDate)) {
      toast({
        title: "Cannot submit timesheet",
        description: "Please submit previous weeks' timesheets first",
        variant: "destructive"
      });
      return;
    }

    const weekKey = format(currentDate, 'yyyy-MM-dd');
    setSubmittedWeeks(prev => [...prev, weekKey]);
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
        onReturnToFirstWeek={() => handleWeekChange(parse(firstWeek, 'yyyy-MM-dd', new Date()))}
        onToggleSettings={() => setShowSettings(!showSettings)}
        onExportToExcel={() => {
          toast({
            title: "Export Started",
            description: "Your timesheet is being exported to Excel",
          });
        }}
        firstWeek={firstWeek}
      />

      <TimeSheetControls
        currentDate={currentDate}
        onWeekChange={handleWeekChange}
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
        onTimeUpdate={handleTimeUpdate}
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
