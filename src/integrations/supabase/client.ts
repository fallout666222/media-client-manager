
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// These environment variables should match your .env values and project settings
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_KEY;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  global: {
    headers: {
      'apikey': SUPABASE_PUBLISHABLE_KEY,
      'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
    }
  }
});

/**
 * DATABASE SWITCHING GUIDE:
 * 
 * To switch to a local PostgreSQL database:
 * 
 * 1. Set up environment variables in your .env file:
 *    VITE_SUPABASE_URL=http://localhost:54321  // Local Supabase instance URL
 *    VITE_SUPABASE_KEY=your-local-anon-key    // Local Supabase anon key
 * 
 * 2. If you're using a completely different database system:
 *    - Create a database adapter layer in src/integrations/database
 *    - Implement the same interface/methods as the Supabase client
 *    - Update imports throughout the application
 */
