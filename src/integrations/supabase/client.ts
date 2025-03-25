import { createClient } from '@supabase/supabase-js';
import { Pool, QueryResult } from 'pg';
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

// Direct PostgreSQL configuration
const PG_HOST = import.meta.env.VITE_PG_HOST || 'localhost';
const PG_PORT = Number(import.meta.env.VITE_PG_PORT || '5432');
const PG_DATABASE = import.meta.env.VITE_PG_DATABASE || 'postgres';
const PG_USER = import.meta.env.VITE_PG_USER || 'postgres';
const PG_PASSWORD = import.meta.env.VITE_PG_PASSWORD || 'postgres';

// Determine connection mode
let connectionMode = 'REMOTE';
if (USE_LOCAL_DB) {
  connectionMode = 'LOCAL';
}
if (USE_DIRECT_PG) {
  connectionMode = 'DIRECT_PG';
}

// Log the connection details (only in development)
if (import.meta.env.DEV) {
  console.log(`Database connection mode: ${connectionMode}`);
}

// Create PostgreSQL Pool for direct connection
let pgPool: Pool | null = null;
if (USE_DIRECT_PG) {
  pgPool = new Pool({
    host: PG_HOST,
    port: PG_PORT,
    database: PG_DATABASE,
    user: PG_USER,
    password: PG_PASSWORD,
    ssl: import.meta.env.VITE_PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });
  
  // Test connection
  pgPool.on('error', (err) => {
    console.error('Unexpected PostgreSQL error:', err);
  });
}

// Create Supabase client when not using direct PostgreSQL
let supabase: ReturnType<typeof createClient<Database>> | null = null;
if (!USE_DIRECT_PG) {
  // Use local or remote configuration based on environment variable
  const SUPABASE_URL = USE_LOCAL_DB ? LOCAL_SUPABASE_URL : REMOTE_SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = USE_LOCAL_DB ? LOCAL_SUPABASE_KEY : REMOTE_SUPABASE_KEY;

  // Create the supabase client with enhanced security
  supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
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
}

