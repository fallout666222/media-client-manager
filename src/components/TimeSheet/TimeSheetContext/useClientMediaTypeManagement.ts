
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_SYSTEM_CLIENTS } from '../Settings/constants';

interface UseClientMediaTypeManagementProps {
  userRole: 'admin' | 'user' | 'manager';
  availableClients: string[];
  availableMediaTypes: string[];
  setAvailableMediaTypes: React.Dispatch<React.SetStateAction<string[]>>;
  selectedClients: string[];
  setSelectedClients: React.Dispatch<React.SetStateAction<string[]>>;
  selectedMediaTypes: string[];
  setSelectedMediaTypes: React.Dispatch<React.SetStateAction<string[]>>;
  readOnly?: boolean;
}

export const useClientMediaTypeManagement = ({
  userRole,
  availableClients,
  availableMediaTypes,
  setAvailableMediaTypes,
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
      const updatedMediaTypes = [...availableMediaTypes, type];
      setAvailableMediaTypes(updatedMediaTypes);
      setSelectedMediaTypes([...selectedMediaTypes, type]);
    }
  };

  const handleRemoveClient = (client: string) => {
    if (readOnly) return;
    const updatedClients = selectedClients.filter(c => c !== client);
    setSelectedClients(updatedClients);
  };

  const handleRemoveMediaType = (type: string) => {
    if (readOnly) return;
    
    if (userRole === 'admin') {
      const updatedAvailableTypes = availableMediaTypes.filter(t => t !== type);
      setAvailableMediaTypes(updatedAvailableTypes);
    }
    
    const updatedSelectedTypes = selectedMediaTypes.filter(t => t !== type);
    setSelectedMediaTypes(updatedSelectedTypes);
  };

  const handleSelectClient = (client: string) => {
    if (!selectedClients.includes(client)) {
      const updatedClients = [...selectedClients, client];
      setSelectedClients(updatedClients);
    }
  };

  const handleSelectMediaType = (type: string) => {
    if (!selectedMediaTypes.includes(type)) {
      const updatedTypes = [...selectedMediaTypes, type];
      setSelectedMediaTypes(updatedTypes);
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
