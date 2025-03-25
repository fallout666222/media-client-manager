
import { supabase } from '../client';

export const getWeekHours = async (userId: string, weekId: string) => {
  // Set the user_id for RLS
  await supabase.rpc('set_user_context', { user_id: userId });
  
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
  // Set the user_id for RLS
  await supabase.rpc('set_user_context', { user_id: userId });
  
  // Check if hours entry already exists
  const { data } = await supabase.from('week_hours')
    .select('*')
    .eq('user_id', userId)
    .eq('week_id', weekId)
    .eq('client_id', clientId)
    .eq('media_type_id', mediaTypeId)
    .maybeSingle();
  
  if (hours === 0) {
    // Delete the record if hours is 0
    if (data) {
      console.log(`Deleting hours record for week ${weekId}, client ${clientId}, media ${mediaTypeId}`);
      return await supabase.from('week_hours')
        .delete()
        .eq('id', data.id);
    }
    // If no record exists with 0 hours, nothing to do
    return { data: null };
  } else if (data) {
    // Update existing record with non-zero hours
    return await supabase.from('week_hours')
      .update({ hours })
      .eq('id', data.id)
      .select()
      .single();
  } else {
    // Insert new record with non-zero hours
    return await supabase.from('week_hours')
      .insert({ user_id: userId, week_id: weekId, client_id: clientId, media_type_id: mediaTypeId, hours })
      .select()
      .single();
  }
};

// Update this function to handle zero hours by deleting records
export const updateHours = async (userId: string, weekId: string, clientName: string, mediaTypeName: string, hours: number) => {
  try {
    // Set the user_id for RLS
    await supabase.rpc('set_user_context', { user_id: userId });
    
    // Get the client and media type IDs from their names
    const { getClients } = await import('./client');
    const { getMediaTypes } = await import('./mediaType');
    
    const { data: clientsData } = await getClients();
    const { data: mediaTypesData } = await getMediaTypes();
    
    const clientObj = clientsData?.find(c => c.name === clientName);
    const mediaTypeObj = mediaTypesData?.find(m => m.name === mediaTypeName);
    
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
