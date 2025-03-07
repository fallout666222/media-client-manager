import React, { useMemo, useEffect } from 'react';
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
  clientObjects?: Client[];
  adminOverride?: boolean;
  onReorderClients?: (clients: string[]) => void;
  onReorderMediaTypes?: (types: string[]) => void;
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
  adminOverride = false,
  onReorderClients,
  onReorderMediaTypes
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
    // Get unique clients
    const uniqueClients = [...new Set([...selectedClients, ...clientsWithEntries])];
    
    // Keep the order of selectedClients (user's preferred order)
    const orderedClients = [...selectedClients];
    
    // Add any clients with entries that aren't already in the ordered list
    clientsWithEntries.forEach(client => {
      if (!orderedClients.includes(client)) {
        orderedClients.push(client);
      }
    });
    
    // Filter to only include unique clients that are in our combined set
    return orderedClients.filter(client => uniqueClients.includes(client));
  }, [selectedClients, clientsWithEntries]);
  
  const effectiveMediaTypes = useMemo(() => {
    // Get unique media types
    const uniqueMediaTypes = [...new Set([...selectedMediaTypes, ...mediaTypesWithEntries])];
    
    // Keep the order of selectedMediaTypes (user's preferred order)
    const orderedMediaTypes = [...selectedMediaTypes];
    
    // Add any media types with entries that aren't already in the ordered list
    mediaTypesWithEntries.forEach(type => {
      if (!orderedMediaTypes.includes(type)) {
        orderedMediaTypes.push(type);
      }
    });
    
    // Filter to only include unique media types that are in our combined set
    return orderedMediaTypes.filter(type => uniqueMediaTypes.includes(type));
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
        onReorderClients={(newOrder) => {
          if (onReorderClients) {
            onReorderClients(newOrder);
          }
          if (onSaveVisibleClients) {
            onSaveVisibleClients(newOrder);
          }
        }}
        onReorderMediaTypes={(newOrder) => {
          if (onReorderMediaTypes) {
            onReorderMediaTypes(newOrder);
          }
          if (onSaveVisibleMediaTypes) {
            onSaveVisibleMediaTypes(newOrder);
          }
        }}
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
