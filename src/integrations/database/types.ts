
/**
 * Generic Database Adapter Interface
 * 
 * This interface defines the common operations that any database adapter
 * should implement. This makes it easier to switch between different database systems.
 */
export interface DatabaseAdapter<T = any> {
  // Query operations
  select: (table: string, options?: QueryOptions) => Promise<{ data: T[] | null; error: Error | null }>;
  insert: (table: string, data: any, options?: QueryOptions) => Promise<{ data: T | null; error: Error | null }>;
  update: (table: string, data: any, options?: QueryOptions) => Promise<{ data: T | null; error: Error | null }>;
  delete: (table: string, options?: QueryOptions) => Promise<{ data: T | null; error: Error | null }>;
  
  // Authentication (if applicable)
  signUp?: (credentials: AuthCredentials) => Promise<{ data: any; error: Error | null }>;
  signIn?: (credentials: AuthCredentials) => Promise<{ data: any; error: Error | null }>;
  signOut?: () => Promise<{ error: Error | null }>;
  
  // Run raw queries (if supported)
  query?: (sql: string, params?: any[]) => Promise<{ data: any; error: Error | null }>;
}

export interface QueryOptions {
  columns?: string;
  filter?: Record<string, any>;
  limit?: number;
  offset?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
  // Add more options as needed
}

export interface AuthCredentials {
  email?: string;
  password?: string;
  provider?: string;
  // Add more auth methods as needed
}
