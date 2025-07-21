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
  // Add method to create user_profiles table if needed
  async createUserProfilesTable() {
    try {
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.user_profiles (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL UNIQUE,
          username TEXT,
          display_name TEXT,
          avatar_url TEXT,
          bio TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        );
        
        ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY IF NOT EXISTS "Users can view all profiles" ON public.user_profiles
            FOR SELECT USING (true);
        
        CREATE POLICY IF NOT EXISTS "Users can create own profile" ON public.user_profiles
            FOR INSERT WITH CHECK (true);
        
        CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.user_profiles
            FOR UPDATE USING (true);
      `;
      
      // This would normally require SQL execution privileges
      console.log('Would create user_profiles table with SQL:', createTableSQL);
      return { success: false, message: 'Table creation requires database admin access' };
    } catch (error) {
      console.error('Table creation error:', error);
      return { success: false, message: String(error) };
    }
  }

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
        const maxRetries = 3;
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            // Build URL exactly like working direct fetch
            let url = `${SUPABASE_URL}/rest/v1/${table}?select=${selectColumns}`;
            if (whereClause) url += '&' + whereClause;
            if (orderClause) url += '&' + orderClause;
            if (limitClause) url += '&' + limitClause;

            console.log(`Simple client fetching (attempt ${attempt}/${maxRetries}):`, url);

            // Use exact same fetch as working direct call with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

            const response = await fetch(url, {
              headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
              },
              signal: controller.signal
            });

            clearTimeout(timeoutId);
            console.log('Simple client response:', response.status);

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Simple client data:', data);
            
            const result = { data, error: null };
            if (callback) callback(result);
            return result;
          } catch (error) {
            lastError = error;
            console.error(`Simple client error (attempt ${attempt}/${maxRetries}):`, error);
            
            if (attempt < maxRetries) {
              // Wait before retry with exponential backoff
              const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
              console.log(`Retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
        
        // All retries failed
        const errorObj = {
          message: lastError instanceof Error ? lastError.message : String(lastError)
        };
        const result = { data: null, error: errorObj };
        if (callback) callback(result);
        return result;
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
    // Return update builder with eq method that returns a proper promise
    return {
      eq: (column: string, value: any): Promise<{ data: any, error: any }> => {
        return new Promise(async (resolve) => {
          try {
            const url = `${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${value}`;
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

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = { data: null, error: null };
            resolve(result);
          } catch (error) {
            const result = { data: null, error: { message: String(error) } };
            resolve(result);
          }
        });
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