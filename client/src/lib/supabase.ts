import { createClient } from "@supabase/supabase-js";

// Use environment variables if available, otherwise fallback to direct values
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || "https://uahxenisnppufpswupnz.supabase.co";
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaHhlbmlzbnBwdWZwc3d1cG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NzE5MzgsImV4cCI6MjA2NzE0NzkzOH0.2Ojgzc6byziUMnB8AaA0LnuHgbqlsKIur2apF-jrc3Q";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Also expose on window for debugging
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
}

// Helper function to handle Supabase errors gracefully
export const handleSupabaseError = (error: any, fallbackMessage = "Operation failed") => {
  console.error('Supabase error:', error);
  
  // Check if it's a fetch/network error
  if (error?.message?.includes('Failed to fetch') || error?.message?.includes('fetch')) {
    return {
      title: "Connection Error 🌐",
      description: "Unable to connect to the server. The service may be temporarily unavailable. Please try again later.",
      variant: "destructive" as const
    };
  }
  
  // Check for specific authentication errors
  if (error?.message?.includes('Invalid login credentials')) {
    return {
      title: "Login Failed",
      description: "The email or password you entered is incorrect. Please double-check your credentials and try again.",
      variant: "default" as const
    };
  }
  
  if (error?.message?.includes('Email not confirmed') || error?.message?.includes('not verified')) {
    return {
      title: "Email Verification Required",
      description: "Please check your email and click the verification link to activate your account before logging in.",
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
  
  if (error?.message?.includes('Password')) {
    return {
      title: "Password Error",
      description: "The password you entered is incorrect. Please try again or reset your password if you've forgotten it.",
      variant: "default" as const
    };
  }
  
  if (error?.message?.includes('Too many requests')) {
    return {
      title: "Too Many Attempts",
      description: "Too many login attempts. Please wait a few minutes before trying again.",
      variant: "default" as const
    };
  }
  
  // Generic auth error
  if (error?.message?.includes('auth') || error?.message?.includes('authentication')) {
    return {
      title: "Authentication Error",
      description: "Unable to authenticate your account. Please check your credentials and try again.",
      variant: "default" as const
    };
  }
  
  // Generic error
  return {
    title: "Oops! Something went wrong 😔",
    description: error?.message || fallbackMessage,
    variant: "destructive" as const
  };
};