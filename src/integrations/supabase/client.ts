
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// These environment variables should match your .env values and project settings
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://esmjkylqtpokeiuhcbnu.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzbWpreWxxdHBva2VpdWhjYm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwODI2MzQsImV4cCI6MjA1NjY1ODYzNH0.3hunwOnvAK6J6ZkgQn7Yw616Hnu9u15XdtuMCGDqjOI';

// Log the connection details (for debugging)
console.log('Connecting to Supabase at:', SUPABASE_URL);

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  global: {
    headers: {
      'apikey': SUPABASE_PUBLISHABLE_KEY,
      'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
    }
  },
  db: {
    schema: 'public' as const // Fix for the db.schema type error
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
};

// Create the Supabase client with proper type safety
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, options);

// Custom fetch function with timeout
export const fetchWithTimeout = (url: string, options: RequestInit & { timeout?: number }) => {
  const { timeout = 30000, ...fetchOptions } = options;
  return fetch(url, {
    ...fetchOptions,
    signal: AbortSignal.timeout(timeout)
  });
};

// Add a connection test function with better error handling
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      console.error('Supabase connection error details:', error);
      return { 
        success: false, 
        error: error.message,
        details: {
          code: error.code,
          hint: error.hint,
          details: error.details
        }
      };
    }
    console.log('Supabase connection successful!');
    return { success: true };
  } catch (error) {
    console.error('Supabase connection error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
    return { 
      success: false, 
      error: errorMessage,
      details: {
        type: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
      }
    };
  }
};

// Performance monitoring for Supabase requests
export const monitorRequestPerformance = () => {
  // Create stats object to track performance
  if (typeof window !== 'undefined') {
    // Add field for tracking
    window._supabaseStats = {
      requests: 0,
      errors: 0,
      avgResponseTime: 0,
      totalResponseTime: 0
    };
  }
  
  // Create an interceptor for monitoring requests
  // We'll use our own counter system since we can't access internal rest property
  const originalFetch = window.fetch;
  
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    // Only intercept Supabase requests
    const url = input.toString();
    if (!url.includes(SUPABASE_URL)) {
      return originalFetch(input, init);
    }
    
    if (typeof window === 'undefined') return originalFetch(input, init);
    
    const startTime = performance.now();
    try {
      // Increase request counter
      window._supabaseStats.requests++;
      const response = await originalFetch(input, init);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      // Update stats
      window._supabaseStats.totalResponseTime += responseTime;
      window._supabaseStats.avgResponseTime = window._supabaseStats.totalResponseTime / window._supabaseStats.requests;
      
      return response;
    } catch (error) {
      const endTime = performance.now();
      // Increase error counter
      window._supabaseStats.errors++;
      console.error(`Request to ${url} failed after ${endTime - startTime}ms`, error);
      throw error;
    }
  };
  
  return supabase;
};

// Initialize performance monitoring in production
if (import.meta.env.PROD) {
  monitorRequestPerformance();
}

/**
 * Helper function to safely access properties of query results
 * This helps prevent the "Property 'X' does not exist on type 'SelectQueryError'" errors
 */
export function safeAccess<T extends Record<string, any>, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined {
  if (!obj) return undefined;
  if ('error' in obj && obj.error) return undefined;
  return obj[key];
}

/**
 * Helper function to handle Supabase query results safely
 * Ensures we check for errors before accessing data properties
 */
export function handleQueryResult<T>(result: { data: T | null; error: Error | null }): T | null {
  if (result.error) {
    console.error('Supabase query error:', result.error);
    return null;
  }
  return result.data;
}

// Add TypeScript declaration for _supabaseStats
declare global {
  interface Window {
    _supabaseStats: {
      requests: number;
      errors: number;
      avgResponseTime: number;
      totalResponseTime: number;
    };
  }
}

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
