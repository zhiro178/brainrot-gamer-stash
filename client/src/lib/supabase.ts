import { createClient } from "@supabase/supabase-js";

// Use environment variables if available, otherwise fallback to direct values
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || "https://uahxenisnppufpswupnz.supabase.co";
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaHhlbmlzbnBwdWZwc3d1cG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NzE5MzgsImV4cCI6MjA2NzE0NzkzOH0.2Ojgzc6byziUMnB8AaA0LnuHgbqlsKIur2apF-jrc3Q";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to handle Supabase errors gracefully
export const handleSupabaseError = (error: any, fallbackMessage = "Operation failed") => {
  console.error('Supabase error:', error);
  
  // Check if it's a fetch/network error
  if (error?.message?.includes('Failed to fetch') || error?.message?.includes('fetch')) {
    return {
      title: "Connection Error",
      description: "Unable to connect to the server. The service may be temporarily unavailable. Please try again later.",
      variant: "destructive" as const
    };
  }
  
  // Check if it's an auth error
  if (error?.message?.includes('Invalid login') || error?.message?.includes('Email not confirmed')) {
    return {
      title: "Authentication Error",
      description: error.message,
      variant: "destructive" as const
    };
  }
  
  // Generic error
  return {
    title: "Error",
    description: fallbackMessage,
    variant: "destructive" as const
  };
};