
import { useToast } from '@/hooks/use-toast';
import {
  getClients,
  getMediaTypes,
  getUserVisibleClients,
  getUserVisibleTypes,
  addUserVisibleClient,
  addUserVisibleType,
  removeUserVisibleClient,
  removeUserVisibleType,
  updateVisibleClientsOrder,
  updateVisibleTypesOrder
} from '@/integrations/supabase/database';
import { handleQueryResult } from '@/integrations/supabase/client';
import { User } from '@/types/timesheet';

interface UseTimeSheetPreferencesProps {
  currentUser: User;
}

export const useTimeSheetPreferences = ({
  currentUser
}: UseTimeSheetPreferencesProps) => {
  const { toast } = useToast();

  const handleSaveVisibleClients = async (clients: string[]) => {
    if (!currentUser.id) return;
    
    try {
      const { data: clientsData } = await getClients();
      if (!clientsData) return;
      
      const { data: currentVisible } = await getUserVisibleClients(currentUser.id);
      
      const clientMap = new Map(clientsData.map(c => [c.name, c.id as string])); // Cast id to string
      
      for (const clientName of clients) {
        const clientId = clientMap.get(clientName);
        
        if (clientId && currentVisible && !currentVisible.some(v => v.client_id === clientId)) {
          await addUserVisibleClient(currentUser.id, clientId);
        }
      }
      
      if (currentVisible) {
        for (const visible of currentVisible) {
          const client = clientsData.find(c => c.id === visible.client_id);
          
          if (client && !clients.includes(client.name)) {
            await removeUserVisibleClient(visible.id);
          }
        }
      }
      
      await updateVisibleClientsOrder(currentUser.id, clients);
      
      toast({
        title: "Visible Clients Updated",
        description: "Your visible clients have been updated",
      });
    } catch (error) {
      console.error('Error updating visible clients:', error);
      toast({
        title: "Error",
        description: "Failed to update visible clients",
        variant: "destructive"
      });
    }
  };

  const handleSaveVisibleMediaTypes = async (types: string[]) => {
    if (!currentUser.id) return;
    
    try {
      const { data: mediaTypesData } = await getMediaTypes();
      if (!mediaTypesData) return;
      
      const { data: currentVisible } = await getUserVisibleTypes(currentUser.id);
      
      const typeMap = new Map(mediaTypesData.map(t => [t.name, t.id as string])); // Cast id to string
      
      for (const typeName of types) {
        const typeId = typeMap.get(typeName);
        
        if (typeId && currentVisible && !currentVisible.some(v => v.type_id === typeId)) {
          await addUserVisibleType(currentUser.id, typeId);
        }
      }
      
      if (currentVisible) {
        for (const visible of currentVisible) {
          const type = mediaTypesData.find(t => t.id === visible.type_id);
          
          if (type && !types.includes(type.name)) {
            await removeUserVisibleType(visible.id);
          }
        }
      }
      
      await updateVisibleTypesOrder(currentUser.id, types);
      
      toast({
        title: "Visible Media Types Updated",
        description: "Your visible media types have been updated",
      });
    } catch (error) {
      console.error('Error updating visible media types:', error);
      toast({
        title: "Error",
        description: "Failed to update visible media types",
        variant: "destructive"
      });
    }
  };

  return {
    handleSaveVisibleClients,
    handleSaveVisibleMediaTypes
  };
};
