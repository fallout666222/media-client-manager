
import { supabase } from '../client';

export const getClients = async () => {
  try {
    return await supabase.from('clients').select('*').eq('deletion_mark', false);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return { data: null, error };
  }
};

export const createClient = async (client: { 
  name: string, 
  client_id?: string, 
  ts_code?: string, 
  description?: string, 
  parent_id?: string | null,
  hidden?: boolean
}) => {
  return await supabase.from('clients').insert(client).select().single();
};

export const updateClient = async (id: string, client: any) => {
  // Convert parentId to parent_id if it exists in the client object
  if (client.parentId !== undefined) {
    client.parent_id = client.parentId;
    delete client.parentId;
  }
  
  return await supabase.from('clients').update(client).eq('id', id).select().single();
};

export const deleteClient = async (id: string) => {
  return await supabase.from('clients').update({ deletion_mark: true }).eq('id', id);
};
