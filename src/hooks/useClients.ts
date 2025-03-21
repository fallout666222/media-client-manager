
import { useQuery } from '@tanstack/react-query';
import * as db from '@/integrations/supabase/database';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_SYSTEM_CLIENTS } from '@/components/ClientTree/constants';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export const useClients = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await db.getClients();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to load clients",
          variant: "destructive",
        });
        return [];
      }
      
      return data?.map(client => ({
        ...client,
        parentId: client.parent_id,
        isDefault: DEFAULT_SYSTEM_CLIENTS.includes(client.name)
      })) || [];
    }
  });

  useEffect(() => {
    const ensureDefaultClients = async () => {
      if (!clients.length) return;
      
      const missingClients = DEFAULT_SYSTEM_CLIENTS.filter(
        defaultClient => !clients.some(client => client.name === defaultClient)
      );
      
      for (const clientName of missingClients) {
        try {
          await db.createClient({
            name: clientName,
            hidden: false
          });
          console.log(`Created default client: ${clientName}`);
        } catch (error) {
          console.error(`Failed to create default client ${clientName}:`, error);
        }
      }
      
      if (missingClients.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['clients'] });
      }
    };
    
    ensureDefaultClients();
  }, [clients, queryClient]);

  return { clients, isLoading };
};
