
import { supabase } from '../client';
import { PlanningVersion } from '@/types/planning';

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

// New function to create a planning version
export const createPlanningVersion = async (name: string, year: string) => {
  return await supabase
    .from('planning_versions')
    .insert({
      name,
      year,
      q1_locked: false,
      q2_locked: false,
      q3_locked: false,
      q4_locked: false
    })
    .select()
    .single();
};

// New function to update a planning version's lock status
export const updatePlanningVersionLocks = async (
  versionId: string, 
  updates: Partial<PlanningVersion>
) => {
  return await supabase
    .from('planning_versions')
    .update(updates)
    .eq('id', versionId)
    .select()
    .single();
};

// Function to fill planning with actual hours data (from week_hours)
export const fillActualHours = async (versionId: string, year: string) => {
  return await supabase.rpc('fill_actual_hours', {
    p_version_id: versionId,
    p_year: year
  });
};
