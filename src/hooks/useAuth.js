import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { hydrateFromCloud, subscribeToProgressRealtime, migrateGuestPlaylistToAccount, flushPendingProgressSync } from '../services/cloudSyncService';
import { db } from '../db/FoclyraDB';
import { clearGuestImportHistory } from '../services/quotaService';
import { identifyUser, resetUser, trackEvent } from '../services/analytics';

let progressUnsub = null;

function setupRealtime(user) {
  if (progressUnsub) {
    progressUnsub();
    progressUnsub = null;
  }
  if (user) {
    progressUnsub = subscribeToProgressRealtime(user);
  }
}

function cleanupRealtime() {
  if (progressUnsub) {
    progressUnsub();
    progressUnsub = null;
  }
}

/**
 * Global Authentication Store with Supabase Auth & Google OAuth.
 */
export const useAuth = create((set, get) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  isConfigured: isSupabaseConfigured(),

  initAuth: async () => {
    if (!isSupabaseConfigured() || !supabase) {
      set({ isLoading: false, user: null, profile: null, session: null });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({ session, user: session.user });
        await get().fetchProfile(session.user.id);
        identifyUser(session.user.id, {
          email: session.user.email,
          provider: session.user.app_metadata?.provider || 'email'
        });
        await migrateGuestPlaylistToAccount(session.user).catch(() => {});
        hydrateFromCloud(session.user).catch(() => {});
        setupRealtime(session.user);
      } else {
        set({ session: null, user: null, profile: null });
      }
    } catch (err) {
      console.warn('Failed to retrieve Supabase session:', err);
    } finally {
      set({ isLoading: false });
    }

    // Real-time listener for OAuth logins, token refreshes, and logouts
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const currentUser = get().user;
        if (currentUser && currentUser.id !== session.user.id) {
          // Different user signed in! Clean up previous user's local database first
          await db.resetDatabase().catch(() => {});
          clearGuestImportHistory();
        }
        set({ session, user: session.user, isLoading: false });
        await get().fetchProfile(session.user.id);
        identifyUser(session.user.id, {
          email: session.user.email,
          provider: session.user.app_metadata?.provider || 'email'
        });
        await migrateGuestPlaylistToAccount(session.user).catch(() => {});
        hydrateFromCloud(session.user).catch(() => {});
        setupRealtime(session.user);
      } else {
        cleanupRealtime();
        if (_event === 'SIGNED_OUT') {
          await db.resetDatabase().catch(() => {});
          clearGuestImportHistory();
        }
        set({ session: null, user: null, profile: null, isLoading: false });
      }
    });
  },

  fetchProfile: async (userId) => {
    if (!supabase || !userId) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        set({ profile: data });
      } else {
        // Fallback profile if row is not populated yet
        const { user } = get();
        set({
          profile: {
            id: userId,
            email: user?.email,
            full_name: user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0],
            avatar_url: user?.user_metadata?.avatar_url || user?.user_metadata?.picture || ''
          }
        });
      }
    } catch (err) {
      console.warn('Error fetching profile from Supabase:', err);
    }
  },

  signInWithGoogle: async () => {
    if (!supabase) throw new Error('Supabase is not configured yet. Please add your credentials in .env.');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/studio`
      }
    });
    if (error) throw error;
    return data;
  },

  signInWithEmail: async (email, password) => {
    if (!supabase) throw new Error('Supabase is not configured yet.');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  signUpWithEmail: async (email, password, fullName) => {
    if (!supabase) throw new Error('Supabase is not configured yet.');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    if (!supabase) return;
    cleanupRealtime();
    await flushPendingProgressSync().catch(() => {});
    trackEvent('user_signed_out');
    resetUser();
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out warning:', err);
    }

    // Wipe local database completely to guarantee session isolation
    try {
      await db.resetDatabase();
    } catch (dbErr) {
      console.warn('Reset database on signout error:', dbErr);
    }

    clearGuestImportHistory();
    try {
      localStorage.removeItem('foclyra_custom_youtube_api_key');
    } catch {}

    set({ user: null, profile: null, session: null });
  },

  signOutAllDevices: async () => {
    if (!supabase) return;
    cleanupRealtime();
    await flushPendingProgressSync().catch(() => {});
    trackEvent('user_signed_out_all_devices');
    resetUser();
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
      console.warn('Sign out global warning:', err);
    }

    try {
      await db.resetDatabase();
    } catch (dbErr) {
      console.warn('Reset database on signout error:', dbErr);
    }

    clearGuestImportHistory();
    try {
      localStorage.removeItem('foclyra_custom_youtube_api_key');
    } catch {}

    set({ user: null, profile: null, session: null });
  },

  deleteAccount: async () => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { user } = get();
    if (!user) throw new Error('No user is currently signed in.');

    cleanupRealtime();
    await flushPendingProgressSync().catch(() => {});

    // Attempt secure RPC delete_user execution
    const { error } = await supabase.rpc('delete_user');
    if (error) {
      console.warn('RPC delete_user failed or not yet deployed, fallback to profiles purge:', error);
      await supabase.from('profiles').delete().eq('id', user.id);
    }

    trackEvent('account_deleted');
    resetUser();
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch {}

    try {
      await db.resetDatabase();
    } catch (dbErr) {
      console.warn('Reset database on delete account error:', dbErr);
    }

    clearGuestImportHistory();
    try {
      localStorage.removeItem('foclyra_custom_youtube_api_key');
    } catch {}

    set({ user: null, profile: null, session: null });
  }
}));
