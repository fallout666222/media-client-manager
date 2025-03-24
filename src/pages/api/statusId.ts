
import { supabase } from "@/integrations/supabase/client";
import { NextApiRequest, NextApiResponse } from "next";

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

  const statusName = req.query.name as string || '';
  console.log(`Fetching status ID for: ${statusName}`);
  
  const result = await fetchStatusId(statusName);
  
  if (result.error) {
    res.status(500).json(result);
  } else {
    res.status(200).json(result);
  }
}
