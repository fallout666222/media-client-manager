
import { supabase } from '../client';

// Visible Clients
export const getUserVisibleClients = async (userId: string) => {
  return await supabase.from('visible_clients').select(`
    *,
    client:clients(*)
  `).eq('user_id', userId).order('display_order', { ascending: true });
};

export const addUserVisibleClient = async (userId: string, clientId: string) => {
  // Get the highest display_order value
  const { data: existingClients } = await supabase
    .from('visible_clients')
    .select('display_order')
    .eq('user_id', userId)
    .order('display_order', { ascending: false })
    .limit(1);

  const nextOrder = existingClients && existingClients.length > 0 ? 
    (existingClients[0].display_order || 0) + 1 : 0;

  return await supabase
    .from('visible_clients')
    .insert({ 
      user_id: userId, 
      client_id: clientId, 
      display_order: nextOrder 
    })
    .select()
    .single();
};

export const removeUserVisibleClient = async (id: string) => {
  return await supabase.from('visible_clients').delete().eq('id', id);
};

export const updateVisibleClientsOrder = async (userId: string, clientIds: string[]) => {
  // Get mapping of client names to IDs
  const { data: clients } = await supabase.from('clients').select('id, name');
  if (!clients) return { error: { message: "Failed to fetch clients" } };
  
  const clientMap = new Map(clients.map(c => [c.name, c.id]));
  
  // Get existing visible client records
  const { data: visibleClients } = await supabase
    .from('visible_clients')
    .select('id, client_id')
    .eq('user_id', userId);
  
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
  
  return { data: true };
};

// Visible Types
export const getUserVisibleTypes = async (userId: string) => {
  return await supabase.from('visible_types').select(`
    *,
    type:media_types(*)
  `).eq('user_id', userId).order('display_order', { ascending: true });
};

export const addUserVisibleType = async (userId: string, typeId: string) => {
  // Get the highest display_order value
  const { data: existingTypes } = await supabase
    .from('visible_types')
    .select('display_order')
    .eq('user_id', userId)
    .order('display_order', { ascending: false })
    .limit(1);

  const nextOrder = existingTypes && existingTypes.length > 0 ? 
    (existingTypes[0].display_order || 0) + 1 : 0;

  return await supabase
    .from('visible_types')
    .insert({ 
      user_id: userId, 
      type_id: typeId, 
      display_order: nextOrder 
    })
    .select()
    .single();
};

export const removeUserVisibleType = async (id: string) => {
  return await supabase.from('visible_types').delete().eq('id', id);
};

export const updateVisibleTypesOrder = async (userId: string, typeNames: string[]) => {
  // Get mapping of media type names to IDs
  const { data: mediaTypes } = await supabase.from('media_types').select('id, name');
  if (!mediaTypes) return { error: { message: "Failed to fetch media types" } };
  
  const typeMap = new Map(mediaTypes.map(t => [t.name, t.id]));
  
  // Get existing visible type records
  const { data: visibleTypes } = await supabase
    .from('visible_types')
    .select('id, type_id')
    .eq('user_id', userId);
  
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
  
  return { data: true };
};
