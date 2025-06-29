import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Safe Chrome storage adapter for Supabase with fallbacks
const chromeStorageAdapter = {
  getItem: async (key: string) => {
    try {
      console.log('ChromeStorageAdapter - getItem:', key);
      
      // Check if chrome APIs are available
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        console.warn('ChromeStorageAdapter - Chrome storage not available, returning null');
        return null;
      }
      
      const result = await chrome.storage.local.get(key);
      console.log('ChromeStorageAdapter - getItem result:', result[key]);
      return result[key] ?? null;
    } catch (error) {
      console.error('ChromeStorageAdapter - getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      console.log('ChromeStorageAdapter - setItem:', key, value.substring(0, 50) + '...');
      
      // Check if chrome APIs are available
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        console.warn('ChromeStorageAdapter - Chrome storage not available, skipping setItem');
        return;
      }
      
      await chrome.storage.local.set({ [key]: value });
    } catch (error) {
      console.error('ChromeStorageAdapter - setItem error:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      console.log('ChromeStorageAdapter - removeItem:', key);
      
      // Check if chrome APIs are available
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        console.warn('ChromeStorageAdapter - Chrome storage not available, skipping removeItem');
        return;
      }
      
      await chrome.storage.local.remove(key);
    } catch (error) {
      console.error('ChromeStorageAdapter - removeItem error:', error);
    }
  },
};

// Get environment variables from Vite's import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Extension Supabase - Environment check:');
console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing');

let extensionSupabase: SupabaseClient;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables in extension context.');
  console.warn('VITE_SUPABASE_URL:', supabaseUrl);
  console.warn('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing');
  
  // Create a mock client to prevent app crashes during development
  extensionSupabase = {
    auth: {
      getSession: () => {
        console.log('Mock Supabase - getSession called');
        return Promise.resolve({ data: { session: null }, error: null });
      },
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
  console.log('Creating Supabase client with URL:', supabaseUrl);
  extensionSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: chromeStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
    },
  });
}

export { extensionSupabase };