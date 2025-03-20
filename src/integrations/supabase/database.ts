
import { supabase, handleQueryResult } from './client';

// Custom Weeks
export const getCustomWeeks = async () => {
  try {
    const result = await supabase.from('custom_weeks').select('*').order('period_from', { ascending: true });
    return result;
  } catch (error) {
    console.error('Error fetching custom weeks:', error);
    return { data: null, error };
  }
};

export const createCustomWeek = async (week: { name: string, period_from: string, period_to: string, required_hours: number }) => {
  try {
    return await supabase.from('custom_weeks').insert([week]).select().single();
  } catch (error) {
    console.error('Error creating custom week:', error);
    return { data: null, error };
  }
};

// Users
export const getUsers = async () => {
  try {
    return await supabase.from('users').select(`
      *,
      department:departments(name)
    `).eq('deletion_mark', false);
  } catch (error) {
    console.error('Error fetching users:', error);
    return { data: null, error };
  }
};

export const getUserById = async (id: string) => {
  try {
    return await supabase.from('users').select(`
      *,
      department:departments(name)
    `).eq('id', id).single();
  } catch (error) {
    console.error(`Error fetching user with ID ${id}:`, error);
    return { data: null, error };
  }
};

export const createUser = async (user: any) => {
  try {
    return await supabase.from('users').insert([user]).select().single();
  } catch (error) {
    console.error('Error creating user:', error);
    return { data: null, error };
  }
};

export const updateUser = async (id: string, user: any) => {
  try {
    return await supabase.from('users').update(user).eq('id', id).select().single();
  } catch (error) {
    console.error(`Error updating user with ID ${id}:`, error);
    return { data: null, error };
  }
};

export const authenticateUser = async (login: string, password: string) => {
  try {
    console.log(`Authenticating user: ${login}`);
    return await supabase.from('users').select('*').eq('login', login).eq('password', password).single();
  } catch (error) {
    console.error('Authentication error:', error);
    return { data: null, error: { message: 'Authentication failed. Please check your connection to the server.' } };
  }
};

// New function to get user settings
export const getUserSettings = async (userId: string) => {
  try {
    return await supabase
      .from('users')
      .select('dark_theme, language')
      .eq('id', userId)
      .single();
  } catch (error) {
    console.error(`Error getting settings for user ${userId}:`, error);
    return { data: null, error };
  }
};

// New function to update user settings
export const updateUserSettings = async (userId: string, settings: { dark_theme?: boolean, language?: string }) => {
  try {
    return await supabase
      .from('users')
      .update(settings)
      .eq('id', userId)
      .select('dark_theme, language')
      .single();
  } catch (error) {
    console.error(`Error updating settings for user ${userId}:`, error);
    return { data: null, error };
  }
};

export const getUserFirstUnconfirmedWeek = async (userId: string) => {
  try {
    // Get week statuses that are either unconfirmed or needs-revision
    const statusNamesResult = await supabase
      .from('week_status_names')
      .select('id')
      .or('name.eq.unconfirmed,name.eq.needs-revision');
    
    const statusNames = handleQueryResult(statusNamesResult);
    
    if (!statusNames || statusNames.length === 0) {
      console.log('No unconfirmed or needs-revision status names found');
      return null;
    }
    
    const statusIds = statusNames.map(status => status.id);
    console.log('Status IDs to search for:', statusIds);
    
    // Find the first week with these statuses
    const weekStatusesResult = await supabase
      .from('week_statuses')
      .select(`
        id,
        week_id,
        week_status_id,
        user_id,
        week:custom_weeks(id, name, period_from, period_to, required_hours)
      `)
      .eq('user_id', userId)
      .in('week_status_id', statusIds)
      .order('created_at', { ascending: true });
    
    const weekStatuses = handleQueryResult(weekStatusesResult);
    
    if (!weekStatuses || weekStatuses.length === 0) {
      console.log('No weeks with unconfirmed/needs-revision status found for user:', userId);
      return null;
    }
    
    console.log('Found week statuses:', weekStatuses);
    
    if (weekStatuses[0]?.week) {
      return weekStatuses[0].week;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user first unconfirmed week:', error);
    return null;
  }
};

// Media Types
export const getMediaTypes = async () => {
  try {
    return await supabase.from('media_types').select('*');
  } catch (error) {
    console.error('Error fetching media types:', error);
    return { data: null, error };
  }
};

export const createMediaType = async (mediaType: { name: string, description?: string }) => {
  try {
    return await supabase.from('media_types').insert([mediaType]).select().single();
  } catch (error) {
    console.error('Error creating media type:', error);
    return { data: null, error };
  }
};

// Departments
export const getDepartments = async () => {
  try {
    return await supabase.from('departments').select('*');
  } catch (error) {
    console.error('Error fetching departments:', error);
    return { data: null, error };
  }
};

export const createDepartment = async (department: { name: string, description?: string }) => {
  try {
    return await supabase.from('departments').insert([department]).select().single();
  } catch (error) {
    console.error('Error creating department:', error);
    return { data: null, error };
  }
};

export const deleteDepartment = async (id: string) => {
  try {
    return await supabase.from('departments').delete().eq('id', id);
  } catch (error) {
    console.error(`Error deleting department with ID ${id}:`, error);
    return { data: null, error };
  }
};

// Week Status Names
export const getWeekStatusNames = async () => {
  try {
    return await supabase.from('week_status_names').select('*');
  } catch (error) {
    console.error('Error fetching week status names:', error);
    return { data: null, error };
  }
};

// Clients
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
  try {
    return await supabase.from('clients').insert([client]).select().single();
  } catch (error) {
    console.error('Error creating client:', error);
    return { data: null, error };
  }
};

