import { createClient } from "@supabase/supabase-js";

// Use environment variables if available, otherwise fallback to direct values
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || "https://uahxenisnppufpswupnz.supabase.co";
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaHhlbmlzbnBwdWZwc3d1cG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NzE5MzgsImV4cCI6MjA2NzE0NzkzOH0.2Ojgzc6byziUMnB8AaA0LnuHgbqlsKIur2apF-jrc3Q";

// Create the main Supabase client with optimized settings
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    storageKey: 'supabase-auth-token',
    detectSessionInUrl: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': '592-stock-web'
    }
  }
});

// Create an alias for backward compatibility and unified usage
export const workingSupabase = supabase;
export const simpleSupabase = supabase;

// Also expose on window for debugging
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
  (window as any).workingSupabase = supabase;
  (window as any).simpleSupabase = supabase;
}

// Enhanced error handling with better user messages
export const handleSupabaseError = (error: any, fallbackMessage = "Operation failed") => {
  console.error('Supabase error:', error);
  
  // Check if it's a fetch/network error
  if (error?.message?.includes('Failed to fetch') || error?.message?.includes('fetch')) {
    return {
      title: "Connection Error 🌐",
      description: "Unable to connect to the server. Please check your internet connection and try again.",
      variant: "destructive" as const
    };
  }
  
  // Check for RLS/permission errors
  if (error?.message?.includes('row-level security') || error?.message?.includes('policy')) {
    return {
      title: "Access Error",
      description: "You don't have permission to perform this action. Please contact support if this persists.",
      variant: "destructive" as const
    };
  }
  
  // Check for specific authentication errors
  if (error?.message?.includes('Invalid login credentials')) {
    return {
      title: "Login Failed",
      description: "The email or password you entered is incorrect. Please try again.",
      variant: "default" as const
    };
  }
  
  if (error?.message?.includes('Email not confirmed') || error?.message?.includes('not verified')) {
    return {
      title: "Email Verification Required",
      description: "Please check your email and click the verification link to activate your account.",
      variant: "default" as const
    };
  }
  
  if (error?.message?.includes('User not found') || error?.message?.includes('Invalid email')) {
    return {
      title: "Account Not Found",
      description: "No account exists with this email address. Please check your email or create a new account.",
      variant: "default" as const
    };
  }
  
  if (error?.message?.includes('Too many requests')) {
    return {
      title: "Too Many Attempts",
      description: "Too many requests. Please wait a few minutes before trying again.",
      variant: "default" as const
    };
  }
  
  // Database connection errors
  if (error?.message?.includes('connection') || error?.message?.includes('timeout')) {
    return {
      title: "Database Connection Error",
      description: "Unable to connect to the database. Please try again in a moment.",
      variant: "destructive" as const
    };
  }
  
  // Table/column not found errors
  if (error?.message?.includes('does not exist') || error?.message?.includes('not found')) {
    return {
      title: "System Configuration Error",
      description: "The system is not properly configured. Please contact support for assistance.",
      variant: "destructive" as const
    };
  }
  
  // Generic error
  return {
    title: "Something went wrong 😔",
    description: error?.message || fallbackMessage,
    variant: "destructive" as const
  };
};

// Utility functions for common operations
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // Not found error
      console.error('Error fetching user profile:', error);
    }
    
    return { data, error };
  } catch (err) {
    console.error('Profile fetch error:', err);
    return { data: null, error: err };
  }
};

export const getUserBalance = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_balances')
      .select('balance')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user balance:', error);
    }
    
    return { data, error };
  } catch (err) {
    console.error('Balance fetch error:', err);
    return { data: null, error: err };
  }
};

export const updateUserBalance = async (userId: string, newBalance: number) => {
  try {
    const { data, error } = await supabase
      .from('user_balances')
      .upsert({
        user_id: userId,
        balance: newBalance.toFixed(2),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user balance:', error);
    }
    
    return { data, error };
  } catch (err) {
    console.error('Balance update error:', err);
    return { data: null, error: err };
  }
};