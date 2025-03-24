
import { supabase } from "@/integrations/supabase/client";

export async function fetchStatusId(name: string) {
  try {
    const { data, error } = await supabase
      .from('week_status_names')
      .select('id')
      .eq('name', name)
      .single();
    
    if (error) throw error;
    
    return { data };
  } catch (error) {
    console.error(`Error fetching status ID for ${name}:`, error);
    return { error };
  }
}

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const statusName = url.searchParams.get('name') || '';
  
  const result = await fetchStatusId(statusName);
  
  return new Response(
    JSON.stringify(result), 
    { 
      headers: { 'Content-Type': 'application/json' },
      status: result.error ? 500 : 200
    }
  );
}
