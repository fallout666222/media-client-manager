import React, { useMemo, useEffect } from 'react';
import { TimeSheetGrid } from './TimeSheetGrid';
import { Settings } from './Settings';
import { TimeEntry, TimeSheetStatus, Client } from '@/types/timesheet';
import { DEFAULT_SYSTEM_CLIENTS } from './Settings/constants';

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
  currentUserId?: string;
  isUserHead?: boolean;
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
  onReorderMediaTypes,
  currentUserId,
  isUserHead = false
}: TimeSheetContentProps) => {
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
  
  const visibleClientObjects = useMemo(() => {
    if (userRole === 'admin' || adminOverride) {
      return clientObjects;
    }
    
    return clientObjects.filter(client => 
      !client.hidden || clientsWithEntries.includes(client.name)
    );
  }, [clientObjects, userRole, adminOverride, clientsWithEntries]);
  
  const visibleClientNames = useMemo(() => {
    return visibleClientObjects.map(client => client.name);
  }, [visibleClientObjects]);
  
  const effectiveClients = useMemo(() => {
    const uniqueClients = [...new Set([
      ...selectedClients.filter(client => 
        userRole === 'admin' || 
        adminOverride || 
        visibleClientNames.includes(client)
      ), 
      ...clientsWithEntries
    ])];
    
    const orderedClients = [...selectedClients].filter(client => 
      userRole === 'admin' || 
      adminOverride || 
      visibleClientNames.includes(client)
    );
    
    clientsWithEntries.forEach(client => {
      if (!orderedClients.includes(client) && visibleClientNames.includes(client)) {
        orderedClients.push(client);
      }
    });
    
    return orderedClients.filter(client => uniqueClients.includes(client));
  }, [selectedClients, clientsWithEntries, userRole, adminOverride, visibleClientNames]);
  
  const effectiveMediaTypes = useMemo(() => {
    const uniqueMediaTypes = [...new Set([...selectedMediaTypes, ...mediaTypesWithEntries])];
    
    const orderedMediaTypes = [...selectedMediaTypes];
    
    mediaTypesWithEntries.forEach(type => {
      if (!orderedMediaTypes.includes(type)) {
        orderedMediaTypes.push(type);
      }
    });
    
    return orderedMediaTypes.filter(type => uniqueMediaTypes.includes(type));
  }, [selectedMediaTypes, mediaTypesWithEntries]);

  const handleSystemClientAdded = (systemClientName: string) => {
    if (!selectedMediaTypes.includes("Administrative")) {
      onSelectMediaType("Administrative");
      if (onSaveVisibleMediaTypes) {
        onSaveVisibleMediaTypes([...selectedMediaTypes, "Administrative"]);
      }
    }
  };

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
        availableClients={userRole === 'admin' ? availableClients : visibleClientNames}
        availableMediaTypes={availableMediaTypes}
        selectedClients={selectedClients}
        selectedMediaTypes={selectedMediaTypes}
        onSelectClient={(client) => {
          onSelectClient(client);
          
          if (DEFAULT_SYSTEM_CLIENTS.includes(client)) {
            handleSystemClientAdded(client);
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
        visibleClients={visibleClientObjects}
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
        currentUserId={currentUserId}
        onSelectSystemClient={handleSystemClientAdded}
      />
    );
  }

  const isReadOnly = readOnly || 
    (!isViewingOwnTimesheet && !adminOverride && !isUserHead) || 
    (!adminOverride && status === 'accepted') || 
    (!adminOverride && !isUserHead && status === 'under-review');

  return (
    <TimeSheetGrid
      clients={effectiveClients}
      mediaTypes={effectiveMediaTypes}
      timeEntries={timeEntries}
      onTimeUpdate={onTimeUpdate}
      status={status}
      weekHours={weekHours}
      weekPercentage={weekPercentage}
      readOnly={isReadOnly}
    />
  );
};
