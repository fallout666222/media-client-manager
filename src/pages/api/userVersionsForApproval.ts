
import { supabase } from "@/integrations/supabase/client";
import { NextApiRequest, NextApiResponse } from "next";

export async function fetchUserVersionsForApproval(headId: string) {
  try {
    // Get all users where this person is head
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name')
      .eq('user_head_id', headId);
    
    if (usersError) throw usersError;
    
    if (!users || users.length === 0) {
      return { data: [] };
    }
    
    const userIds = users.map(user => user.id);
    
    // Get version statuses for these users
    const { data, error } = await supabase.from('version_statuses')
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

// Export a default handler function that will be used by Next.js
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers to allow cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const headId = req.query.headId as string || '';
  
  const result = await fetchUserVersionsForApproval(headId);
  
  if (result.error) {
    res.status(500).json(result);
  } else {
    res.status(200).json(result);
  }
}
