
import { supabase } from '../client';

/**
 * Fetches all active clients from the database.
 * 
 * @returns A promise containing the client data and any error encountered.
 */
export const getClients = async () => {
  try {
    const response = await supabase.from('clients').select('*').eq('deletion_mark', false);
    
    if (response.error) {
      console.error('Database error fetching clients:', response.error);
      return { data: null, error: response.error };
    }
    
    return { data: response.data, error: null };
  } catch (error) {
    console.error('Unexpected error fetching clients:', error);
    return { 
      data: null, 
      error: error instanceof Error ? 
        { message: error.message, details: 'Unexpected error occurred during client fetch' } : 
        { message: 'Unknown error', details: 'Unknown error occurred during client fetch' } 
    };
  }
};

/**
 * Creates a new client in the database.
 * 
 * @param client - Client data to create. Required fields: name. Optional fields: client_id, ts_code, description, parent_id, hidden.
 * @returns A promise containing the created client data and any error encountered.
 */
export const createClient = async (client: { 
  name: string, 
  client_id?: string, 
  ts_code?: string, 
  description?: string, 
  parent_id?: string | null,
  hidden?: boolean
}) => {
  try {
    const response = await supabase.from('clients').insert(client).select().single();

    if (response.error) {
      console.error('Database error creating client:', response.error);
      return { data: null, error: response.error };
    }

    return { data: response.data, error: null };
  } catch (error) {
    console.error('Unexpected error creating client:', error);
    return {
      data: null,
      error: error instanceof Error ?
        { message: error.message, details: 'Unexpected error occurred while creating client' } :
        { message: 'Unknown error', details: 'Unknown error occurred while creating client' }
    };
  }
};

/**
 * Updates an existing client in the database.
 * 
 * @param id - The UUID of the client to update.
 * @param client - Object containing client properties to update.
 * @returns A promise containing the updated client data and any error encountered.
 */
export const updateClient = async (id: string, client: any) => {
  try {
    // Convert parentId to parent_id if it exists in the client object
    // This is needed for compatibility with frontend naming conventions
    if (client.parentId !== undefined) {
      client.parent_id = client.parentId;
      delete client.parentId;
    }
    
    const response = await supabase.from('clients').update(client).eq('id', id).select().single();

    if (response.error) {
      console.error(`Database error updating client with ID ${id}:`, response.error);
      return { data: null, error: response.error };
    }

    return { data: response.data, error: null };
  } catch (error) {
    console.error(`Unexpected error updating client with ID ${id}:`, error);
    return {
      data: null,
      error: error instanceof Error ?
        { message: error.message, details: `Unexpected error occurred while updating client with ID ${id}` } :
        { message: 'Unknown error', details: `Unknown error occurred while updating client with ID ${id}` }
    };
  }
};

/**
 * Soft-deletes a client by setting its deletion_mark to true.
 * 
 * @param id - The UUID of the client to delete.
 * @returns A promise containing the result of the operation and any error encountered.
 */
export const deleteClient = async (id: string) => {
  try {
    // Perform a soft delete by setting deletion_mark to true
    const response = await supabase.from('clients').update({ deletion_mark: true }).eq('id', id);

    if (response.error) {
      console.error(`Database error deleting client with ID ${id}:`, response.error);
      return { data: null, error: response.error };
    }

    return { data: response.data, error: null };
  } catch (error) {
    console.error(`Unexpected error deleting client with ID ${id}:`, error);
    return {
      data: null,
      error: error instanceof Error ?
        { message: error.message, details: `Unexpected error occurred while deleting client with ID ${id}` } :
        { message: 'Unknown error', details: `Unknown error occurred while deleting client with ID ${id}` }
    };
  }
};
