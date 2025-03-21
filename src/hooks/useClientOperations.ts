
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/integrations/supabase/database';
import { Client } from '@/types/timesheet';
import { useToast } from '@/hooks/use-toast';

export const useAddClient = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientData: { name: string, parentId: string | null }) => {
      const { data, error } = await db.createClient({
        name: clientData.name,
        parent_id: clientData.parentId,
        hidden: false
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      
      toast({
        title: "Success",
        description: "Client added successfully",
      });
    },
    onError: (error) => {
      console.error('Error adding client:', error);
      toast({
        title: "Error",
        description: "Failed to add client",
        variant: "destructive",
      });
    }
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const DEFAULT_SYSTEM_CLIENTS = [
    "Administrative",
    "Education/Training",
    "General Research",
    "Network Requests",
    "New Business",
    "Sick Leave",
    "VACATION"
  ];

  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<Client> }) => {
      const clients = queryClient.getQueryData<Client[]>(['clients']) || [];
      const client = clients.find(c => c.id === id);
      
      if (client && DEFAULT_SYSTEM_CLIENTS.includes(client.name)) {
        throw new Error("Cannot modify system default clients");
      }
      
      const { error } = await db.updateClient(id, data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error) => {
      console.error('Error updating client:', error);
      toast({
        title: "Error",
        description: "Failed to update client",
        variant: "destructive",
      });
    }
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const DEFAULT_SYSTEM_CLIENTS = [
    "Administrative",
    "Education/Training",
    "General Research",
    "Network Requests",
    "New Business",
    "Sick Leave",
    "VACATION"
  ];

  return useMutation({
    mutationFn: async (id: string) => {
      const clients = queryClient.getQueryData<Client[]>(['clients']) || [];
      const client = clients.find(c => c.id === id);
      
      if (client && DEFAULT_SYSTEM_CLIENTS.includes(client.name)) {
        throw new Error("Cannot delete system default clients");
      }
      
      const { error } = await db.deleteClient(id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting client:', error);
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    }
  });
};

export const useCheckCircularReference = () => {
  return (clients: Client[], clientId: string, newParentId: string): boolean => {
    let currentParentId = newParentId;
    const visited = new Set<string>();
    
    while (currentParentId) {
      if (visited.has(currentParentId)) {
        return true;
      }
      
      if (currentParentId === clientId) {
        return true;
      }
      
      visited.add(currentParentId);
      
      const parent = clients.find(c => c.id === currentParentId);
      if (!parent || !parent.parentId) {
        break;
      }
      
      currentParentId = parent.parentId;
    }
    
    return false;
  };
};
