import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || '';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY)) || (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_ANON_KEY || process.env?.VITE_SUPABASE_PUBLISHABLE_KEY)) || '';

/**
 * Checks if valid Supabase credentials are configured in environment.
 */
export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project')
  );
};

let clerkTokenGetter = null;

/**
 * Dynamically register a Clerk token getter callback.
 * Enables Supabase RLS requests to include Clerk's signed JWT.
 */
export function setClerkTokenGetter(getter) {
  clerkTokenGetter = getter;
}

/**
 * Global Supabase Client instance (or null if not configured).
 * Injects Clerk JWT into all request headers when authenticated.
 */
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: async (url, options = {}) => {
          let token = null;
          if (clerkTokenGetter) {
            try {
              token = await clerkTokenGetter();
            } catch (err) {
              console.warn('Failed to get Clerk JWT for Supabase:', err);
            }
          }
          const headers = new Headers(options.headers);
          if (token) {
            headers.set('Authorization', `Bearer ${token}`);
          }
          return fetch(url, { ...options, headers });
        }
      }
    })
  : null;
