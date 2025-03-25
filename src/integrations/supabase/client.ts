
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
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;
if (!USE_DIRECT_PG) {
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

// Define a type for our query builder to match Supabase's API
type QueryBuilder = {
  select: (columns?: string) => QueryBuilder;
  insert: (values: any, options?: { select?: boolean }) => Promise<{ data: any; error: any }>;
  update: (values: any, options?: { select?: boolean }) => QueryBuilder;
  delete: () => Promise<{ error: any }>;
  eq: (column: string, value: any) => QueryBuilder;
  in: (column: string, values: any[]) => QueryBuilder;
  order: (column: string, options: { ascending: boolean }) => QueryBuilder;
  single: () => Promise<{ data: any; error: any }>;
  maybeSingle: () => Promise<{ data: any; error: any }>;
  limit: (limit: number) => QueryBuilder;
};

// Enhanced database client that works with both Supabase and direct PostgreSQL
class DatabaseClient {
  // Store conditions for the PostgreSQL implementation
  private pgConditions: { column: string; operator: string; value: any }[] = [];
  private pgOrderBy: { column: string; direction: string } | null = null;
  private pgLimit: number | null = null;
  private pgColumns: string = '*';
  private currentTable: string = '';

  async from(table: string): Promise<QueryBuilder> {
    this.currentTable = table;
    this.pgConditions = [];
    this.pgOrderBy = null;
    this.pgLimit = null;
    this.pgColumns = '*';

    if (USE_DIRECT_PG && pgPool) {
      // For PostgreSQL, return our custom query builder
      return {
        select: (columns = '*') => {
          this.pgColumns = columns;
          return this._getPgQueryBuilder();
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
        update: (values: any, options: { select?: boolean } = {}) => {
          // Store values for later execution
          const queryBuilder = this._getPgQueryBuilder();
          queryBuilder.updateValues = values;
          queryBuilder.updateOptions = options;
          return queryBuilder;
        },
        delete: async () => {
          try {
            let query = `DELETE FROM ${table}`;
            const params: any[] = [];
            
            // Add WHERE conditions
            if (this.pgConditions.length > 0) {
              query += ' WHERE ';
              this.pgConditions.forEach((condition, index) => {
                if (index > 0) {
                  query += ' AND ';
                }
                
                if (condition.operator === 'IN') {
                  const placeholders = (condition.value as any[]).map((_, i) => `$${params.length + i + 1}`).join(', ');
                  query += `${condition.column} IN (${placeholders})`;
                  params.push(...condition.value);
                } else {
                  query += `${condition.column} ${condition.operator} $${params.length + 1}`;
                  params.push(condition.value);
                }
              });
            }
            
            await directQuery(query, params);
            return { error: null };
          } catch (error) {
            return { error };
          }
        },
        eq: (column: string, value: any) => {
          this.pgConditions.push({ column, operator: '=', value });
          return this._getPgQueryBuilder();
        },
        in: (column: string, values: any[]) => {
          this.pgConditions.push({ column, operator: 'IN', value: values });
          return this._getPgQueryBuilder();
        },
        order: (column: string, options: { ascending: boolean }) => {
          this.pgOrderBy = { column, direction: options.ascending ? 'ASC' : 'DESC' };
          return this._getPgQueryBuilder();
        },
        single: async () => {
          try {
            const result = await this._executePgQuery(true, 1);
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
            const result = await this._executePgQuery(true, 1);
            return { data: result.rows[0] || null, error: null };
          } catch (error) {
            return { data: null, error };
          }
        },
        limit: (limit: number) => {
          this.pgLimit = limit;
          return this._getPgQueryBuilder();
        }
      };
    } else if (supabaseClient) {
      // For Supabase, we can use the existing from method
      // We need to cast to any to avoid type errors from string argument
      return supabaseClient.from(table as any) as unknown as QueryBuilder;
    }
    
    throw new Error('No database connection available');
  }

  // Helper to generate the PostgreSQL query builder with the correct 'this' context
  private _getPgQueryBuilder(): any {
    const self = this;
    
    return {
      select: (columns = '*') => {
        self.pgColumns = columns;
        return self._getPgQueryBuilder();
      },
      eq: (column: string, value: any) => {
        self.pgConditions.push({ column, operator: '=', value });
        return self._getPgQueryBuilder();
      },
      in: (column: string, values: any[]) => {
        self.pgConditions.push({ column, operator: 'IN', value: values });
        return self._getPgQueryBuilder();
      },
      order: (column: string, options: { ascending: boolean }) => {
        self.pgOrderBy = { column, direction: options.ascending ? 'ASC' : 'DESC' };
        return self._getPgQueryBuilder();
      },
      limit: (limit: number) => {
        self.pgLimit = limit;
        return self._getPgQueryBuilder();
      },
      single: async () => {
        try {
          const result = await self._executePgQuery(true, 1);
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
          const result = await self._executePgQuery(true, 1);
          return { data: result.rows[0] || null, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
      update: async (values: any, options: { select?: boolean } = {}) => {
        try {
          const setClause = Object.keys(values)
            .map((key, i) => `${key} = $${i + 1}`)
            .join(', ');
          
          let query = `UPDATE ${self.currentTable} SET ${setClause}`;
          const params = [...Object.values(values)];
          let paramIndex = params.length;
          
          // Add WHERE conditions
          if (self.pgConditions.length > 0) {
            query += ' WHERE ';
            self.pgConditions.forEach((condition, index) => {
              if (index > 0) {
                query += ' AND ';
              }
              
              if (condition.operator === 'IN') {
                const placeholders = (condition.value as any[]).map((_, i) => `$${paramIndex + i + 1}`).join(', ');
                query += `${condition.column} IN (${placeholders})`;
                params.push(...condition.value);
                paramIndex += (condition.value as any[]).length;
              } else {
                query += `${condition.column} ${condition.operator} $${paramIndex + 1}`;
                params.push(condition.value);
                paramIndex += 1;
              }
            });
          }
          
          const selectClause = options.select ? 'RETURNING *' : '';
          if (selectClause) {
            query += ' ' + selectClause;
          }
          
          const result = await directQuery(query, params);
          return { data: options.select ? result.rows : null, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
      // For backward compatibility, return actual data when awaited
      then: (resolve: any) => {
        return self._executePgQuery().then(result => {
          resolve({ data: result.rows, error: null });
        }).catch(error => {
          resolve({ data: null, error });
        });
      }
    };
  }

  // Helper to execute the PostgreSQL query based on the stored conditions
  private async _executePgQuery(forSingle = false, limit: number | null = null): Promise<QueryResult> {
    if (!pgPool) {
      throw new Error('PostgreSQL pool not available');
    }
    
    let query = `SELECT ${this.pgColumns} FROM ${this.currentTable}`;
    const params: any[] = [];
    
    // Add WHERE conditions
    if (this.pgConditions.length > 0) {
      query += ' WHERE ';
      this.pgConditions.forEach((condition, index) => {
        if (index > 0) {
          query += ' AND ';
        }
        
        if (condition.operator === 'IN') {
          const placeholders = (condition.value as any[]).map((_, i) => `$${params.length + i + 1}`).join(', ');
          query += `${condition.column} IN (${placeholders})`;
          params.push(...condition.value);
        } else {
          query += `${condition.column} ${condition.operator} $${params.length + 1}`;
          params.push(condition.value);
        }
      });
    }
    
    // Add ORDER BY
    if (this.pgOrderBy) {
      query += ` ORDER BY ${this.pgOrderBy.column} ${this.pgOrderBy.direction}`;
    }
    
    // Add LIMIT
    const effectiveLimit = forSingle ? 1 : (limit !== null ? limit : this.pgLimit);
    if (effectiveLimit !== null) {
      query += ` LIMIT ${effectiveLimit}`;
    }
    
    return await directQuery(query, params);
  }
}

// Instantiate and export the client
export const db = new DatabaseClient();

// For backward compatibility, still export supabase client
export const supabase = supabaseClient;

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
