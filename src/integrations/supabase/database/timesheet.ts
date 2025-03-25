
import { db } from '../client';

// Week Hours
export const getWeekHours = async (userId: string, weekId: string) => {
  const result = await db.from('week_hours');
  return result.select(`
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
  if (hours === 0) {
    // Delete if hours is 0
    const fromResult = await db.from('week_hours');
    return fromResult.delete()
      .eq('user_id', userId)
      .eq('week_id', weekId)
      .eq('client_id', clientId)
      .eq('media_type_id', mediaTypeId);
  }

  // Check if entry exists
  const fromResult = await db.from('week_hours');
  const { data } = await fromResult
    .select('*')
    .eq('user_id', userId)
    .eq('week_id', weekId)
    .eq('client_id', clientId)
    .eq('media_type_id', mediaTypeId)
    .maybeSingle();

  if (data) {
    // Update existing entry
    const updateResult = await db.from('week_hours');
    return updateResult
      .update({ hours })
      .eq('id', data.id)
      .select()
      .single();
  } else {
    // Insert new entry
    const insertResult = await db.from('week_hours');
    return insertResult
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
export const updateHours = updateWeekHours;
