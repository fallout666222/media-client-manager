import React, { useState } from 'react';
import { TimeSheetControls } from './TimeSheetControls';
import { TimeSheetContent } from './TimeSheetContent';
import { TimeSheetStatus } from '@/types/timesheet';
import { useToast } from '@/hooks/use-toast';

interface TimeSheetManagerProps {
  userRole: string;
  firstWeek: string;
  currentDate: Date;
  onWeekChange: (date: Date) => void;
}

export const TimeSheetManager = ({
  userRole,
  firstWeek,
  currentDate,
  onWeekChange
}: TimeSheetManagerProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const [status, setStatus] = useState<TimeSheetStatus>('unconfirmed');
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

  const handleSubmitForReview = () => {
    setStatus('under-review');
    toast({
      title: "Timesheet Submitted",
      description: "Your timesheet has been submitted for review",
    });
  };

  const handleApprove = () => {
    setStatus('accepted');
    toast({
      title: "Timesheet Approved",
      description: "The timesheet has been approved",
    });
  };

  const handleReject = () => {
    setStatus('needs-revision');
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