// Direct PostgreSQL query helper
export const directQuery = async (query: string, params: any[] = []): Promise<QueryResult> => {
  if (!pgPool) {
    throw new Error('Direct PostgreSQL connection not configured');
  }
  
  try {
    const client = await pgPool.connect();
    try {
      return await client.query(query, params);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('PostgreSQL query error:', error);
    throw error;
  }
};

// Enhanced database client that works with both Supabase and direct PostgreSQL
class DatabaseClient {
  async from(table: string) {
    if (USE_DIRECT_PG && pgPool) {
      return {
        select: async (columns = '*') => {
          try {
            const result = await directQuery(`SELECT ${columns} FROM ${table}`);
            return { data: result.rows, error: null };
          } catch (error) {
            return { data: null, error };
          }
        },
        insert: async (values: any, options: { select?: boolean } = {}) => {
          try {
            const columns = Object.keys(values).join(', ');
            const placeholders = Object.keys(values).map((_, i) => `$${i + 1}`).join(', ');
            const selectClause = options.select ? 'RETURNING *' : '';
            
            const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) ${selectClause}`;
            const result = await directQuery(query, Object.values(values));
            return { data: options.select ? result.rows[0] : null, error: null };
          } catch (error) {
            return { data: null, error };
          }
        },
        update: async (values: any, options: { select?: boolean } = {}) => {
          try {
            // This is a simplified implementation - in real use, you would need to add conditions (WHERE clause)
            const setClause = Object.keys(values)
              .map((key, i) => `${key} = $${i + 1}`)
              .join(', ');
            
            const selectClause = options.select ? 'RETURNING *' : '';
            const query = `UPDATE ${table} SET ${setClause} ${selectClause}`;
            const result = await directQuery(query, Object.values(values));
            return { data: options.select ? result.rows : null, error: null };
          } catch (error) {
            return { data: null, error };
          }
        },
        delete: async () => {
          try {
            // This is a simplified implementation - in real use, you would need to add conditions (WHERE clause)
            const query = `DELETE FROM ${table}`;
            await directQuery(query);
            return { error: null };
          } catch (error) {
            return { error };
          }
        },
        eq: async (column: string, value: any) => {
          try {
            const query = `SELECT * FROM ${table} WHERE ${column} = $1`;
            const result = await directQuery(query, [value]);
            return { data: result.rows, error: null };
          } catch (error) {
            return { data: null, error };
          }
        },
        in: async (column: string, values: any[]) => {
          try {
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
            const query = `SELECT * FROM ${table} WHERE ${column} IN (${placeholders})`;
            const result = await directQuery(query, values);
            return { data: result.rows, error: null };
          } catch (error) {
            return { data: null, error };
          }
        },
        order: async (column: string, options: { ascending: boolean }) => {
          try {
            const direction = options.ascending ? 'ASC' : 'DESC';
            const query = `SELECT * FROM ${table} ORDER BY ${column} ${direction}`;
            const result = await directQuery(query);
            return { data: result.rows, error: null };
          } catch (error) {
            return { data: null, error };
          }
        },
        single: async () => {
          try {
            const result = await directQuery(`SELECT * FROM ${table} LIMIT 1`);
            if (result.rows.length === 0) {
              throw new Error('No rows returned');
            }
            return { data: result.rows[0], error: null };
          } catch (error) {
            return { data: null, error };
          }
        },
        maybeSingle: async () => {
          try {
            const result = await directQuery(`SELECT * FROM ${table} LIMIT 1`);
            return { data: result.rows[0] || null, error: null };
          } catch (error) {
            return { data: null, error };
          }
        },
        limit: async (limit: number) => {
          try {
            const query = `SELECT * FROM ${table} LIMIT ${limit}`;
            const result = await directQuery(query);
            return { data: result.rows, error: null };
          } catch (error) {
            return { data: null, error };
          }
        }
      };
    } else if (supabase) {
      return supabase.from(table);
    }
    
    throw new Error('No database connection available');
  }

  // Other methods can be implemented as needed
}

// Instantiate and export the client
export const db = new DatabaseClient();

// For backward compatibility, still export supabase client
export const supabase = USE_DIRECT_PG ? null : supabase;

// Add a connection test function with better error handling
export const testConnection = async () => {
  try {
    if (USE_DIRECT_PG && pgPool) {
      const { rows } = await directQuery('SELECT NOW()');
      console.log('Direct PostgreSQL connection successful!');
      return { 
        success: true, 
        environment: 'direct_postgres',
        timestamp: rows[0].now
      };
    } else if (supabase) {
      const { data, error } = await supabase.from('users').select('id').limit(1);
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
      environment: USE_DIRECT_PG ? 'direct_postgres' : (USE_LOCAL_DB ? 'local' : 'remote'),
      error: error instanceof Error ? error.message : 'Unknown connection error'
    };
  }
};

/**
 * ЛОКАЛЬНЫЙ POSTGRESQL НАПРЯМУЮ
 * 
 * Для работы с PostgreSQL напрямую (без Supabase):
 * 
 * 1. Установите PostgreSQL на вашу машину:
 *    - https://www.postgresql.org/download/
 * 
 * 2. Создайте базу данных и пользователя для приложения.
 * 
 * 3. Установите переменную окружения в файле .env:
 *    - VITE_USE_DIRECT_PG=true
 *    - VITE_PG_HOST=localhost
 *    - VITE_PG_PORT=5432
 *    - VITE_PG_DATABASE=your_database_name
 *    - VITE_PG_USER=your_username
 *    - VITE_PG_PASSWORD=your_password
 *    - VITE_PG_SSL=false
 * 
 * 4. Импортируйте структуру базы данных из SQL-скрипта, 
 *    если у вас есть экспорт схемы из Supabase.
 * 
 * 5. Используйте `db` клиент в коде вместо `supabase`.
 */
