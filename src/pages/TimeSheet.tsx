import React, { useState } from 'react';
import { TimeSheetGrid } from '@/components/TimeSheet/TimeSheetGrid';
import { Settings } from '@/components/TimeSheet/Settings';
import { WeekPicker } from '@/components/TimeSheet/WeekPicker';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileDown, Settings2 } from 'lucide-react';
import { format } from 'date-fns';

type TimeEntry = {
  hours: number;
};

type TimeSheetStatus = 'unconfirmed' | 'under-review' | 'accepted' | 'needs-revision';

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
  const [timeEntries, setTimeEntries] = useState<Record<string, Record<string, TimeEntry>>>({});
  const [status, setStatus] = useState<TimeSheetStatus>('unconfirmed');
  const { toast } = useToast();

  const handleTimeUpdate = (client: string, mediaType: string, hours: number) => {
    if (status === 'under-review' || status === 'accepted') {
      toast({
        title: "Cannot modify timesheet",
        description: "This timesheet is currently under review or has been accepted",
        variant: "destructive",
      });
      return;
    }

    setTimeEntries(prev => ({
      ...prev,
      [client]: {
        ...(prev[client] || {}),
        [mediaType]: { hours }
      }
    }));
  };

  const calculateRemainingHours = () => {
    const totalHours = Object.values(timeEntries).reduce((clientSum, client) => {
      return clientSum + Object.values(client).reduce((mediaSum, media) => {
        return mediaSum + media.hours;
      }, 0);
    }, 0);
    
    // Assuming 40 hours work week
    return 40 - totalHours;
  };

  const handleSubmitForReview = () => {
    setStatus('under-review');
    toast({
      title: "Timesheet Submitted",
      description: "Your timesheet has been submitted for review",
    });
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

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Timesheet</h1>
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
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Status: <span className="font-medium capitalize">{status.replace('-', ' ')}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Remaining Hours: <span className="font-medium">{calculateRemainingHours()}</span>
                </p>
              </div>
              
              <Button
                onClick={handleSubmitForReview}
                disabled={status === 'under-review' || status === 'accepted'}
              >
                Submit for Review
              </Button>
            </div>

            <TimeSheetGrid
              clients={clients}
              mediaTypes={mediaTypes}
              timeEntries={timeEntries}
              onTimeUpdate={handleTimeUpdate}
              isReadOnly={status === 'under-review' || status === 'accepted'}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default TimeSheet;