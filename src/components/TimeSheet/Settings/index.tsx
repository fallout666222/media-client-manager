
import { ClientSettings } from "./ClientSettings";
import { MediaTypeSettings } from "./MediaTypeSettings";
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
  onReorderClients?: (clients: string[]) => void;
  onReorderMediaTypes?: (types: string[]) => void;
  visibleClients?: Client[];
  currentUserId?: string;
}

export const Settings = (props: SettingsProps) => {
  return (
    <div className="space-y-8">
      <ClientSettings {...props} />
      <MediaTypeSettings {...props} />
    </div>
  );
};

export * from "./ClientSettings";
export * from "./MediaTypeSettings";
export * from "./SearchableList";
export * from "./SortableItemsList";
export * from "./constants";
