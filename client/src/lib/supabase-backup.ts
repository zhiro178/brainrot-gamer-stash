// Working Supabase client using direct fetch calls
// This bypasses the broken @supabase/supabase-js client

const SUPABASE_URL = "https://uahxenisnppufpswupnz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaHhlbmlzbnBwdWZwc3d1cG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NzE5MzgsImV4cCI6MjA2NzE0NzkzOH0.2Ojgzc6byziUMnB8AaA0LnuHgbqlsKIur2apF-jrc3Q";

interface QueryBuilder {
  select: (columns: string) => QueryBuilder;
  eq: (column: string, value: any) => QueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder;
  limit: (count: number) => QueryBuilder;
  then: (callback: (result: { data: any[] | null, error: any | null }) => void) => Promise<any>;
}

interface UpdateBuilder {
  eq: (column: string, value: any) => UpdateBuilder;
  then: (callback: (result: { data: any[] | null, error: any | null }) => void) => Promise<any>;
}

interface InsertBuilder {
  select: (columns?: string) => InsertBuilder;
  then: (callback: (result: { data: any[] | null, error: any | null }) => void) => Promise<any>;
}

class WorkingSupabaseClient {
  private buildUrl(table: string, params: URLSearchParams): string {
    return `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'apikey': SUPABASE_KEY,
      'Content-Type': 'application/json'
    };

    // Try to get auth token from localStorage (Supabase standard storage)
    try {
      const supabaseAuthKey = 'sb-uahxenisnppufpswupnz-auth-token';
      const authData = localStorage.getItem(supabaseAuthKey);
      
      if (authData) {
        const parsed = JSON.parse(authData);
        const accessToken = parsed?.access_token;
        
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
          console.log('Using stored auth token for API request');
          return headers;
        }
      }
    } catch (error) {
      console.log('Could not get stored auth token:', error);
    }

    // Fallback to anon key
    headers['Authorization'] = `Bearer ${SUPABASE_KEY}`;
    console.log('Using anon key for API request');
    return headers;
  }

  private createQueryBuilder(table: string): QueryBuilder {
    let selectColumns = '*';
    let whereConditions: string[] = [];
    let orderBy = '';
    let limitCount = '';

    const builder: QueryBuilder = {
      select: (columns: string) => {
        selectColumns = columns;
        return builder;
      },
      eq: (column: string, value: any) => {
        whereConditions.push(`${column}=eq.${value}`);
        return builder;
      },
      order: (column: string, options = { ascending: false }) => {
        orderBy = `order=${column}.${options.ascending ? 'asc' : 'desc'}`;
        return builder;
      },
      limit: (count: number) => {
        limitCount = `limit=${count}`;
        return builder;
      },
      then: async (callback) => {
        try {
          const params = new URLSearchParams();
          params.append('select', selectColumns);
          
          whereConditions.forEach(condition => {
            const [key, value] = condition.split('=');
            params.append(key, value);
          });
          
          if (orderBy) params.append('order', orderBy.split('=')[1]);
          if (limitCount) params.append('limit', limitCount.split('=')[1]);

          const url = this.buildUrl(table, params);
          console.log('Direct API call to:', url);
          
          const headers = await this.getHeaders();
          const response = await fetch(url, {
            method: 'GET',
            headers: headers
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          console.log('Direct API success:', data);
          callback({ data, error: null });
          return { data, error: null };
        } catch (error) {
          console.error('Direct API error:', error);
          callback({ data: null, error });
          return { data: null, error };
        }
      }
    };

    return builder;
  }

  private createUpdateBuilder(table: string, updateData: any): UpdateBuilder {
    let whereConditions: string[] = [];

    const builder: UpdateBuilder = {
      eq: (column: string, value: any) => {
        whereConditions.push(`${column}=eq.${value}`);
        return builder;
      },
      then: async (callback) => {
        try {
          const params = new URLSearchParams();
          
          whereConditions.forEach(condition => {
            const [key, value] = condition.split('=');
            params.append(key, value);
          });

          const url = this.buildUrl(table, params);
          console.log('Direct update API call to:', url, 'with data:', updateData);
          
          const baseHeaders = await this.getHeaders();
          const response = await fetch(url, {
            method: 'PATCH',
            headers: {
              ...baseHeaders,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify(updateData)
          });

          console.log('Update response status:', response.status, response.statusText);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Update failed with status:', response.status, 'body:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
          }

          // Handle response - Supabase PATCH with return=minimal returns empty body
          let data = null;
          const contentLength = response.headers.get('content-length');
          const contentType = response.headers.get('content-type');
          
          console.log('Update response headers:', { contentLength, contentType });
          
          if (contentLength === '0' || contentLength === null) {
            // Empty response is expected for updates with return=minimal
            console.log('Empty response from update - treating as success');
            data = null; // No data returned, but operation was successful
          } else {
            // Try to parse response if there's content
            try {
              const responseText = await response.text();
              console.log('Update response text:', responseText);
              
              if (responseText.trim() === '') {
                data = null;
              } else {
                data = JSON.parse(responseText);
              }
            } catch (jsonError) {
              console.log('Non-JSON response from update, treating as success');
              data = null; // No data, but operation was successful
            }
          }

          console.log('Direct update success - no data returned (normal for updates)');
          callback({ data, error: null });
          return { data, error: null };
        } catch (error) {
          console.error('Direct update error:', error);
          callback({ data: null, error });
          return { data: null, error };
        }
      }
    };

    return builder;
  }

  from(table: string) {
    return {
      select: (columns = '*') => this.createQueryBuilder(table).select(columns),
      insert: (values: any) => this.createInsertBuilder(table, values),
      update: (values: any) => this.createUpdateBuilder(table, values)
    };
  }

  private createInsertBuilder(table: string, values: any): InsertBuilder {
    const builder: InsertBuilder = {
      select: (columns = '*') => builder,
      then: async (callback) => {
        try {
          const url = `${SUPABASE_URL}/rest/v1/${table}`;
          console.log('Direct insert to:', url, 'with data:', values);
          
          const baseHeaders = await this.getHeaders();
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              ...baseHeaders,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(values)
          });

          console.log('Insert response status:', response.status, response.statusText);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Insert failed with status:', response.status, 'body:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
          }

          // Handle empty response or non-JSON response
          let data;
          const responseText = await response.text();
          console.log('Raw response text:', responseText);
          
          if (responseText.trim() === '') {
            // Empty response is common for inserts
            data = [values]; // Return the inserted data
          } else {
            try {
              data = JSON.parse(responseText);
            } catch (jsonError) {
              console.error('Failed to parse JSON response:', responseText);
              // If JSON parsing fails but HTTP status was OK, still treat as success
              data = [values]; // Return the inserted data
            }
          }

          console.log('Direct insert success:', data);
          callback({ data, error: null });
          return { data, error: null };
        } catch (error) {
          console.error('Direct insert error:', error);
          callback({ data: null, error });
          return { data: null, error };
        }
      }
    };

    return builder;
  }

  // Auth methods - simplified but functional
  auth = {
    getUser: async () => {
      try {
        console.log('WorkingSupabase: Getting user from localStorage...');
        
        // Get auth data from localStorage (Supabase standard storage)
        const supabaseAuthKey = 'sb-uahxenisnppufpswupnz-auth-token';
        const authData = localStorage.getItem(supabaseAuthKey);
        
        if (authData) {
          const parsed = JSON.parse(authData);
          const user = parsed?.user;
          
          if (user) {
            console.log('WorkingSupabase: Found user in localStorage:', user);
            return { data: { user }, error: null };
          }
        }
        
        console.log('WorkingSupabase: No user found in localStorage');
        return { data: { user: null }, error: null };
      } catch (error) {
        console.error('WorkingSupabase: getUser error:', error);
        return { data: { user: null }, error };
      }
    },
    getSession: async () => {
      try {
        console.log('WorkingSupabase: Getting session from localStorage...');
        
        // Get auth data from localStorage (Supabase standard storage)
        const supabaseAuthKey = 'sb-uahxenisnppufpswupnz-auth-token';
        const authData = localStorage.getItem(supabaseAuthKey);
        
        if (authData) {
          const parsed = JSON.parse(authData);
          
          if (parsed?.access_token && parsed?.user) {
            const session = {
              access_token: parsed.access_token,
              user: parsed.user
            };
            
            console.log('WorkingSupabase: Found session in localStorage');
            return { data: { session }, error: null };
          }
        }
        
        console.log('WorkingSupabase: No session found in localStorage');
        return { data: { session: null }, error: null };
      } catch (error) {
        console.error('WorkingSupabase: getSession error:', error);
        return { data: { session: null }, error };
      }
    },
    onAuthStateChange: (callback: any) => {
      console.log('WorkingSupabase: Setting up localStorage listener for auth changes...');
      
      // Listen for localStorage changes (when auth state changes)
      const handleStorageChange = (e: StorageEvent) => {
        const supabaseAuthKey = 'sb-uahxenisnppufpswupnz-auth-token';
        
        if (e.key === supabaseAuthKey) {
          console.log('Auth state changed in localStorage');
          
          if (e.newValue) {
            try {
              const parsed = JSON.parse(e.newValue);
              callback('SIGNED_IN', { access_token: parsed.access_token, user: parsed.user });
            } catch (error) {
              console.error('Error parsing auth data:', error);
            }
          } else {
            callback('SIGNED_OUT', null);
          }
        }
      };
      
      window.addEventListener('storage', handleStorageChange);
      
      return { 
        data: { 
          subscription: { 
            unsubscribe: () => {
              window.removeEventListener('storage', handleStorageChange);
              console.log('Auth state listener unsubscribed');
            }
          } 
        } 
      };
    }
  };
}

// Export the working client
export const workingSupabase = new WorkingSupabaseClient();

// Expose globally for debugging
if (typeof window !== 'undefined') {
  (window as any).workingSupabase = workingSupabase;
}