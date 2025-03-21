
import { supabase } from '../client';
import { getClients } from './client';

// Get all planning versions
export const getPlanningVersions = async () => {
  return await supabase
    .from('planning_versions')
    .select('*')
    .order('created_at', { ascending: false });
};

// Get a specific planning version
export const getPlanningVersion = async (versionId: string) => {
  return await supabase
    .from('planning_versions')
    .select('*')
    .eq('id', versionId)
    .maybeSingle();
};

// Create a new planning version
export const createPlanningVersion = async (name: string, year: string) => {
  return await supabase
    .from('planning_versions')
    .insert({
      name,
      year
    })
    .select()
    .single();
};

// Update a planning version's locked status
export const updatePlanningVersionLocks = async (
  versionId: string, 
  q1Locked: boolean, 
  q2Locked: boolean, 
  q3Locked: boolean, 
  q4Locked: boolean
) => {
  return await supabase
    .from('planning_versions')
    .update({
      q1_locked: q1Locked,
      q2_locked: q2Locked,
      q3_locked: q3Locked,
      q4_locked: q4Locked
    })
    .eq('id', versionId)
    .select()
    .single();
};

// Fill planning with actual data for locked quarters
export const fillActualHours = async (versionId: string, year: string) => {
  // Call the stored procedure
  const { error } = await supabase.rpc('fill_actual_hours', {
    p_version_id: versionId,
    p_year: year
  });
  
  if (error) {
    console.error('Error filling actual hours:', error);
    throw error;
  }
  
  return { success: true };
};

// Get planning hours for a user and version
export const getPlanningHours = async (userId: string, versionId: string) => {
  return await supabase
    .from('planning_hours')
    .select(`
      *,
      client:clients(*)
    `)
    .eq('user_id', userId)
    .eq('version_id', versionId);
};

// Get all planning hours for a version (admin only)
export const getAllPlanningHours = async (versionId: string) => {
  return await supabase
    .from('planning_hours')
    .select(`
      *,
      client:clients(*),
      user:users(*)
    `)
    .eq('version_id', versionId);
};

// Update planning hours
export const updatePlanningHours = async (
  userId: string,
  versionId: string,
  clientId: string,
  month: string,
  hours: number
) => {
  // Check if entry already exists
  const { data } = await supabase
    .from('planning_hours')
    .select('*')
    .eq('user_id', userId)
    .eq('version_id', versionId)
    .eq('client_id', clientId)
    .eq('month', month)
    .maybeSingle();
  
  if (data) {
    // Update existing entry
    return await supabase
      .from('planning_hours')
      .update({ hours })
      .eq('id', data.id)
      .select()
      .single();
  } else {
    // Insert new entry
    return await supabase
      .from('planning_hours')
      .insert({
        user_id: userId,
        version_id: versionId,
        client_id: clientId,
        month,
        hours
      })
      .select()
      .single();
  }
};

// Update planning hours by client name
export const updatePlanningHoursByName = async (
  userId: string,
  versionId: string,
  clientName: string,
  month: string,
  hours: number
) => {
  try {
    // Get client data
    const { data: clientsData } = await getClients();
    
    const clientObj = clientsData?.find(c => c.name === clientName);
    
    if (!clientObj) {
      console.error('Client not found', { clientName });
      throw new Error('Client not found');
    }
    
    // Use the existing updatePlanningHours function with the ID
    return await updatePlanningHours(userId, versionId, clientObj.id, month, hours);
  } catch (error) {
    console.error('Error in updatePlanningHoursByName:', error);
    throw error;
  }
};