export const updateClient = async (id: string, client: any) => {
  try {
    // Convert parentId to parent_id if it exists in the client object
    const clientData = {...client};
    if (clientData.parentId !== undefined) {
      clientData.parent_id = clientData.parentId;
      delete clientData.parentId;
    }
    
    return await supabase.from('clients').update(clientData).eq('id', id).select().single();
  } catch (error) {
    console.error(`Error updating client with ID ${id}:`, error);
    return { data: null, error };
  }
};

export const deleteClient = async (id: string) => {
  try {
    return await supabase.from('clients').update({ deletion_mark: true }).eq('id', id);
  } catch (error) {
    console.error(`Error deleting client with ID ${id}:`, error);
    return { data: null, error };
  }
};

// User Manager relations
export const getUserManagers = async () => {
  try {
    return await supabase.from('user_managers').select(`
      *,
      user:users!user_id(id, name),
      manager:users!manager_id(id, name)
    `);
  } catch (error) {
    console.error('Error fetching user managers:', error);
    return { data: null, error };
  }
};

export const assignManagerToUser = async (userId: string, managerId: string) => {
  try {
    return await supabase.from('user_managers').insert([{ user_id: userId, manager_id: managerId }]).select().single();
  } catch (error) {
    console.error(`Error assigning manager ${managerId} to user ${userId}:`, error);
    return { data: null, error };
  }
};

// Week Statuses
export const getWeekStatuses = async (userId: string) => {
  try {
    return await supabase.from('week_statuses').select(`
      *,
      week:custom_weeks(*),
      status:week_status_names(*)
    `).eq('user_id', userId);
  } catch (error) {
    console.error(`Error fetching week statuses for user ${userId}:`, error);
    return { data: null, error };
  }
};

export const getWeekStatusesChronological = async (userId: string) => {
  try {
    const result = await supabase.from('week_statuses').select(`
      *,
      week:custom_weeks(*),
      status:week_status_names(*)
    `).eq('user_id', userId);
    
    if (result.error) throw result.error;
    
    // Sort by week's period_from date if data exists
    const data = result.data?.sort((a, b) => {
      if (!a.week || !b.week) return 0;
      
      const dateA = new Date(a.week.period_from);
      const dateB = new Date(b.week.period_from);
      return dateA.getTime() - dateB.getTime();
    });
    
    return { data, error: null };
  } catch (error) {
    console.error(`Error fetching chronological week statuses for user ${userId}:`, error);
    return { data: null, error };
  }
};

export const updateWeekStatus = async (userId: string, weekId: string, statusId: string) => {
  try {
    // Check if status already exists
    const existingStatus = await supabase.from('week_statuses')
      .select('*')
      .eq('user_id', userId)
      .eq('week_id', weekId)
      .maybeSingle();
    
    const existingData = handleQueryResult(existingStatus);
    
    if (existingData) {
      return await supabase.from('week_statuses')
        .update({ week_status_id: statusId })
        .eq('id', existingData.id)
        .select()
        .single();
    } else {
      return await supabase.from('week_statuses')
        .insert([{ user_id: userId, week_id: weekId, week_status_id: statusId }])
        .select()
        .single();
    }
  } catch (error) {
    console.error(`Error updating week status for user ${userId}, week ${weekId}:`, error);
    return { data: null, error };
  }
};

// Week Percentages
export const getWeekPercentages = async (userId: string) => {
  try {
    return await supabase.from('week_percentages').select(`
      *,
      week:custom_weeks(*)
    `).eq('user_id', userId);
  } catch (error) {
    console.error(`Error fetching week percentages for user ${userId}:`, error);
    return { data: null, error };
  }
};

