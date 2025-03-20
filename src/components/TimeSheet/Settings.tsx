
import React from 'react';
import { ClientSettings } from './Settings/ClientSettings';
import { MediaTypeSettings } from './Settings/MediaTypeSettings';
import { Client } from '@/types/timesheet';

interface SettingsProps {
  clients: string[];
  mediaTypes: string[];
  onAddClient: (client: string) => void;
  onRemoveClient: (client: string) => void;
  onAddMediaType: (type: string) => void;
  onRemoveMediaType: (type: string) => void;
  userRole: 'admin' | 'user' | 'manager';
  availableClients: string[];
  availableMediaTypes: string[];
  selectedClients: string[];
  selectedMediaTypes: string[];
  onSelectClient: (client: string) => void;
  onSelectMediaType: (type: string) => void;
  visibleClients?: Client[];
  onReorderClients?: (clients: string[]) => void;
  onReorderMediaTypes?: (types: string[]) => void;
  currentUserId?: string;
  onSelectSystemClient?: (systemClientName: string) => void;
  onSelectMultipleClients?: (clients: string[]) => void;
}

export const Settings = ({
  clients,
  mediaTypes,
  onAddClient,
  onRemoveClient,
  onAddMediaType,
  onRemoveMediaType,
  userRole,
  availableClients,
  availableMediaTypes,
  selectedClients,
  selectedMediaTypes,
  onSelectClient,
  onSelectMediaType,
  visibleClients = [],
  onReorderClients,
  onReorderMediaTypes,
  currentUserId,
  onSelectSystemClient,
  onSelectMultipleClients,
}: SettingsProps) => {
  return (
    <div className="space-y-8">
      <ClientSettings
        clients={clients}
        onAddClient={onAddClient}
        onRemoveClient={onRemoveClient}
        userRole={userRole}
        availableClients={availableClients}
        selectedClients={selectedClients}
        onSelectClient={onSelectClient}
        onSelectMultipleClients={onSelectMultipleClients}
        onReorderClients={onReorderClients}
        visibleClients={visibleClients}
        currentUserId={currentUserId}
        onSelectSystemClient={onSelectSystemClient}
      />

      <MediaTypeSettings
        mediaTypes={mediaTypes}
        onAddMediaType={onAddMediaType}
        onRemoveMediaType={onRemoveMediaType}
        availableMediaTypes={availableMediaTypes}
        selectedMediaTypes={selectedMediaTypes}
        onSelectMediaType={onSelectMediaType}
        onReorderMediaTypes={onReorderMediaTypes}
        currentUserId={currentUserId}
      />
    </div>
  );
};
