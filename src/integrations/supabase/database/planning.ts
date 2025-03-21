
import { supabase } from '../client';

export const getPlanningVersions = async () => {
  return await supabase
    .from('planning_versions')
    .select('*')
    .order('year', { ascending: false });
};

export const getPlanningHours = async (versionId: string, userId: string) => {
  return await supabase
    .from('planning_hours')
    .select(`
      *,
      client:clients(*)
    `)
    .eq('version_id', versionId)
    .eq('user_id', userId);
};

export const updatePlanningHours = async (
  versionId: string,
  userId: string,
  clientId: string,
  month: string,
  hours: number
) => {
  // Check if entry already exists
  const { data } = await supabase
    .from('planning_hours')
    .select('*')
    .eq('version_id', versionId)
    .eq('user_id', userId)
    .eq('client_id', clientId)
    .eq('month', month)
    .maybeSingle();
  
  if (data) {
    // Update existing record
    return await supabase
      .from('planning_hours')
      .update({ hours })
      .eq('id', data.id)
      .select()
      .single();
  } else {
    // Insert new record
    return await supabase
      .from('planning_hours')
      .insert({
        version_id: versionId,
        user_id: userId,
        client_id: clientId,
        month: month,
        hours
      })
      .select()
      .single();
  }
};