export const updateWeekPercentage = async (userId: string, weekId: string, percentage: number) => {
  try {
    // Check if percentage already exists
    const existingPercentage = await supabase.from('week_percentages')
      .select('*')
      .eq('user_id', userId)
      .eq('week_id', weekId)
      .maybeSingle();
    
    const existingData = handleQueryResult(existingPercentage);
    
    if (existingData) {
      return await supabase.from('week_percentages')
        .update({ percentage })
        .eq('id', existingData.id)
        .select()
        .single();
    } else {
      return await supabase.from('week_percentages')
        .insert([{ user_id: userId, week_id: weekId, percentage }])
        .select()
        .single();
    }
  } catch (error) {
    console.error(`Error updating week percentage for user ${userId}, week ${weekId}:`, error);
    return { data: null, error };
  }
};

// Week Hours
export const getWeekHours = async (userId: string, weekId: string) => {
  try {
    return await supabase.from('week_hours').select(`
      *,
      client:clients(*),
      media_type:media_types(*)
    `).eq('user_id', userId).eq('week_id', weekId);
  } catch (error) {
    console.error(`Error fetching week hours for user ${userId}, week ${weekId}:`, error);
    return { data: null, error };
  }
};

export const updateWeekHours = async (
  userId: string, 
  weekId: string, 
  clientId: string, 
  mediaTypeId: string, 
  hours: number
) => {
  try {
    // Check if hours entry already exists
    const existingHours = await supabase.from('week_hours')
      .select('*')
      .eq('user_id', userId)
      .eq('week_id', weekId)
      .eq('client_id', clientId)
      .eq('media_type_id', mediaTypeId)
      .maybeSingle();
    
    const existingData = handleQueryResult(existingHours);
    
    if (hours === 0) {
      // Delete the record if hours is 0
      if (existingData) {
        console.log(`Deleting hours record for week ${weekId}, client ${clientId}, media ${mediaTypeId}`);
        return await supabase.from('week_hours')
          .delete()
          .eq('id', existingData.id);
      }
      // If no record exists with 0 hours, nothing to do
      return { data: null, error: null };
    } else if (existingData) {
      // Update existing record with non-zero hours
      return await supabase.from('week_hours')
        .update({ hours })
        .eq('id', existingData.id)
        .select()
        .single();
    } else {
      // Insert new record with non-zero hours
      return await supabase.from('week_hours')
        .insert([{ user_id: userId, week_id: weekId, client_id: clientId, media_type_id: mediaTypeId, hours }])
        .select()
        .single();
    }
  } catch (error) {
    console.error(`Error updating week hours for user ${userId}, week ${weekId}:`, error);
    return { data: null, error };
  }
};

// Update this function to handle zero hours by deleting records
export const updateHours = async (userId: string, weekId: string, clientName: string, mediaTypeName: string, hours: number) => {
  try {
    // Get the client and media type IDs from their names
    const clientsResult = await getClients();
    const mediaTypesResult = await getMediaTypes();
    
    const clients = handleQueryResult(clientsResult);
    const mediaTypes = handleQueryResult(mediaTypesResult);
    
    if (!clients || !mediaTypes) {
      throw new Error('Failed to fetch clients or media types');
    }
    
    const clientObj = clients.find(c => c.name === clientName);
    const mediaTypeObj = mediaTypes.find(m => m.name === mediaTypeName);
    
    if (!clientObj || !mediaTypeObj) {
      console.error('Client or media type not found', { clientName, mediaTypeName });
      throw new Error('Client or media type not found');
    }
    
    // Use the existing updateWeekHours function with the IDs
    return await updateWeekHours(userId, weekId, clientObj.id, mediaTypeObj.id, hours);
  } catch (error) {
    console.error('Error in updateHours:', error);
    throw error;
  }
};

// Visible Clients & Types
export const getUserVisibleClients = async (userId: string) => {
  try {
    return await supabase.from('visible_clients').select(`
      *,
      client:clients(*)
    `).eq('user_id', userId).order('display_order', { ascending: true });
  } catch (error) {
    console.error(`Error fetching visible clients for user ${userId}:`, error);
    return { data: null, error };
  }
};

export const addUserVisibleClient = async (userId: string, clientId: string) => {
  try {
    // Get the highest display_order value
    const existingClientsResult = await supabase
      .from('visible_clients')
      .select('display_order')
      .eq('user_id', userId)
      .order('display_order', { ascending: false })
      .limit(1);
    
    const existingClients = handleQueryResult(existingClientsResult);
    const nextOrder = existingClients && existingClients.length > 0 ? 
      (existingClients[0].display_order || 0) + 1 : 0;

    return await supabase
      .from('visible_clients')
      .insert([{ 
        user_id: userId, 
        client_id: clientId, 
        display_order: nextOrder 
      }])
      .select()
      .single();
  } catch (error) {
    console.error(`Error adding visible client for user ${userId}:`, error);
    return { data: null, error };
  }
};

export const removeUserVisibleClient = async (id: string) => {
  try {
    return await supabase.from('visible_clients').delete().eq('id', id);
  } catch (error) {
    console.error(`Error removing visible client with ID ${id}:`, error);
    return { data: null, error };
  }
};

