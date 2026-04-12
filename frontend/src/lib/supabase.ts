import { createClient } from "@supabase/supabase-js";

// Ensure environment variables are loaded
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://mock.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "mock-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const hasSupabaseConfig = 
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_ANON_KEY;
