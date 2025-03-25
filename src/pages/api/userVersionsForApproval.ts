
import { db } from "@/integrations/supabase/client";

export async function fetchUserVersionsForApproval(headId: string) {
  try {
    // Get all users where this person is head
    const { data: users, error: usersError } = await db
      .from('users')
      .select('id, name')
      .eq('user_head_id', headId);
    
    if (usersError) throw usersError;
    
    if (!users || users.length === 0) {
      return { data: [] };
    }
    
    const userIds = users.map(user => user.id);
    
    // Get version statuses for these users
    const { data, error } = await db.from('version_statuses')
      .select(`
        *,
        user:users(id, name),
        version:planning_versions(*),
        status:week_status_names(*)
      `)
      .in('user_id', userIds)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return { data };
  } catch (error) {
    console.error('Error fetching versions for approval:', error);
    return { error };
  }
}

// Create a function that can be called from the client-side
export async function handleUserVersionsForApprovalRequest(headId: string) {
  const result = await fetchUserVersionsForApproval(headId);
  return result;
}

// This will be used by the frontend to fetch versions for approval
export default handleUserVersionsForApprovalRequest;
