import React, { useState } from 'react';
import { WeekPicker } from '@/components/TimeSheet/WeekPicker';
import { TimeSheetGrid } from '@/components/TimeSheet/TimeSheetGrid';
import { Settings } from '@/components/TimeSheet/Settings';
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_CATEGORIES = [
  'Administrative',
  'Education/Training',
  'General Research',
  'Network Requests',
  'New Business',
  'Sick Leave',
  'VACATION'
];

const TimeSheet = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [clients, setClients] = useState([...DEFAULT_CATEGORIES]);
  const [mediaTypes, setMediaTypes] = useState(['TV', 'Radio', 'Print', 'Digital']);
  const [timeEntries, setTimeEntries] = useState<Record<string, Record<string, { hours: number }>>>({});
  const { toast } = useToast();

  const handleTimeUpdate = (client: string, mediaType: string, hours: number) => {
    setTimeEntries(prev => ({
      ...prev,
      [client]: {
        ...(prev[client] || {}),
        [mediaType]: { hours }
      }
    }));
  };

  const handleAddClient = (client: string) => {
    if (!clients.includes(client)) {
      setClients([...clients, client]);
    }
  };

  const handleRemoveClient = (client: string) => {
    if (DEFAULT_CATEGORIES.includes(client)) {
      toast({
        title: "Cannot remove default category",
        description: "This is a system default category and cannot be removed.",
        variant: "destructive",
      });
      return;
    }
    setClients(clients.filter(c => c !== client));
  };

  const handleAddMediaType = (type: string) => {
    if (!mediaTypes.includes(type)) {
      setMediaTypes([...mediaTypes, type]);
    }
  };

  const handleRemoveMediaType = (type: string) => {
    setMediaTypes(mediaTypes.filter(t => t !== type));
  };

  const handleSubmitForReview = () => {
    toast({
      title: "Timesheet Submitted",
      description: "Your timesheet has been sent for review.",
    });
  };

  const totalHours = Object.values(timeEntries).reduce((clientSum, clientEntries) => {
    return clientSum + Object.values(clientEntries).reduce((sum, { hours }) => sum + hours, 0);
  }, 0);

  const expectedHours = 40;
  const remainingHours = Math.max(0, expectedHours - totalHours);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Weekly Timesheet</h1>
        <div className="flex gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <SettingsIcon className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Timesheet Settings</DialogTitle>
              </DialogHeader>
              <Settings
                clients={clients}
                mediaTypes={mediaTypes}
                onAddClient={handleAddClient}
                onRemoveClient={handleRemoveClient}
                onAddMediaType={handleAddMediaType}
                onRemoveMediaType={handleRemoveMediaType}
              />
            </DialogContent>
          </Dialog>
          <Button onClick={handleSubmitForReview}>
            <Send className="h-4 w-4 mr-2" />
            Submit for Review
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <WeekPicker
          currentDate={currentDate}
          onWeekChange={setCurrentDate}
        />
        <div className="text-sm text-muted-foreground">
          {remainingHours > 0 ? (
            <span>Remaining hours this week: {remainingHours}</span>
          ) : (
            <span className="text-green-600">All hours logged for this week</span>
          )}
        </div>
      </div>

      <TimeSheetGrid
        clients={clients}
        mediaTypes={mediaTypes}
        timeEntries={timeEntries}
        onTimeUpdate={handleTimeUpdate}
      />
    </div>
  );
};

export default TimeSheet;