
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_SYSTEM_CLIENTS } from '../Settings/constants';

interface UseClientMediaTypeManagementProps {
  userRole: 'admin' | 'user' | 'manager';
  availableClients: string[];
  availableMediaTypes: string[];
  selectedClients: string[];
  setSelectedClients: (clients: string[]) => void;
  selectedMediaTypes: string[];
  setSelectedMediaTypes: (types: string[]) => void;
  readOnly?: boolean;
}

export const useClientMediaTypeManagement = ({
  userRole,
  availableClients,
  availableMediaTypes,
  selectedClients,
  setSelectedClients,
  selectedMediaTypes,
  setSelectedMediaTypes,
  readOnly = false
}: UseClientMediaTypeManagementProps) => {
  const { toast } = useToast();

  const handleAddClient = (client: string) => {
    if (userRole !== 'admin') return;
    
    if (!availableClients.includes(client)) {
      toast({
        title: "Client Management Moved",
        description: "Please add new clients from the Client Tree page",
      });
    }
  };

  const handleAddMediaType = (type: string) => {
    if (userRole !== 'admin') return;
    
    if (!availableMediaTypes.includes(type)) {
      setAvailableMediaTypes(prev => [...prev, type]);
      setSelectedMediaTypes(prev => [...prev, type]);
    }
  };

  const handleRemoveClient = (client: string) => {
    if (readOnly) return;
    setSelectedClients(prev => prev.filter(c => c !== client));
  };

  const handleRemoveMediaType = (type: string) => {
    if (readOnly) return;
    
    if (userRole === 'admin') {
      setAvailableMediaTypes(prev => prev.filter(t => t !== type));
    }
    
    setSelectedMediaTypes(prev => prev.filter(t => t !== type));
  };

  const handleSelectClient = (client: string) => {
    if (!selectedClients.includes(client)) {
      setSelectedClients(prev => [...prev, client]);
    }
  };

  const handleSelectMediaType = (type: string) => {
    if (!selectedMediaTypes.includes(type)) {
      setSelectedMediaTypes(prev => [...prev, type]);
    }
  };

  const handleReorderClients = (newOrder: string[]) => {
    setSelectedClients(newOrder);
  };

  const handleReorderMediaTypes = (newOrder: string[]) => {
    setSelectedMediaTypes(newOrder);
  };

  return {
    handleAddClient,
    handleAddMediaType,
    handleRemoveClient,
    handleRemoveMediaType,
    handleSelectClient,
    handleSelectMediaType,
    handleReorderClients,
    handleReorderMediaTypes
  };
};
