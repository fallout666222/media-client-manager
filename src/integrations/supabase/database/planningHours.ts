
import { supabase } from '../client';

export const getPlanningVersions = async () => {
  return await supabase.from('planning_versions')
    .select('*')
    .order('name', { ascending: false });
};

export const getPlanningHours = async (userId: string, versionId: string) => {
  return await supabase.from('planning_hours')
    .select(`
      *,
      client:clients(*)
    `)
    .eq('user_id', userId)
    .eq('version_id', versionId);
};

export const updatePlanningHours = async (
  userId: string,
  versionId: string,
  clientId: string,
  month: string,
  hours: number
) => {
  // Check if hours entry already exists
  const { data } = await supabase.from('planning_hours')
    .select('*')
    .eq('user_id', userId)
    .eq('version_id', versionId)
    .eq('client_id', clientId)
    .eq('month', month)
    .maybeSingle();
  
  if (hours === 0) {
    // Delete the record if hours is 0
    if (data) {
      console.log(`Deleting planning hours for version ${versionId}, client ${clientId}, month ${month}`);
      return await supabase.from('planning_hours')
        .delete()
        .eq('id', data.id);
    }
    // If no record exists with 0 hours, nothing to do
    return { data: null };
  } else if (data) {
    // Update existing record with non-zero hours
    return await supabase.from('planning_hours')
      .update({ hours })
      .eq('id', data.id)
      .select()
      .single();
  } else {
    // Insert new record with non-zero hours
    return await supabase.from('planning_hours')
      .insert({
        user_id: userId,
        version_id: versionId,
        client_id: clientId,
        month: month,
        hours
      })
      .select()
      .single();
  }
};
