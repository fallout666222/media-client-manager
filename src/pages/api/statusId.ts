
import { supabase } from "@/integrations/supabase/client";

export async function fetchStatusId(name: string) {
  try {
    const { data, error } = await supabase
      .from('week_status_names')
      .select('id')
      .eq('name', name)
      .maybeSingle();
    
    if (error) throw error;
    
    return { data };
  } catch (error) {
    console.error(`Error fetching status ID for ${name}:`, error);
    return { error };
  }
}

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const url = new URL(req.url);
  const statusName = url.searchParams.get('name');
  
  if (!statusName) {
    return new Response(JSON.stringify({ error: 'Status name is required' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const result = await fetchStatusId(statusName);
  
  return new Response(
    JSON.stringify(result), 
    { 
      headers: { 'Content-Type': 'application/json' },
      status: result.error ? 500 : 200
    }
  );
}
