
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get environment variables with fallbacks
const USE_LOCAL_DB = import.meta.env.VITE_USE_LOCAL_DB === 'true';

// Local Supabase configuration
const LOCAL_SUPABASE_URL = import.meta.env.VITE_LOCAL_SUPABASE_URL || 'http://localhost:54321';
const LOCAL_SUPABASE_KEY = import.meta.env.VITE_LOCAL_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzbWpreWxxdHBva2VpdWhjYm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwODI2MzQsImV4cCI6MjA1NjY1ODYzNH0.3hunwOnvAK6J6ZkgQn7Yw616Hnu9u15XdtuMCGDqjOI';

// Remote Supabase configuration
const REMOTE_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://esmjkylqtpokeiuhcbnu.supabase.co';
const REMOTE_SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzbWpreWxxdHBva2VpdWhjYm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwODI2MzQsImV4cCI6MjA1NjY1ODYzNH0.3hunwOnvAK6J6ZkgQn7Yw616Hnu9u15XdtuMCGDqjOI';

// Use local or remote configuration based on environment variable
const SUPABASE_URL = USE_LOCAL_DB ? LOCAL_SUPABASE_URL : REMOTE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = USE_LOCAL_DB ? LOCAL_SUPABASE_KEY : REMOTE_SUPABASE_KEY;

// Log the connection details (only in development)
if (import.meta.env.DEV) {
  console.log(`Connecting to Supabase at: ${SUPABASE_URL} (${USE_LOCAL_DB ? 'LOCAL' : 'REMOTE'})`);
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
    return { success: true, environment: USE_LOCAL_DB ? 'local' : 'remote' };
  } catch (error) {
    console.error('Supabase connection error:', error);
    return { 
      success: false, 
      environment: USE_LOCAL_DB ? 'local' : 'remote',
      error: error instanceof Error ? error.message : 'Unknown connection error'
    };
  }
};

/**
 * ЛОКАЛЬНЫЙ POSTGRESQL С SUPABASE CLI
 * 
 * Для работы с локальным PostgreSQL рекомендуется использовать Supabase CLI:
 * 
 * 1. Установите Supabase CLI:
 *    - npm install -g supabase
 * 
 * 2. Инициализируйте Supabase в своем проекте:
 *    - supabase init
 * 
 * 3. Запустите локальный Supabase:
 *    - supabase start
 * 
 * 4. Установите переменную окружения в файле .env:
 *    - VITE_USE_LOCAL_DB=true
 * 
 * 5. Если вам нужно импортировать данные из существующей базы данных Supabase:
 *    - supabase db pull
 * 
 * 6. Для остановки локального сервера Supabase:
 *    - supabase stop
 * 
 * Локальный Supabase обеспечивает REST API, совместимый с облачной версией,
 * что позволяет использовать тот же клиент для взаимодействия с ним.
 */
