
import { supabase } from '../client';

// Week Hours
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
  
  if (hours === 0) {
    // Delete if hours is 0
    return await supabase.from('week_hours')
      .delete()
      .eq('user_id', userId)
      .eq('week_id', weekId)
      .eq('client_id', clientId)
      .eq('media_type_id', mediaTypeId);
  }

  // Check if entry exists
  const { data } = await supabase.from('week_hours')
    .select('*')
    .eq('user_id', userId)
    .eq('week_id', weekId)
    .eq('client_id', clientId)
    .eq('media_type_id', mediaTypeId)
    .maybeSingle();

  if (data) {
    // Update existing entry
    return await supabase.from('week_hours')
      .update({ hours })
      .eq('id', data.id)
      .select()
      .single();
  } else {
    // Insert new entry
    return await supabase.from('week_hours')
      .insert({
        user_id: userId,
        week_id: weekId,
        client_id: clientId,
        media_type_id: mediaTypeId,
        hours
      })
      .select()
      .single();
  }
};

// A more generic updateHours function if needed
export const updateHours = async (userId: string, weekId: string, clientName: string, mediaTypeName: string, hours: number) => {
  try {
    // Set the user_id for RLS
    await supabase.rpc('set_user_context', { user_id: userId });
    
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
