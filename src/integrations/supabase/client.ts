
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get environment variables with fallbacks
const USE_LOCAL_DB = import.meta.env.VITE_USE_LOCAL_DB === 'true';
const USE_DIRECT_PG = import.meta.env.VITE_USE_DIRECT_PG === 'true';

// Local Supabase configuration
const LOCAL_SUPABASE_URL = import.meta.env.VITE_LOCAL_SUPABASE_URL || 'http://localhost:54321';
const LOCAL_SUPABASE_KEY = import.meta.env.VITE_LOCAL_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzbWpreWxxdHBva2VpdWhjYm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwODI2MzQsImV4cCI6MjA1NjY1ODYzNH0.3hunwOnvAK6J6ZkgQn7Yw616Hnu9u15XdtuMCGDqjOI';

// Remote Supabase configuration
const REMOTE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://esmjkylqtpokeiuhcbnu.supabase.co';
const REMOTE_SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzbWpreWxxdHBva2VpdWhjYm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwODI2MzQsImV4cCI6MjA1NjY1ODYzNH0.3hunwOnvAK6J6ZkgQn7Yw616Hnu9u15XdtuMCGDqjOI';

// Determine connection mode
let connectionMode = 'REMOTE';
if (USE_LOCAL_DB) {
  connectionMode = 'LOCAL';
}
if (USE_DIRECT_PG) {
  connectionMode = 'BROWSER_PG_NOT_SUPPORTED';
}

// Log the connection details (only in development)
if (import.meta.env.DEV) {
  console.log(`Database connection mode: ${connectionMode}`);
}

// Create Supabase client
let supabaseClient = null;

// Use local or remote configuration based on environment variable
const SUPABASE_URL = USE_LOCAL_DB ? LOCAL_SUPABASE_URL : REMOTE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = USE_LOCAL_DB ? LOCAL_SUPABASE_KEY : REMOTE_SUPABASE_KEY;

// Create the supabase client with enhanced security
supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
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

// Enhanced database client that works with Supabase
class DatabaseClient {
  private pgConditions: { column: string; operator: string; value: any }[] = [];
  private pgOrderBy: { column: string; direction: string } | null = null;
  private pgLimit: number | null = null;
  private pgColumns: string = '*';
  private currentTable: string = '';

  async from(table: string) {
    this.currentTable = table;
    this.pgConditions = [];
    this.pgOrderBy = null;
    this.pgLimit = null;
    this.pgColumns = '*';

    if (supabaseClient) {
      // For Supabase, we can use the existing from method
      // We need to cast to any to avoid type errors from string argument
      return supabaseClient.from(table as any);
    }
    
    throw new Error('No database connection available');
  }
}

// Instantiate and export the client
export const db = new DatabaseClient();

// For backward compatibility, still export supabase client
export const supabase = supabaseClient;

// Add a connection test function
export const testConnection = async () => {
  try {
    if (USE_DIRECT_PG) {
      console.error('Direct PostgreSQL is not supported in browser environments');
      return { 
        success: false, 
        environment: 'direct_postgres_not_supported',
        error: 'Direct PostgreSQL connections are not supported in browser environments. Please use Supabase instead.'
      };
    } else if (supabaseClient) {
      const { data, error } = await supabaseClient.from('users').select('id').limit(1);
      if (error) throw error;
      console.log('Supabase connection successful!');
      return { success: true, environment: USE_LOCAL_DB ? 'local' : 'remote' };
    } else {
      throw new Error('No database connection available');
    }
  } catch (error) {
    console.error('Database connection error:', error);
    return { 
      success: false, 
      environment: USE_LOCAL_DB ? 'local' : 'remote',
      error: error instanceof Error ? error.message : 'Unknown connection error'
    };
  }
};

/**
 * ВАЖНОЕ ПРИМЕЧАНИЕ:
 * 
 * Прямое подключение к PostgreSQL НЕ ПОДДЕРЖИВАЕТСЯ в браузерных средах.
 * 
 * Для подключения к PostgreSQL напрямую следует использовать серверное окружение
 * (Node.js, Edge Functions, API Routes).
 * 
 * В браузерном приложении рекомендуется использовать Supabase для доступа к базе данных.
 */
