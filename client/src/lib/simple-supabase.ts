// Ultra-simple Supabase client that just works
const SUPABASE_URL = "https://uahxenisnppufpswupnz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaHhlbmlzbnBwdWZwc3d1cG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NzE5MzgsImV4cCI6MjA2NzE0NzkzOH0.2Ojgzc6byziUMnB8AaA0LnuHgbqlsKIur2apF-jrc3Q";

interface SimpleQuery {
  select: (columns: string) => SimpleQuery;
  eq: (column: string, value: any) => SimpleQuery;
  order: (column: string, options?: { ascending?: boolean }) => SimpleQuery;
  limit: (count: number) => SimpleQuery;
  then: (callback: (result: { data: any[] | null, error: any | null }) => void) => Promise<any>;
}

class SimpleSupabaseClient {
  from(table: string) {
    return {
      select: (columns = '*') => this.createQuery(table, columns),
      insert: (values: any) => this.insert(table, values),
      update: (values: any) => this.update(table, values)
    };
  }

  private createQuery(table: string, selectColumns: string): SimpleQuery {
    let whereClause = '';
    let orderClause = '';
    let limitClause = '';

    const query: SimpleQuery = {
      select: (columns: string) => {
        selectColumns = columns;
        return query;
      },
      eq: (column: string, value: any) => {
        whereClause += (whereClause ? '&' : '') + `${column}=eq.${value}`;
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
      then: async (callback) => {
        try {
          // Build URL exactly like working direct fetch
          let url = `${SUPABASE_URL}/rest/v1/${table}?select=${selectColumns}`;
          if (whereClause) url += '&' + whereClause;
          if (orderClause) url += '&' + orderClause;
          if (limitClause) url += '&' + limitClause;

          console.log('Simple client fetching:', url);

          // Use exact same fetch as working direct call
          const response = await fetch(url, {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`
            }
          });

          console.log('Simple client response:', response.status);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          console.log('Simple client data:', data);
          
          callback({ data, error: null });
          return { data, error: null };
        } catch (error) {
          console.error('Simple client error:', error);
          const errorObj = {
            message: error instanceof Error ? error.message : String(error)
          };
          callback({ data: null, error: errorObj });
          return { data: null, error: errorObj };
        }
      }
    };

    return query;
  }

  private async insert(table: string, values: any) {
    try {
      const url = `${SUPABASE_URL}/rest/v1/${table}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      return { data: null, error: { message: String(error) } };
    }
  }

  private update(table: string, values: any) {
    // Return update builder with eq method (not async)
    return {
      eq: (column: string, value: any) => {
        return {
          then: async (callback?: any) => {
            try {
              const url = `${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${value}`;
              console.log('Update URL:', url, 'Values:', values);
              
              const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                  'apikey': SUPABASE_KEY,
                  'Authorization': `Bearer ${SUPABASE_KEY}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=minimal'
                },
                body: JSON.stringify(values)
              });

              console.log('Update response:', response.status, response.statusText);

              if (!response.ok) {
                const errorText = await response.text();
                console.error('Update failed:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }

              const result = { data: null, error: null };
              if (callback) callback(result);
              return result;
            } catch (error) {
              console.error('Update error:', error);
              const errorObj = { message: String(error) };
              const result = { data: null, error: errorObj };
              if (callback) callback(result);
              return result;
            }
          }
        };
      }
    };
  }

  // Simple auth methods
  auth = {
    getUser: async (): Promise<{ data: { user: any }, error: any }> => {
      const authKey = 'sb-uahxenisnppufpswupnz-auth-token';
      const authData = localStorage.getItem(authKey);
      
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          if (parsed?.user) {
            return { data: { user: parsed.user }, error: null };
          }
        } catch (error) {
          console.error('Auth parse error:', error);
        }
      }
      
      return { data: { user: null }, error: null };
    },
    getSession: async (): Promise<{ data: { session: any }, error: any }> => {
      return { data: { session: null }, error: null };
    },
    onAuthStateChange: (callback: any) => {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  };
}

export const simpleSupabase = new SimpleSupabaseClient();

// Expose for debugging
if (typeof window !== 'undefined') {
  (window as any).simpleSupabase = simpleSupabase;
}