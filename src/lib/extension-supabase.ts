import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface ImportMetaEnv {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

// Get environment variables from the extension context
const getEnvVars = () => {
  // In extension context, we need to access env vars differently
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    // For now, we'll use the same approach as the main app
    // In production, you might want to store these in chrome.storage
    return {
      supabaseUrl: (import.meta as { env: ImportMetaEnv }).env.VITE_SUPABASE_URL,
      supabaseAnonKey: (import.meta as { env: ImportMetaEnv }).env.VITE_SUPABASE_ANON_KEY,
    };
  }
  
  return {
    supabaseUrl: (import.meta as { env: ImportMetaEnv }).env.VITE_SUPABASE_URL,
    supabaseAnonKey: (import.meta as { env: ImportMetaEnv }).env.VITE_SUPABASE_ANON_KEY,
  };
};

const { supabaseUrl, supabaseAnonKey } = getEnvVars();

let extensionSupabase: SupabaseClient;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables in extension context.');
  // Create a mock client to prevent app crashes during development
  extensionSupabase = {
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
  extensionSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: {
        getItem: async (key: string) => {
          const result = await chrome.storage.local.get([key]);
          return result[key] || null;
        },
        setItem: async (key: string, value: string) => {
          await chrome.storage.local.set({ [key]: value });
        },
        removeItem: async (key: string) => {
          await chrome.storage.local.remove([key]);
        },
      },
      autoRefreshToken: true,
      persistSession: true,
    },
  });
}

export { extensionSupabase };