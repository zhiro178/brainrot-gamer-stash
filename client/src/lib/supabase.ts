import { createClient } from "@supabase/supabase-js";

// Use environment variables if available, otherwise fallback to direct values
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || "https://uahxenisnppufpswupnz.supabase.co";
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaHhlbmlzbnBwdWZwc3d1cG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NzE5MzgsImV4cCI6MjA2NzE0NzkzOH0.2Ojgzc6byziUMnB8AaA0LnuHgbqlsKIur2apF-jrc3Q";

export const supabase = createClient(supabaseUrl, supabaseKey);