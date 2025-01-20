import React from 'react';
import { TimeSheetGrid } from './TimeSheetGrid';
import { Settings } from './Settings';
import { TimeEntry, TimeSheetStatus } from '@/types/timesheet';

interface TimeSheetContentProps {
  showSettings: boolean;
  clients: string[];
  mediaTypes: string[];
  timeEntries: Record<string, Record<string, TimeEntry>>;
  status: TimeSheetStatus;
  onTimeUpdate: (client: string, mediaType: string, hours: number) => void;
  onAddClient: (client: string) => void;
  onRemoveClient: (client: string) => void;
  onAddMediaType: (type: string) => void;
  onRemoveMediaType: (type: string) => void;
}

export const TimeSheetContent = ({
  showSettings,
  clients,
  mediaTypes,
  timeEntries,
  status,
  onTimeUpdate,
  onAddClient,
  onRemoveClient,
  onAddMediaType,
  onRemoveMediaType,
}: TimeSheetContentProps) => {
  if (showSettings) {
    return (
      <Settings
        clients={clients}
        mediaTypes={mediaTypes}
        onAddClient={onAddClient}
        onRemoveClient={onRemoveClient}
        onAddMediaType={onAddMediaType}
        onRemoveMediaType={onRemoveMediaType}
      />
    );
  }

  return (
    <TimeSheetGrid
      clients={clients}
      mediaTypes={mediaTypes}
      timeEntries={timeEntries}
      onTimeUpdate={onTimeUpdate}
      status={status}
    />
  );
};