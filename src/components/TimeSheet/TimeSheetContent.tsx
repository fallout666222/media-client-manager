
import React, { useState, useEffect } from 'react';
import { Settings } from './Settings';
import { TimeSheetGrid } from './TimeSheetGrid';
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
  onSaveVisibleClients: (clients: string[]) => void;
  onSaveVisibleMediaTypes: (types: string[]) => void;
  readOnly?: boolean;
  weekHours: number;
  weekPercentage: number;
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
  onReorderClients: (clients: string[]) => void;
  onReorderMediaTypes: (types: string[]) => void;
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
  weekHours,
  weekPercentage,
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
  return (
    <div>
      {showSettings ? (
        <Settings 
          availableClients={availableClients}
          availableMediaTypes={availableMediaTypes}
          selectedClients={selectedClients}
          selectedMediaTypes={selectedMediaTypes}
          onAddClient={onAddClient}
          onAddMediaType={onAddMediaType}
          onRemoveClient={onRemoveClient}
          onRemoveMediaType={onRemoveMediaType}
          onSaveClients={onSaveVisibleClients}
          onSaveMediaTypes={onSaveVisibleMediaTypes}
          readOnly={readOnly}
          userRole={userRole}
          onSelectClient={onSelectClient}
          onSelectMediaType={onSelectMediaType}
          isViewingOwnTimesheet={isViewingOwnTimesheet}
          clientObjects={clientObjects}
          adminOverride={adminOverride}
          onReorderClients={onReorderClients}
          onReorderMediaTypes={onReorderMediaTypes}
          currentUserId={currentUserId}
        />
      ) : (
        <TimeSheetGrid 
          clients={selectedClients} 
          mediaTypes={selectedMediaTypes}
          timeEntries={timeEntries}
          onTimeUpdate={onTimeUpdate}
          status={status}
          weekHours={weekHours}
          readOnly={readOnly}
          weekPercentage={weekPercentage}
        />
      )}
    </div>
  );
};
