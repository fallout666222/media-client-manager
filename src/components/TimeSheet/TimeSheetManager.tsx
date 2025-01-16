import React, { useState, useEffect } from 'react';
import { TimeSheetControls } from './TimeSheetControls';
import { TimeSheetContent } from './TimeSheetContent';
import { TimeSheetStatus } from '@/types/timesheet';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface TimeSheetManagerProps {
  userRole: string;
  firstWeek: string;
  currentDate: Date;
  onWeekChange: (date: Date) => void;
}

interface WeekStatus {
  [key: string]: TimeSheetStatus;
}

export const TimeSheetManager = ({
  userRole,
  firstWeek,
  currentDate,
  onWeekChange
}: TimeSheetManagerProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const [weekStatuses, setWeekStatuses] = useState<WeekStatus>({});
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
  const [timeEntries, setTimeEntries] = useState({});
  const { toast } = useToast();

  const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
  const status = weekStatuses[currentWeekKey] || 'unconfirmed';

  useEffect(() => {
    // Initialize status for first week
    if (firstWeek && !weekStatuses[firstWeek]) {
      setWeekStatuses(prev => ({
        ...prev,
        [firstWeek]: 'unconfirmed'
      }));
    }
  }, [firstWeek]);

  const handleSubmitForReview = () => {
    setWeekStatuses(prev => ({
      ...prev,
      [currentWeekKey]: 'under-review'
    }));
    toast({
      title: "Timesheet Submitted",
      description: "Your timesheet has been submitted for review",
    });
  };

  const handleApprove = () => {
    setWeekStatuses(prev => ({
      ...prev,
      [currentWeekKey]: 'accepted'
    }));
    toast({
      title: "Timesheet Approved",
      description: "The timesheet has been approved",
    });
  };

  const handleReject = () => {
    setWeekStatuses(prev => ({
      ...prev,
      [currentWeekKey]: 'needs-revision'
    }));
    toast({
      title: "Timesheet Rejected",
      description: "The timesheet has been sent back for revision",
    });
  };

  const handleTimeUpdate = (client: string, mediaType: string, hours: number) => {
    setTimeEntries(prev => ({
      ...prev,
      [client]: {
        ...(prev[client] || {}),
        [mediaType]: { hours, status }
      }
    }));

    // If this is the first entry for a week, initialize its status
    if (!weekStatuses[currentWeekKey]) {
      setWeekStatuses(prev => ({
        ...prev,
        [currentWeekKey]: 'unconfirmed'
      }));
    }
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

  return (
    <div className="space-y-6">
      <TimeSheetControls
        currentDate={currentDate}
        onWeekChange={onWeekChange}
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
        timeEntries={timeEntries}
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