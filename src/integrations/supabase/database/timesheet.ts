
import { db } from '../client';

// Week Hours
export const getWeekHours = async (userId: string, weekId: string) => {
  const query = db.from('week_hours')
    .select(`
      *,
      client:clients(*),
      media_type:media_types(*)
    `)
    .eq('user_id', userId)
    .eq('week_id', weekId);
  
  return await query;
};

export const updateWeekHours = async (
  userId: string,
  weekId: string,
  clientId: string,
  mediaTypeId: string,
  hours: number
) => {
  if (hours === 0) {
    // Delete if hours is 0
    const deleteQuery = db.from('week_hours')
      .delete()
      .eq('user_id', userId)
      .eq('week_id', weekId)
      .eq('client_id', clientId)
      .eq('media_type_id', mediaTypeId);
    
    return await deleteQuery;
  }

  // Check if entry exists
  const checkQuery = db.from('week_hours')
    .select('*')
    .eq('user_id', userId)
    .eq('week_id', weekId)
    .eq('client_id', clientId)
    .eq('media_type_id', mediaTypeId)
    .maybeSingle();
  
  const { data } = await checkQuery;

  if (data) {
    // Update existing entry
    const updateQuery = db.from('week_hours')
      .update({ hours })
      .eq('id', data.id)
      .select()
      .single();
    
    return await updateQuery;
  } else {
    // Insert new entry
    const insertQuery = db.from('week_hours')
      .insert({
        user_id: userId,
        week_id: weekId,
        client_id: clientId,
        media_type_id: mediaTypeId,
        hours
      })
      .select()
      .single();
    
    return await insertQuery;
  }
};

// A more generic updateHours function if needed
export const updateHours = updateWeekHours;
