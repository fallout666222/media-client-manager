
import { supabase } from "@/integrations/supabase/client";

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

export default async function handler(req: Request) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { 
        status: 405,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
  
  const url = new URL(req.url);
  const headId = url.searchParams.get('headId');
  
  if (!headId) {
    return new Response(
      JSON.stringify({ error: 'Head ID is required' }), 
      { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
  
  const result = await fetchUserVersionsForApproval(headId);
  
  return new Response(
    JSON.stringify(result), 
    { 
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      status: result.error ? 500 : 200
    }
  );
}
