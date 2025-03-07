import { supabase } from './client';

// Custom Weeks
export const getCustomWeeks = async () => {
  return await supabase.from('custom_weeks').select('*').order('period_from', { ascending: true });
};

export const createCustomWeek = async (week: { name: string, period_from: string, period_to: string, required_hours: number }) => {
  return await supabase.from('custom_weeks').insert(week).select().single();
};

// Users
export const getUsers = async () => {
  return await supabase.from('users').select(`
    *,
    department:departments(name)
  `).eq('deletion_mark', false);
};

export const getUserById = async (id: string) => {
  return await supabase.from('users').select(`
    *,
    department:departments(name)
  `).eq('id', id).single();
};

export const createUser = async (user: any) => {
  return await supabase.from('users').insert(user).select().single();
};

export const updateUser = async (id: string, user: any) => {
  return await supabase.from('users').update(user).eq('id', id).select().single();
};

export const authenticateUser = async (login: string, password: string) => {
  return await supabase.from('users').select('*').eq('login', login).eq('password', password).single();
};

export const getUserFirstUnconfirmedWeek = async (userId: string) => {
  // Get week statuses that are either unconfirmed or needs-revision
  const { data: statusNames } = await supabase
    .from('week_status_names')
    .select('id')
    .or('name.eq.unconfirmed,name.eq.needs-revision');
  
  if (!statusNames || statusNames.length === 0) {
    console.log('No unconfirmed or needs-revision status names found');
    return null;
  }
  
  const statusIds = statusNames.map(status => status.id);
  console.log('Status IDs to search for:', statusIds);
  
  // Find the first week with these statuses
  const { data: weekStatuses, error } = await supabase
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
  
  if (error) {
    console.error('Error fetching week statuses:', error);
    return null;
  }
  
  console.log('Found week statuses:', weekStatuses);
  
  if (weekStatuses && weekStatuses.length > 0 && weekStatuses[0].week) {
    return weekStatuses[0].week;
  }
  
  console.log('No weeks with unconfirmed/needs-revision status found for user:', userId);
  return null;
};

// Media Types
export const getMediaTypes = async () => {
  return await supabase.from('media_types').select('*');
};

export const createMediaType = async (mediaType: { name: string, description?: string }) => {
  return await supabase.from('media_types').insert(mediaType).select().single();
};

// Departments
export const getDepartments = async () => {
  return await supabase.from('departments').select('*');
};

export const createDepartment = async (department: { name: string, description?: string }) => {
  return await supabase.from('departments').insert(department).select().single();
};

export const deleteDepartment = async (id: string) => {
  return await supabase.from('departments').delete().eq('id', id);
};

// Week Status Names
export const getWeekStatusNames = async () => {
  return await supabase.from('week_status_names').select('*');
};

