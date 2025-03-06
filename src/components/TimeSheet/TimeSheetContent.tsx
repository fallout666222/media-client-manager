
import React, { useMemo } from 'react';
import { TimeSheetGrid } from './TimeSheetGrid';
import { Settings } from './Settings';
import { TimeEntry, TimeSheetStatus, Client } from '@/types/timesheet';

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
  onSaveVisibleClients?: (clients: string[]) => void;
  onSaveVisibleMediaTypes?: (types: string[]) => void;
  readOnly?: boolean;
  weekHours?: number;
  weekPercentage?: number;
  userRole: 'admin' | 'user' | 'manager';
  availableClients: string[];
  availableMediaTypes: string[];
  selectedClients: string[];
  selectedMediaTypes: string[];
  onSelectClient: (client: string) => void;
  onSelectMediaType: (type: string) => void;
  isViewingOwnTimesheet: boolean;
  clientObjects?: Client[]; // Keep this prop
  adminOverride?: boolean; // Add admin override prop
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
  onSaveVisibleClients,
  onSaveVisibleMediaTypes,
  readOnly = false,
  weekHours = 40,
  weekPercentage = 100,
  userRole,
  availableClients,
  availableMediaTypes,
  selectedClients,
  selectedMediaTypes,
  onSelectClient,
  onSelectMediaType,
  isViewingOwnTimesheet,
  clientObjects = [],
  adminOverride = false
}: TimeSheetContentProps) => {
  // Get all clients and media types that have entries with hours > 0
  const clientsWithEntries = useMemo(() => {
    const result = new Set<string>();
    
    Object.entries(timeEntries).forEach(([client, mediaEntries]) => {
      Object.values(mediaEntries).forEach(entry => {
        if (entry.hours && entry.hours > 0) {
          result.add(client);
        }
      });
    });
    
    return Array.from(result);
  }, [timeEntries]);
  
  const mediaTypesWithEntries = useMemo(() => {
    const result = new Set<string>();
    
    Object.entries(timeEntries).forEach(([_, mediaEntries]) => {
      Object.entries(mediaEntries).forEach(([mediaType, entry]) => {
        if (entry.hours && entry.hours > 0) {
          result.add(mediaType);
        }
      });
    });
    
    return Array.from(result);
  }, [timeEntries]);
  
  // Combine selected clients/media types with those that have entries
  const effectiveClients = useMemo(() => {
    return [...new Set([...selectedClients, ...clientsWithEntries])];
  }, [selectedClients, clientsWithEntries]);
  
  const effectiveMediaTypes = useMemo(() => {
    return [...new Set([...selectedMediaTypes, ...mediaTypesWithEntries])];
  }, [selectedMediaTypes, mediaTypesWithEntries]);

  if (showSettings) {
    return (
      <Settings
        clients={clients}
        mediaTypes={mediaTypes}
        onAddClient={onAddClient}
        onRemoveClient={(client) => {
          onRemoveClient(client);
          if (onSaveVisibleClients) {
            const newClients = selectedClients.filter(c => c !== client);
            onSaveVisibleClients(newClients);
          }
        }}
        onAddMediaType={onAddMediaType}
        onRemoveMediaType={(type) => {
          onRemoveMediaType(type);
          if (onSaveVisibleMediaTypes) {
            const newTypes = selectedMediaTypes.filter(t => t !== type);
            onSaveVisibleMediaTypes(newTypes);
          }
        }}
        userRole={userRole}
        availableClients={availableClients}
        availableMediaTypes={availableMediaTypes}
        selectedClients={selectedClients}
        selectedMediaTypes={selectedMediaTypes}
        onSelectClient={(client) => {
          onSelectClient(client);
          if (onSaveVisibleClients) {
            onSaveVisibleClients([...selectedClients, client]);
          }
        }}
        onSelectMediaType={(type) => {
          onSelectMediaType(type);
          if (onSaveVisibleMediaTypes) {
            onSaveVisibleMediaTypes([...selectedMediaTypes, type]);
          }
        }}
        visibleClients={clientObjects}
      />
    );
  }

  return (
    <TimeSheetGrid
      clients={effectiveClients}
      mediaTypes={effectiveMediaTypes}
      timeEntries={timeEntries}
      onTimeUpdate={onTimeUpdate}
      status={status}
      weekHours={weekHours}
      weekPercentage={weekPercentage}
      readOnly={readOnly || !isViewingOwnTimesheet || (!adminOverride && (status === 'under-review' || status === 'accepted'))}
    />
  );
};
