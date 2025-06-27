import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface ImportMetaEnv {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

const supabaseUrl = (import.meta as { env: ImportMetaEnv }).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as { env: ImportMetaEnv }).env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
  // Create a mock client to prevent app crashes during development
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Supabase not configured' } }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ order: () => ({ data: [], error: null }) }) }),
      insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
      delete: () => ({ eq: () => ({ error: null }) }),
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        remove: () => Promise.resolve({ data: null, error: null }),
      }),
    },
  } as unknown as SupabaseClient;
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };