import React, { useState } from 'react';
import { TimeSheetHeader } from '@/components/TimeSheet/TimeSheetHeader';
import { TimeSheetControls } from '@/components/TimeSheet/TimeSheetControls';
import { TimeSheetContent } from '@/components/TimeSheet/TimeSheetContent';
import { TimeSheetStatus } from '@/components/TimeSheet/TimeSheetStatus';
import { findFirstUnsubmittedWeek, getCurrentWeekStatus } from '@/components/TimeSheet/TimeSheetState';
import { TimeSheetStatus as Status } from '@/types/timesheet';
import { format, parse } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

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
  const [timeEntries, setTimeEntries] = useState<Record<string, Record<string, { hours: number; status: Status }>>>({});
  const [submittedWeeks, setSubmittedWeeks] = useState<string[]>([]);
  const [weekStatuses, setWeekStatuses] = useState<Record<string, Status>>({});
  const { toast } = useToast();

  const handleReturnToFirstUnsubmittedWeek = () => {
    const firstUnsubmittedWeek = findFirstUnsubmittedWeek({
      firstWeek,
      submittedWeeks,
      currentDate
    });
    if (firstUnsubmittedWeek) {
      setCurrentDate(firstUnsubmittedWeek);
    }
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
    const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
    setSubmittedWeeks(prev => [...prev, currentWeekKey]);
    setWeekStatuses(prev => ({
      ...prev,
      [currentWeekKey]: 'under-review'
    }));
  };

  const handleApprove = () => {
    const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
    setWeekStatuses(prev => ({
      ...prev,
      [currentWeekKey]: 'accepted'
    }));
  };

  const handleReject = () => {
    const currentWeekKey = format(currentDate, 'yyyy-MM-dd');
    setWeekStatuses(prev => ({
      ...prev,
      [currentWeekKey]: 'needs-revision'
    }));
    setSubmittedWeeks(prev => prev.filter(week => week !== currentWeekKey));
  };

  return (
    <div className="space-y-6">
      <TimeSheetHeader
        userRole={userRole}
        remainingHours={40 - getTotalHoursForWeek()}
        status={getCurrentWeekStatus(currentDate, weekStatuses)}
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

      <TimeSheetStatus
        firstUnsubmittedWeek={findFirstUnsubmittedWeek({
          firstWeek,
          submittedWeeks,
          currentDate
        })}
        currentDate={currentDate}
      />

      <TimeSheetControls
        currentDate={currentDate}
        onWeekChange={setCurrentDate}
        status={getCurrentWeekStatus(currentDate, weekStatuses)}
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
        status={getCurrentWeekStatus(currentDate, weekStatuses)}
        onTimeUpdate={(client, mediaType, hours) => {
          const weekKey = format(currentDate, 'yyyy-MM-dd');
          setTimeEntries(prev => ({
            ...prev,
            [weekKey]: {
              ...prev[weekKey],
              [client]: {
                ...prev[weekKey]?.[client],
                [mediaType]: { hours, status: getCurrentWeekStatus(currentDate, weekStatuses) }
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