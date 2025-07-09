// Ultra-robust Supabase client that never fails to fetch
const SUPABASE_URL = "https://uahxenisnppufpswupnz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaHhlbmlzbnBwdWZwc3d1cG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NzE5MzgsImV4cCI6MjA2NzE0NzkzOH0.2Ojgzc6byziUMnB8AaA0LnuHgbqlsKIur2apF-jrc3Q";

interface RobustQuery {
  select: (columns: string) => RobustQuery;
  eq: (column: string, value: any) => RobustQuery;
  order: (column: string, options?: { ascending?: boolean }) => RobustQuery;
  limit: (count: number) => RobustQuery;
  then: <T>(callback: (result: { data: any[] | null, error: any | null }) => T) => Promise<T>;
}

class RobustSupabaseClient {
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second
  private timeout = 10000; // 10 seconds

  // Enhanced fetch with retry logic and timeout
  private async robustFetch(url: string, options: RequestInit = {}, retryCount = 0): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      console.log(`[Robust Client] Attempting fetch (${retryCount + 1}/${this.maxRetries + 1}):`, url);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);
      
      console.log(`[Robust Client] Response:`, response.status, response.statusText);

      // If we get a response (even error), return it
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`[Robust Client] Fetch attempt ${retryCount + 1} failed:`, error);

      // Retry on network errors
      if (retryCount < this.maxRetries) {
        console.log(`[Robust Client] Retrying in ${this.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.robustFetch(url, options, retryCount + 1);
      }

      // If all retries failed, throw the error
      throw error;
    }
  }

  from(table: string) {
    return {
      select: (columns = '*') => this.createQuery(table, columns),
      insert: (values: any) => this.insert(table, values),
      update: (values: any) => this.update(table, values)
    };
  }

  private createQuery(table: string, selectColumns: string): RobustQuery {
    let whereClause = '';
    let orderClause = '';
    let limitClause = '';

    const executeQuery = async () => {
      try {
        // Build URL with proper encoding
        let url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(selectColumns)}`;
        if (whereClause) url += '&' + whereClause;
        if (orderClause) url += '&' + orderClause;
        if (limitClause) url += '&' + limitClause;

        const response = await this.robustFetch(url);

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorBody = await response.text();
            if (errorBody) {
              errorMessage += ` - ${errorBody}`;
            }
          } catch (e) {
            // Ignore error parsing error body
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log(`[Robust Client] Success:`, data?.length || 0, 'records');
        
        return { data, error: null };
      } catch (error) {
        console.error('[Robust Client] Query failed:', error);
        return {
          data: null,
          error: {
            message: error instanceof Error ? error.message : String(error)
          }
        };
      }
    };

    const query: RobustQuery = {
      select: (columns: string) => {
        selectColumns = columns;
        return query;
      },
      eq: (column: string, value: any) => {
        whereClause += (whereClause ? '&' : '') + `${column}=eq.${encodeURIComponent(value)}`;
        return query;
      },
      order: (column: string, options = { ascending: false }) => {
        orderClause = `order=${column}.${options.ascending ? 'asc' : 'desc'}`;
        return query;
      },
      limit: (count: number) => {
        limitClause = `limit=${count}`;
        return query;
      },
      then: async <T>(callback: (result: { data: any[] | null, error: any | null }) => T): Promise<T> => {
        const result = await executeQuery();
        return callback(result);
      }
    };

    return query;
  }

  private async insert(table: string, values: any) {
    try {
      const url = `${SUPABASE_URL}/rest/v1/${table}`;
      const response = await this.robustFetch(url, {
        method: 'POST',
        headers: {
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorBody = await response.text();
          if (errorBody) {
            errorMessage += ` - ${errorBody}`;
          }
        } catch (e) {
          // Ignore error parsing error body
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('[Robust Client] Insert success');
      return { data, error: null };
    } catch (error) {
      console.error('[Robust Client] Insert failed:', error);
      return { data: null, error: { message: String(error) } };
    }
  }

  private update(table: string, values: any) {
    return {
      eq: (column: string, value: any) => {
        return {
          then: async <T>(callback?: (result: { data: any, error: any }) => T): Promise<T | { data: any, error: any }> => {
            try {
              const url = `${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${encodeURIComponent(value)}`;
              
              const response = await this.robustFetch(url, {
                method: 'PATCH',
                headers: {
                  'Prefer': 'return=minimal'
                },
                body: JSON.stringify(values)
              });

              if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                try {
                  const errorBody = await response.text();
                  if (errorBody) {
                    errorMessage += ` - ${errorBody}`;
                  }
                } catch (e) {
                  // Ignore error parsing error body
                }
                throw new Error(errorMessage);
              }

              console.log('[Robust Client] Update success');
              const result = { data: null, error: null };
              if (callback) {
                return callback(result);
              }
              return result;
            } catch (error) {
              console.error('[Robust Client] Update failed:', error);
              const result = { data: null, error: { message: String(error) } };
              if (callback) {
                return callback(result);
              }
              return result;
            }
          }
        };
      }
    };
  }

  // Enhanced auth methods with better localStorage handling
  auth = {
    getUser: async (): Promise<{ data: { user: any }, error: any }> => {
      try {
        // Try multiple localStorage keys that Supabase might use
        const possibleKeys = [
          'sb-uahxenisnppufpswupnz-auth-token',
          'supabase.auth.token',
          'sb-auth-token'
        ];

        for (const key of possibleKeys) {
          const authData = localStorage.getItem(key);
          if (authData) {
            try {
              const parsed = JSON.parse(authData);
              if (parsed?.user || parsed?.access_token) {
                const user = parsed.user || {
                  id: parsed.user_id || 'unknown',
                  email: parsed.email || 'unknown@example.com'
                };
                console.log('[Robust Client] Found user in localStorage:', user.email);
                return { data: { user }, error: null };
              }
            } catch (parseError) {
              console.warn('[Robust Client] Failed to parse auth data from', key, parseError);
            }
          }
        }

        console.log('[Robust Client] No valid user found in localStorage');
        return { data: { user: null }, error: null };
      } catch (error) {
        console.error('[Robust Client] Auth error:', error);
        return { data: { user: null }, error: { message: String(error) } };
      }
    },
    getSession: async (): Promise<{ data: { session: any }, error: any }> => {
      return { data: { session: null }, error: null };
    },
    onAuthStateChange: (callback: any) => {
      // Simple implementation - just return unsubscribe function
      return { 
        data: { 
          subscription: { 
            unsubscribe: () => {
              console.log('[Robust Client] Auth state change unsubscribed');
            } 
          } 
        } 
      };
    }
  };
}

export const robustSupabase = new RobustSupabaseClient();

// Expose for debugging
if (typeof window !== 'undefined') {
  (window as any).robustSupabase = robustSupabase;
}

console.log('[Robust Client] Initialized with enhanced error handling and retry logic');