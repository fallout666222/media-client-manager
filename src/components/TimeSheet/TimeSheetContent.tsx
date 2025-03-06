import React, { useMemo } from 'react';
import { TimeSheetGrid } from './TimeSheetGrid';
import { Settings } from './Settings';
import { TimeEntry, TimeSheetStatus, Client } from '@/types/timesheet';

// Define the system default clients - keep in sync with ClientTree.tsx
const DEFAULT_SYSTEM_CLIENTS = [
  "Administrative",
  "Education/Training",
  "General Research",
  "Network Requests",
  "New Business",
  "Sick Leave",
  "VACATION"
];

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
    const combinedClients = [...new Set([...selectedClients, ...clientsWithEntries])];
    
    // Sort clients with default system clients at the top
    return combinedClients.sort((a, b) => {
      const aIsDefault = DEFAULT_SYSTEM_CLIENTS.includes(a);
      const bIsDefault = DEFAULT_SYSTEM_CLIENTS.includes(b);
      
      if (aIsDefault && !bIsDefault) return -1;
      if (!aIsDefault && bIsDefault) return 1;
      
      // Sort default clients in the same order as DEFAULT_SYSTEM_CLIENTS
      if (aIsDefault && bIsDefault) {
        return DEFAULT_SYSTEM_CLIENTS.indexOf(a) - DEFAULT_SYSTEM_CLIENTS.indexOf(b);
      }
      
      // Regular alphabetical sorting for non-default clients
      return a.localeCompare(b);
    });
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
          // Prevent removing default system clients
          if (DEFAULT_SYSTEM_CLIENTS.includes(client)) {
            return; // Don't allow removal
          }
          
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
          
          // If the client is a system default client, automatically add "Administrative" media type
          if (DEFAULT_SYSTEM_CLIENTS.includes(client) && !selectedMediaTypes.includes("Administrative")) {
            onSelectMediaType("Administrative");
            if (onSaveVisibleMediaTypes) {
              onSaveVisibleMediaTypes([...selectedMediaTypes, "Administrative"]);
            }
          }
          
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
