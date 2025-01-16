import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { parse, format, isAfter, isBefore, addWeeks, startOfWeek } from 'date-fns';
import { TimeSheetStatus, TimeSheetData } from '@/types/timesheet';
import { TimeSheetHeader } from '@/components/TimeSheet/TimeSheetHeader';
import { TimeSheetControls } from '@/components/TimeSheet/TimeSheetControls';
import { TimeSheetContent } from '@/components/TimeSheet/TimeSheetContent';

interface TimeSheetProps {
  userRole: 'admin' | 'user' | 'manager';
  firstWeek?: string;
}

const TimeSheet = ({ userRole, firstWeek }: TimeSheetProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const [currentDate, setCurrentDate] = useState(
    firstWeek ? parse(firstWeek, 'yyyy-MM-dd', new Date()) : new Date()
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

  useEffect(() => {
    if (firstWeek) {
      setCurrentDate(parse(firstWeek, 'yyyy-MM-dd', new Date()));
    }
  }, [firstWeek]);

  const getCurrentWeekKey = () => format(currentDate, 'yyyy-MM-dd');

  const validateWeekSelection = (date: Date): boolean => {
    if (!firstWeek) return false;
    
    const firstWeekDate = parse(firstWeek, 'yyyy-MM-dd', new Date());
    const today = new Date();
    const selectedWeekStart = startOfWeek(date, { weekStartsOn: 1 });
    const previousWeek = addWeeks(selectedWeekStart, -1);
    const previousWeekKey = format(previousWeek, 'yyyy-MM-dd');

    // Cannot select weeks before first week
    if (isBefore(selectedWeekStart, firstWeekDate)) {
      toast({
        title: "Invalid Week Selection",
        description: "Cannot select weeks before your first working week",
        variant: "destructive"
      });
      return false;
    }

    // Cannot select future weeks
    if (isAfter(selectedWeekStart, today)) {
      toast({
        title: "Invalid Week Selection",
        description: "Cannot select future weeks",
        variant: "destructive"
      });
      return false;
    }

    // If previous week exists and is not submitted, cannot edit current week
    if (!submittedWeeks.includes(previousWeekKey) && !format(firstWeekDate, 'yyyy-MM-dd').includes(previousWeekKey)) {
      toast({
        title: "Previous Week Not Submitted",
        description: "Please submit the previous week's timesheet first",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleWeekChange = (date: Date) => {
    if (!validateWeekSelection(date)) {
      return;
    }
    setCurrentDate(date);
    const weekKey = format(date, 'yyyy-MM-dd');
    // Set status based on whether the week has been submitted
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

    const weekKey = getCurrentWeekKey();
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

  const handleSubmitForReview = () => {
    const weekKey = getCurrentWeekKey();
    setSubmittedWeeks(prev => [...prev, weekKey]);
    setStatus('under-review');
  };

  const handleApprove = () => {
    setStatus('accepted');
  };

  const handleReject = () => {
    const weekKey = getCurrentWeekKey();
    setSubmittedWeeks(prev => prev.filter(w => w !== weekKey));
    setStatus('needs-revision');
  };

  const handleExportToExcel = () => {
    toast({
      title: "Export Started",
      description: "Your timesheet is being exported to Excel",
    });
  };

  const handleAddClient = (client: string) => {
    if (!clients.includes(client)) {
      setClients(prev => [...prev, client]);
    }
  };

  const handleRemoveClient = (client: string) => {
    setClients(prev => prev.filter(c => c !== client));
  };

  const handleAddMediaType = (type: string) => {
    if (!mediaTypes.includes(type)) {
      setMediaTypes(prev => [...prev, type]);
    }
  };

  const handleRemoveMediaType = (type: string) => {
    setMediaTypes(prev => prev.filter(t => t !== type));
  };

  const handleReturnToFirstUnconfirmed = () => {
    if (firstWeek) {
      const firstWeekDate = parse(firstWeek, 'yyyy-MM-dd', new Date());
      let currentWeek = firstWeekDate;
      let weekKey = format(currentWeek, 'yyyy-MM-dd');
      
      // Find the first unsubmitted week
      while (submittedWeeks.includes(weekKey) && !isAfter(currentWeek, new Date())) {
        currentWeek = addWeeks(currentWeek, 1);
        weekKey = format(currentWeek, 'yyyy-MM-dd');
      }

      setCurrentDate(currentWeek);
      toast({
        title: "Returned to First Unconfirmed Week",
        description: "You've been returned to your first unconfirmed week",
      });
    }
  };

  const currentWeekEntries = timeEntries[getCurrentWeekKey()] || {};

  return (
    <div className="space-y-6">
      <TimeSheetHeader
        userRole={userRole}
        remainingHours={calculateWeekTotal(getCurrentWeekKey(), '', '', 0)}
        status={status}
        onReturnToFirstWeek={handleReturnToFirstUnconfirmed}
        onToggleSettings={() => setShowSettings(!showSettings)}
        onExportToExcel={handleExportToExcel}
        firstWeek={firstWeek}
      />

      <TimeSheetControls
        currentDate={currentDate}
        onWeekChange={handleWeekChange}
        status={status}
        isManager={userRole === 'manager' || userRole === 'admin'}
        onSubmitForReview={handleSubmitForReview}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <TimeSheetContent
        showSettings={showSettings}
        clients={clients}
        mediaTypes={mediaTypes}
        timeEntries={currentWeekEntries}
        status={status}
        onTimeUpdate={handleTimeUpdate}
        onAddClient={handleAddClient}
        onRemoveClient={handleRemoveClient}
        onAddMediaType={handleAddMediaType}
        onRemoveMediaType={handleRemoveMediaType}
      />
    </div>
  );
};

export default TimeSheet;
