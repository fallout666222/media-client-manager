import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { parse, format } from 'date-fns';
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
  const [status, setStatus] = useState<TimeSheetStatus>('unconfirmed');
  const { toast } = useToast();

  useEffect(() => {
    if (firstWeek) {
      setCurrentDate(parse(firstWeek, 'yyyy-MM-dd', new Date()));
    }
  }, [firstWeek]);

  const isManager = userRole === 'manager' || userRole === 'admin';

  const getCurrentWeekKey = () => format(currentDate, 'yyyy-MM-dd');

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

  const calculateRemainingHours = () => {
    const weekKey = getCurrentWeekKey();
    const weekEntries = timeEntries[weekKey] || {};
    
    const totalHours = Object.values(weekEntries).reduce((clientSum, client) => {
      return clientSum + Object.values(client).reduce((mediaSum, media) => {
        return mediaSum + media.hours;
      }, 0);
    }, 0);
    
    return 40 - totalHours;
  };

  const handleSubmitForReview = () => {
    setStatus('under-review');
  };

  const handleApprove = () => {
    setStatus('accepted');
  };

  const handleReject = () => {
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
      setCurrentDate(parse(firstWeek, 'yyyy-MM-dd', new Date()));
      toast({
        title: "Returned to First Week",
        description: "You've been returned to your first working week",
      });
    }
  };

  const currentWeekEntries = timeEntries[getCurrentWeekKey()] || {};

  return (
    <div className="space-y-6">
      <TimeSheetHeader
        userRole={userRole}
        remainingHours={calculateRemainingHours()}
        status={status}
        onReturnToFirstWeek={handleReturnToFirstUnconfirmed}
        onToggleSettings={() => setShowSettings(!showSettings)}
        onExportToExcel={handleExportToExcel}
        firstWeek={firstWeek}
      />

      <TimeSheetControls
        currentDate={currentDate}
        onWeekChange={setCurrentDate}
        status={status}
        isManager={isManager}
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