export const updateVisibleClientsOrder = async (userId: string, clientIds: string[]) => {
  try {
    // Get mapping of client names to IDs
    const clientsResult = await supabase.from('clients').select('id, name');
    const clients = handleQueryResult(clientsResult);
    
    if (!clients) return { error: { message: "Failed to fetch clients" } };
    
    const clientMap = new Map(clients.map(c => [c.name, c.id]));
    
    // Get existing visible client records
    const visibleClientsResult = await supabase
      .from('visible_clients')
      .select('id, client_id')
      .eq('user_id', userId);
    
    const visibleClients = handleQueryResult(visibleClientsResult);
    
    if (!visibleClients) return { error: { message: "Failed to fetch visible clients" } };
    
    // Create a map for fast lookups
    const visibleClientMap = new Map(
      visibleClients.map(vc => [vc.client_id, vc.id])
    );
    
    // Update each client's display_order based on its position in the clientIds array
    const updates = [];
    
    for (let i = 0; i < clientIds.length; i++) {
      const clientName = clientIds[i];
      const clientId = clientMap.get(clientName);
      if (clientId) {
        const visibleClientId = visibleClientMap.get(clientId);
        if (visibleClientId) {
          updates.push(
            supabase
              .from('visible_clients')
              .update({ display_order: i })
              .eq('id', visibleClientId)
          );
        }
      }
    }
    
    // Execute all updates
    if (updates.length > 0) {
      await Promise.all(updates);
    }
    
    return { data: true, error: null };
  } catch (error) {
    console.error(`Error updating visible clients order for user ${userId}:`, error);
    return { data: null, error };
  }
};

export const getUserVisibleTypes = async (userId: string) => {
  try {
    return await supabase.from('visible_types').select(`
      *,
      type:media_types(*)
    `).eq('user_id', userId).order('display_order', { ascending: true });
  } catch (error) {
    console.error(`Error fetching visible types for user ${userId}:`, error);
    return { data: null, error };
  }
};

export const addUserVisibleType = async (userId: string, typeId: string) => {
  try {
    // Get the highest display_order value
    const existingTypesResult = await supabase
      .from('visible_types')
      .select('display_order')
      .eq('user_id', userId)
      .order('display_order', { ascending: false })
      .limit(1);
    
    const existingTypes = handleQueryResult(existingTypesResult);
    const nextOrder = existingTypes && existingTypes.length > 0 ? 
      (existingTypes[0].display_order || 0) + 1 : 0;

    return await supabase
      .from('visible_types')
      .insert([{ 
        user_id: userId, 
        type_id: typeId, 
        display_order: nextOrder 
      }])
      .select()
      .single();
  } catch (error) {
    console.error(`Error adding visible type for user ${userId}:`, error);
    return { data: null, error };
  }
};

export const removeUserVisibleType = async (id: string) => {
  try {
    return await supabase.from('visible_types').delete().eq('id', id);
  } catch (error) {
    console.error(`Error removing visible type with ID ${id}:`, error);
    return { data: null, error };
  }
};

export const updateVisibleTypesOrder = async (userId: string, typeNames: string[]) => {
  try {
    // Get mapping of media type names to IDs
    const mediaTypesResult = await supabase.from('media_types').select('id, name');
    const mediaTypes = handleQueryResult(mediaTypesResult);
    
    if (!mediaTypes) return { error: { message: "Failed to fetch media types" } };
    
    const typeMap = new Map(mediaTypes.map(t => [t.name, t.id]));
    
    // Get existing visible type records
    const visibleTypesResult = await supabase
      .from('visible_types')
      .select('id, type_id')
      .eq('user_id', userId);
    
    const visibleTypes = handleQueryResult(visibleTypesResult);
    
    if (!visibleTypes) return { error: { message: "Failed to fetch visible types" } };
    
    // Create a map for fast lookups
    const visibleTypeMap = new Map(
      visibleTypes.map(vt => [vt.type_id, vt.id])
    );
    
    // Update each type's display_order based on its position in the typeNames array
    const updates = [];
    
    for (let i = 0; i < typeNames.length; i++) {
      const typeName = typeNames[i];
      const typeId = typeMap.get(typeName);
      if (typeId) {
        const visibleTypeId = visibleTypeMap.get(typeId);
        if (visibleTypeId) {
          updates.push(
            supabase
              .from('visible_types')
              .update({ display_order: i })
              .eq('id', visibleTypeId)
          );
        }
      }
    }
    
    // Execute all updates
    if (updates.length > 0) {
      await Promise.all(updates);
    }
    
    return { data: true, error: null };
  } catch (error) {
    console.error(`Error updating visible types order for user ${userId}:`, error);
    return { data: null, error };
  }
};
