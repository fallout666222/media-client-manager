
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
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  // Оптимизации для высокой нагрузки
  fetch: (url, options) => {
    const fetchOptions = {
      ...options,
      // Добавляем timeout, чтобы избежать "зависших" запросов
      signal: AbortSignal.timeout(30000), // 30 секунд timeout
    };
    return fetch(url, fetchOptions);
  }
});

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
          status: error.status
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

// Performance monitoring functions
export const monitorRequestPerformance = () => {
  // Включить мониторинг времени выполнения запросов
  if (typeof window !== 'undefined') {
    // @ts-ignore - добавляем поле для отслеживания
    window._supabaseStats = {
      requests: 0,
      errors: 0,
      avgResponseTime: 0,
      totalResponseTime: 0
    };
  }
  
  const originalFetch = supabase.rest.fetch.bind(supabase.rest);
  
  // Переопределяем метод fetch для измерения производительности
  supabase.rest.fetch = async (url: string, options: any) => {
    if (typeof window === 'undefined') return originalFetch(url, options);
    
    const startTime = performance.now();
    try {
      // @ts-ignore - увеличиваем счетчик запросов
      window._supabaseStats.requests++;
      const response = await originalFetch(url, options);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      // @ts-ignore - обновляем статистику
      window._supabaseStats.totalResponseTime += responseTime;
      // @ts-ignore
      window._supabaseStats.avgResponseTime = window._supabaseStats.totalResponseTime / window._supabaseStats.requests;
      
      return response;
    } catch (error) {
      const endTime = performance.now();
      // @ts-ignore - увеличиваем счетчик ошибок
      window._supabaseStats.errors++;
      console.error(`Request to ${url} failed after ${endTime - startTime}ms`, error);
      throw error;
    }
  };
  
  return supabase;
};

// Инициализация мониторинга производительности в production
if (import.meta.env.PROD) {
  monitorRequestPerformance();
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
