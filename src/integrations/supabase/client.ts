
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// These environment variables should match your .env values and project settings
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://esmjkylqtpokeiuhcbnu.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzbWpreWxxdHBva2VpdWhjYm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwODI2MzQsImV4cCI6MjA1NjY1ODYzNH0.3hunwOnvAK6J6ZkgQn7Yw616Hnu9u15XdtuMCGDqjOI';

// Log the connection details (for debugging)
console.log('Connecting to Supabase at:', SUPABASE_URL);

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

// Add a connection test function
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    console.log('Supabase connection successful!');
    return { success: true };
  } catch (error) {
    console.error('Supabase connection error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown connection error'
    };
  }
};

/**
 * DATABASE SWITCHING GUIDE:
 * 
 * To switch to a local PostgreSQL database:
 * 
 * 1. Set up environment variables in your .env file:
 *    VITE_SUPABASE_URL=http://localhost:54321  // Local Supabase instance URL
 *    VITE_SUPABASE_KEY=your-local-anon-key    // Local Supabase anon key
 * 
 * 2. Make sure your local Supabase instance is running:
 *    - If using Supabase CLI: Run `supabase start` in your project directory
 *    - If using Docker: Ensure the Docker containers are running
 * 
 * 3. If you're using a completely different database system:
 *    - Create a database adapter layer in src/integrations/database
 *    - Implement the same interface/methods as the Supabase client
 *    - Update imports throughout the application
 */
