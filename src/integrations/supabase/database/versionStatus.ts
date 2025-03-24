
import { supabase } from '../client';

export const getVersionStatus = async (userId: string, versionId: string) => {
  return await supabase.from('version_statuses')
    .select(`
      *,
      status:week_status_names(*)
    `)
    .eq('user_id', userId)
    .eq('version_id', versionId)
    .maybeSingle();
};

export const getVersionStatuses = async (userId: string) => {
  return await supabase.from('version_statuses')
    .select(`
      *,
      version:planning_versions(*),
      status:week_status_names(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
};

export const updateVersionStatus = async (userId: string, versionId: string, statusId: string) => {
  // Check if status already exists
  const { data } = await supabase.from('version_statuses')
    .select('*')
    .eq('user_id', userId)
    .eq('version_id', versionId)
    .maybeSingle();
  
  if (data) {
    return await supabase.from('version_statuses')
      .update({ version_status_id: statusId })
      .eq('id', data.id)
      .select()
      .single();
  } else {
    return await supabase.from('version_statuses')
      .insert({ user_id: userId, version_id: versionId, version_status_id: statusId })
      .select()
      .single();
  }
};

export const getUserVersionsForApproval = async (headId: string) => {
  // Get all users where this person is head
  const { data: users } = await supabase
    .from('users')
    .select('id, name')
    .eq('user_head_id', headId);
  
  if (!users || users.length === 0) {
    return { data: [], error: null };
  }
  
  const userIds = users.map(user => user.id);
  
  // Get version statuses for these users
  return await supabase.from('version_statuses')
    .select(`
      *,
      user:users(id, name),
      version:planning_versions(*),
      status:week_status_names(*)
    `)
    .in('user_id', userIds)
    .order('created_at', { ascending: false });
};
