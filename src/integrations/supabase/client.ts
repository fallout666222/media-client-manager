
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// These values can be overridden by environment variables
const SUPABASE_URL = "https://esmjkylqtpokeiuhcbnu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzbWpreWxxdHBva2VpdWhjYm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwODI2MzQsImV4cCI6MjA1NjY1ODYzNH0.3hunwOnvAK6J6ZkgQn7Yw616Hnu9u15XdtuMCGDqjOI";

// Use environment variables if available, otherwise use defaults
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || SUPABASE_PUBLISHABLE_KEY;

console.log('Initializing Supabase client with URL:', supabaseUrl);

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

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

// Debug helper to check connection status
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('custom_weeks').select('count');
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    console.log('Supabase connection successful');
    return true;
  } catch (err) {
    console.error('Failed to check Supabase connection:', err);
    return false;
  }
};
