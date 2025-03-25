
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get environment variables with fallbacks and prioritize local development settings
const isLocalDev = import.meta.env.MODE === 'development' && import.meta.env.VITE_USE_LOCAL_DB === 'true';

// Local PostgreSQL configuration
const LOCAL_SUPABASE_URL = import.meta.env.VITE_LOCAL_SUPABASE_URL || 'http://localhost:54321';
const LOCAL_SUPABASE_KEY = import.meta.env.VITE_LOCAL_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzbWpreWxxdHBva2VpdWhjYm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwODI2MzQsImV4cCI6MjA1NjY1ODYzNH0.3hunwOnvAK6J6ZkgQn7Yw616Hnu9u15XdtuMCGDqjOI';

// Remote Supabase configuration
const REMOTE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://esmjkylqtpokeiuhcbnu.supabase.co';
const REMOTE_SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzbWpreWxxdHBva2VpdWhjYm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwODI2MzQsImV4cCI6MjA1NjY1ODYzNH0.3hunwOnvAK6J6ZkgQn7Yw616Hnu9u15XdtuMCGDqjOI';

// Use local or remote configuration based on environment
const SUPABASE_URL = isLocalDev ? LOCAL_SUPABASE_URL : REMOTE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = isLocalDev ? LOCAL_SUPABASE_KEY : REMOTE_SUPABASE_KEY;

// Log the connection details (only in development)
if (import.meta.env.DEV) {
  console.log(`Connecting to Supabase at: ${SUPABASE_URL} (${isLocalDev ? 'LOCAL' : 'REMOTE'})`);
}

// Create and export the supabase client with enhanced security
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'apikey': SUPABASE_PUBLISHABLE_KEY,
      'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      'X-Client-Info': 'timesheet-app',
    },
    // Add fetch customization for enhanced security
    fetch: (url, options) => {
      // Add security headers to prevent common exploits
      const secureOptions = {
        ...options,
        headers: {
          ...options?.headers,
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'no-referrer-when-downgrade',
        },
      };
      return fetch(url, secureOptions);
    },
  },
});

// Add a connection test function with better error handling
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    console.log('Supabase connection successful!');
    return { success: true, environment: isLocalDev ? 'local' : 'remote' };
  } catch (error) {
    console.error('Supabase connection error:', error);
    return { 
      success: false, 
      environment: isLocalDev ? 'local' : 'remote',
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
 *    VITE_USE_LOCAL_DB=true
 *    VITE_LOCAL_SUPABASE_URL=http://localhost:54321  // Local Supabase instance URL
 *    VITE_LOCAL_SUPABASE_KEY=your-local-anon-key    // Local Supabase anon key
 * 
 * 2. Make sure your local Supabase instance is running:
 *    - If using Supabase CLI: Run `supabase start` in your project directory
 *    - If using Docker: Ensure the Docker containers are running
 *    - The schema should match the production database structure
 * 
 * 3. For security best practices:
 *    - Never store sensitive API keys in client-side code
 *    - Use Row Level Security (RLS) policies in your database
 *    - Implement proper authentication before accessing sensitive data
 */
