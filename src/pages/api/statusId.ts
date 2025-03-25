
import { db } from "@/integrations/supabase/client";

export async function fetchStatusId(name: string) {
  try {
    const { data, error } = await db
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

// Create a function that can be called from the client-side
export async function handleStatusIdRequest(statusName: string) {
  console.log(`Fetching status ID for: ${statusName}`);
  
  const result = await fetchStatusId(statusName);
  return result;
}

// This will be used by the frontend to fetch status IDs
export default handleStatusIdRequest;
