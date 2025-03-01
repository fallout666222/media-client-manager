
import React from 'react';
import { TimeSheetGrid } from './TimeSheetGrid';
import { Settings } from './Settings';
import { TimeEntry, TimeSheetStatus, User } from '@/types/timesheet';

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
  readOnly?: boolean;
  weekHours?: number;
  userRole: 'admin' | 'user' | 'manager';
  availableClients: string[];
  availableMediaTypes: string[];
  selectedClients: string[];
  selectedMediaTypes: string[];
  onSelectClient: (client: string) => void;
  onSelectMediaType: (type: string) => void;
  isViewingOwnTimesheet: boolean;
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
  readOnly = false,
  weekHours = 40,
  userRole,
  availableClients,
  availableMediaTypes,
  selectedClients,
  selectedMediaTypes,
  onSelectClient,
  onSelectMediaType,
  isViewingOwnTimesheet,
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
        userRole={userRole}
        availableClients={availableClients}
        availableMediaTypes={availableMediaTypes}
        selectedClients={selectedClients}
        selectedMediaTypes={selectedMediaTypes}
        onSelectClient={onSelectClient}
        onSelectMediaType={onSelectMediaType}
      />
    );
  }

  return (
    <TimeSheetGrid
      clients={selectedClients}
      mediaTypes={selectedMediaTypes}
      timeEntries={timeEntries}
      onTimeUpdate={onTimeUpdate}
      status={status}
      weekHours={weekHours}
      readOnly={readOnly || !isViewingOwnTimesheet || status === 'under-review' || status === 'accepted'}
    />
  );
};
