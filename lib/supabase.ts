import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Returns Supabase client if configured, otherwise null for local-first mode
export const getSupabaseClient = () => {
  if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
    try {
      return createClient(supabaseUrl, supabaseAnonKey);
    } catch (err) {
      console.warn('Supabase initialization failed, falling back to local-first mode', err);
      return null;
    }
  }
  return null;
};