// Clients
export const getClients = async () => {
  return await supabase.from('clients').select('*').eq('deletion_mark', false);
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

// User Manager relations
export const getUserManagers = async () => {
  return await supabase.from('user_managers').select(`
    *,
    user:users!user_id(id, name),
    manager:users!manager_id(id, name)
  `);
};

export const assignManagerToUser = async (userId: string, managerId: string) => {
  return await supabase.from('user_managers').insert({ user_id: userId, manager_id: managerId }).select().single();
};

// Week Statuses
export const getWeekStatuses = async (userId: string) => {
  return await supabase.from('week_statuses').select(`
    *,
    week:custom_weeks(*),
    status:week_status_names(*)
  `).eq('user_id', userId);
};

export const updateWeekStatus = async (userId: string, weekId: string, statusId: string) => {
  // Check if status already exists
  const { data } = await supabase.from('week_statuses')
    .select('*')
    .eq('user_id', userId)
    .eq('week_id', weekId)
    .maybeSingle();
  
  if (data) {
    return await supabase.from('week_statuses')
      .update({ week_status_id: statusId })
      .eq('id', data.id)
      .select()
      .single();
  } else {
    return await supabase.from('week_statuses')
      .insert({ user_id: userId, week_id: weekId, week_status_id: statusId })
      .select()
      .single();
  }
};

// Week Percentages
export const getWeekPercentages = async (userId: string) => {
  return await supabase.from('week_percentages').select(`
    *,
    week:custom_weeks(*)
  `).eq('user_id', userId);
};

export const updateWeekPercentage = async (userId: string, weekId: string, percentage: number) => {
  // Check if percentage already exists
  const { data } = await supabase.from('week_percentages')
    .select('*')
    .eq('user_id', userId)
    .eq('week_id', weekId)
    .maybeSingle();
  
  if (data) {
    return await supabase.from('week_percentages')
      .update({ percentage })
      .eq('id', data.id)
      .select()
      .single();
  } else {
    return await supabase.from('week_percentages')
      .insert({ user_id: userId, week_id: weekId, percentage })
      .select()
      .single();
  }
};

// Week Hours
export const getWeekHours = async (userId: string, weekId: string) => {
  return await supabase.from('week_hours').select(`
    *,
    client:clients(*),
    media_type:media_types(*)
  `).eq('user_id', userId).eq('week_id', weekId);
};

export const updateWeekHours = async (
  userId: string, 
  weekId: string, 
  clientId: string, 
  mediaTypeId: string, 
  hours: number
) => {
  // Check if hours entry already exists
  const { data } = await supabase.from('week_hours')
    .select('*')
    .eq('user_id', userId)
    .eq('week_id', weekId)
    .eq('client_id', clientId)
    .eq('media_type_id', mediaTypeId)
    .maybeSingle();
  
  if (data) {
    return await supabase.from('week_hours')
      .update({ hours })
      .eq('id', data.id)
      .select()
      .single();
  } else {
    return await supabase.from('week_hours')
      .insert({ user_id: userId, week_id: weekId, client_id: clientId, media_type_id: mediaTypeId, hours })
      .select()
      .single();
  }
};

// Visible Clients & Types
export const getUserVisibleClients = async (userId: string) => {
  return await supabase.from('visible_clients').select(`
    *,
    client:clients(*)
  `).eq('user_id', userId).order('display_order', { ascending: true });
};

export const addUserVisibleClient = async (userId: string, clientId: string, displayOrder?: number) => {
  // If display_order is not provided, get the maximum current order and add 1
  if (displayOrder === undefined) {
    const { data: existingClients } = await supabase
      .from('visible_clients')
      .select('display_order')
      .eq('user_id', userId)
      .order('display_order', { ascending: false })
      .limit(1);
    
    displayOrder = existingClients && existingClients.length > 0 
      ? (existingClients[0].display_order || 0) + 1 
      : 0;
  }
  
  console.log(`Adding visible client for user ${userId}, client ${clientId} with order ${displayOrder}`);
  
  return await supabase
    .from('visible_clients')
    .insert({ 
      user_id: userId, 
      client_id: clientId, 
      display_order: displayOrder 
    })
    .select()
    .single();
};

export const removeUserVisibleClient = async (id: string) => {
  return await supabase.from('visible_clients').delete().eq('id', id);
};

export const updateUserVisibleClientsOrder = async (userId: string, clientIds: string[]) => {
  console.log(`Updating visible clients order for user ${userId}:`, clientIds);
  
  // Get all current visible clients for this user with their IDs
  const { data: visibleClients, error } = await supabase
    .from('visible_clients')
    .select('id, client_id, client:clients(id, name)')
    .eq('user_id', userId);
    
  if (error) {
    console.error("Error fetching visible clients:", error);
    throw error;
  }
  
  if (!visibleClients || visibleClients.length === 0) {
    console.warn("No visible clients found to update order");
    return { success: false, error: "No visible clients found" };
  }
  
  // Create a map of client names to visible_clients.id for easy lookup
  const clientNameToVisibleClientId = new Map();
  visibleClients.forEach(vc => {
    if (vc.client && vc.client.name) {
      clientNameToVisibleClientId.set(vc.client.name, vc.id);
    }
  });
  
  // Create batch update
  const updates = [];
  
  for (let i = 0; i < clientIds.length; i++) {
    const clientName = clientIds[i];
    const visibleClientId = clientNameToVisibleClientId.get(clientName);
    
    if (visibleClientId) {
      updates.push({
        id: visibleClientId,
        display_order: i
      });
    } else {
      console.warn(`Could not find visible client ID for client name: ${clientName}`);
    }
  }
  
  if (updates.length === 0) {
    console.warn("No updates to make for visible clients order");
    return { success: false, error: "No valid clients to update" };
  }
  
  console.log("Updating visible clients with:", updates);
  
  // Perform the batch update
  const { data, error: updateError } = await supabase
    .from('visible_clients')
    .upsert(updates)
    .select();
    
  if (updateError) {
    console.error("Error updating visible clients order:", updateError);
    throw updateError;
  }
  
  return { success: true, data };
};

export const getUserVisibleTypes = async (userId: string) => {
  return await supabase.from('visible_types').select(`
    *,
    type:media_types(*)
  `).eq('user_id', userId).order('display_order', { ascending: true });
};

export const addUserVisibleType = async (userId: string, typeId: string, displayOrder?: number) => {
  // If display_order is not provided, get the maximum current order and add 1
  if (displayOrder === undefined) {
    const { data: existingTypes } = await supabase
      .from('visible_types')
      .select('display_order')
      .eq('user_id', userId)
      .order('display_order', { ascending: false })
      .limit(1);
    
    displayOrder = existingTypes && existingTypes.length > 0 
      ? (existingTypes[0].display_order || 0) + 1 
      : 0;
  }
  
  console.log(`Adding visible type for user ${userId}, type ${typeId} with order ${displayOrder}`);
  
  return await supabase
    .from('visible_types')
    .insert({ 
      user_id: userId, 
      type_id: typeId, 
      display_order: displayOrder 
    })
    .select()
    .single();
};

export const removeUserVisibleType = async (id: string) => {
  return await supabase.from('visible_types').delete().eq('id', id);
};

export const updateUserVisibleTypesOrder = async (userId: string, typeNames: string[]) => {
  console.log(`Updating visible types order for user ${userId}:`, typeNames);
  
  // Get all current visible types for this user with their IDs
  const { data: visibleTypes, error } = await supabase
    .from('visible_types')
    .select('id, type_id, type:media_types(id, name)')
    .eq('user_id', userId);
    
  if (error) {
    console.error("Error fetching visible types:", error);
    throw error;
  }
  
  if (!visibleTypes || visibleTypes.length === 0) {
    console.warn("No visible types found to update order");
    return { success: false, error: "No visible types found" };
  }
  
  // Create a map of type names to visible_types.id for easy lookup
  const typeNameToVisibleTypeId = new Map();
  visibleTypes.forEach(vt => {
    if (vt.type && vt.type.name) {
      typeNameToVisibleTypeId.set(vt.type.name, vt.id);
    }
  });
  
  // Create batch update
  const updates = [];
  
  for (let i = 0; i < typeNames.length; i++) {
    const typeName = typeNames[i];
    const visibleTypeId = typeNameToVisibleTypeId.get(typeName);
    
    if (visibleTypeId) {
      updates.push({
        id: visibleTypeId,
        display_order: i
      });
    } else {
      console.warn(`Could not find visible type ID for type name: ${typeName}`);
    }
  }
  
  if (updates.length === 0) {
    console.warn("No updates to make for visible types order");
    return { success: false, error: "No valid types to update" };
  }
  
  console.log("Updating visible types with:", updates);
  
  // Perform the batch update
  const { data, error: updateError } = await supabase
    .from('visible_types')
    .upsert(updates)
    .select();
    
  if (updateError) {
    console.error("Error updating visible types order:", updateError);
    throw updateError;
  }
  
  return { success: true, data };
};
