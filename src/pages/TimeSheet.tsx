import React, { useState } from 'react';
import { TimeSheetGrid } from '@/components/TimeSheet/TimeSheetGrid';
import { Settings } from '@/components/TimeSheet/Settings';
import { WeekPicker } from '@/components/TimeSheet/WeekPicker';
import { ApprovalActions } from '@/components/TimeSheet/ApprovalActions';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileDown, Settings2 } from 'lucide-react';
import { format } from 'date-fns';
import { TimeEntry, TimeSheetStatus, TimeSheetData } from '@/types/timesheet';

const TimeSheet = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
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

  // TODO: This should come from authentication context
  const isManager = true;

  const getCurrentWeekKey = () => {
    return format(currentDate, 'yyyy-MM-dd');
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
    
    // Calculate total for all entries except the current one being updated
    Object.entries(weekEntries).forEach(([client, mediaEntries]) => {
      Object.entries(mediaEntries).forEach(([mediaType, entry]) => {
        if (client === currentClient && mediaType === currentMediaType) {
          return; // Skip the current entry being updated
        }
        total += entry.hours;
      });
    });
    
    // Add the new hours
    total += newHours;
    
    return total;
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
    // Excel export functionality to be implemented
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

  const currentWeekEntries = timeEntries[getCurrentWeekKey()] || {};

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Timesheet</h1>
          <p className="text-sm text-muted-foreground">
            Status: <span className="font-medium capitalize">{status.replace('-', ' ')}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Remaining Hours This Week: <span className="font-medium">{calculateRemainingHours()}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button
            variant="outline"
            onClick={handleExportToExcel}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
        </div>
      </div>

      {showSettings ? (
        <Settings
          clients={clients}
          mediaTypes={mediaTypes}
          onAddClient={handleAddClient}
          onRemoveClient={handleRemoveClient}
          onAddMediaType={handleAddMediaType}
          onRemoveMediaType={handleRemoveMediaType}
        />
      ) : (
        <>
          <div className="space-y-4">
            <WeekPicker
              currentDate={currentDate}
              onWeekChange={setCurrentDate}
            />
            
            <div className="flex items-center justify-between">
              <ApprovalActions
                status={status}
                isManager={isManager}
                onSubmitForReview={handleSubmitForReview}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            </div>

            <TimeSheetGrid
              clients={clients}
              mediaTypes={mediaTypes}
              timeEntries={currentWeekEntries}
              onTimeUpdate={handleTimeUpdate}
              status={status}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default TimeSheet;