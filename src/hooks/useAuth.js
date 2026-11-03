import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient.js';
import { hydrateFromCloud, subscribeToProgressRealtime, migrateGuestPlaylistToAccount, flushPendingProgressSync } from '../services/cloudSyncService.js';
import { db } from '../db/FoclyraDB.js';
import { clearGuestImportHistory, setReturningRegisteredUser, getGuestImportHistory } from '../services/quotaService.js';
import { identifyUser, resetUser, trackEvent } from '../services/analytics.js';
import { useUIStore } from './useUIStore.js';

export const AUTH_STATUS = Object.freeze({
  INITIALIZING: 'INITIALIZING',
  AUTHENTICATED: 'AUTHENTICATED',
  GUEST: 'GUEST',
  UNAUTHENTICATED: 'UNAUTHENTICATED'
});

export const ACTIVE_USER_STORAGE_KEY = 'foclyra_active_user_id';

export function computeAuthStatus(user, isLoading) {
  if (isLoading) return AUTH_STATUS.INITIALIZING;
  if (user) return AUTH_STATUS.AUTHENTICATED;
  const guestHistory = getGuestImportHistory();
  if (guestHistory && guestHistory.length > 0) return AUTH_STATUS.GUEST;
  return AUTH_STATUS.UNAUTHENTICATED;
}

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
 * Global Authentication Store with Supabase Auth, Google OAuth, and State Machine.
 */
export const useAuth = create((set, get) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  status: AUTH_STATUS.INITIALIZING,
  isConfigured: isSupabaseConfigured(),

  initAuth: async () => {
    if (!isSupabaseConfigured() || !supabase) {
      set({ 
        isLoading: false, 
        user: null, 
        profile: null, 
        session: null,
        status: computeAuthStatus(null, false)
      });
      return;
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (session?.user) {
        // Multi-tenant check: if another user was previously cached in Dexie, wipe it before hydration
        const activeUserId = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
        if (activeUserId && activeUserId !== session.user.id && activeUserId !== 'guest') {
          await db.resetDatabase().catch(() => {});
          clearGuestImportHistory();
          setReturningRegisteredUser(false);
        }
        localStorage.setItem(ACTIVE_USER_STORAGE_KEY, session.user.id);

        set({ 
          session, 
          user: session.user, 
          status: AUTH_STATUS.AUTHENTICATED,
          isLoading: false 
        });
        setReturningRegisteredUser(true);
        await get().fetchProfile(session.user.id);
        identifyUser(session.user.id, {
          email: session.user.email,
          provider: session.user.app_metadata?.provider || 'email'
        });
        await migrateGuestPlaylistToAccount(session.user).catch(() => {});
        hydrateFromCloud(session.user).catch(() => {});
        setupRealtime(session.user);
      } else {
        // Expired or absent session: verify Dexie does not leak previous authenticated data
        const activeUserId = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
        if (activeUserId && activeUserId !== 'guest') {
          await db.resetDatabase().catch(() => {});
          localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
        }
        set({ 
          session: null, 
          user: null, 
          profile: null,
          status: computeAuthStatus(null, false),
          isLoading: false
        });
      }
    } catch (err) {
      console.warn('Failed to retrieve Supabase session:', err);
      set({ 
        session: null, 
        user: null, 
        profile: null, 
        status: computeAuthStatus(null, false),
        isLoading: false 
      });
    }

    // Real-time listener for OAuth logins, token refreshes, and logouts
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const activeUserId = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
        if (activeUserId && activeUserId !== session.user.id && activeUserId !== 'guest') {
          await db.resetDatabase().catch(() => {});
          clearGuestImportHistory();
          setReturningRegisteredUser(false);
        }
        localStorage.setItem(ACTIVE_USER_STORAGE_KEY, session.user.id);

        set({ 
          session, 
          user: session.user, 
          status: AUTH_STATUS.AUTHENTICATED,
          isLoading: false 
        });
        setReturningRegisteredUser(true);
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
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
          await db.resetDatabase().catch(() => {});
          clearGuestImportHistory();
          useUIStore.getState().resetUIState();
        }
        set({ 
          session: null, 
          user: null, 
          profile: null, 
          status: computeAuthStatus(null, false),
          isLoading: false 
        });
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

  sendPasswordResetEmail: async (email) => {
    if (!supabase) throw new Error('Supabase is not configured yet.');
    const redirectTo = `${window.location.origin}/reset-password`;
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });
    if (error) throw error;
    return data;
  },

  updatePassword: async (newPassword) => {
    if (!supabase) throw new Error('Supabase is not configured yet.');
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
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

    localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
    try {
      await db.resetDatabase();
    } catch (dbErr) {
      console.warn('Reset database on signout error:', dbErr);
    }

    clearGuestImportHistory();
    useUIStore.getState().resetUIState();
    try {
      localStorage.removeItem('foclyra_custom_youtube_api_key');
    } catch {}

    set({ 
      user: null, 
      profile: null, 
      session: null, 
      status: AUTH_STATUS.UNAUTHENTICATED,
      isLoading: false 
    });
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

    localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
    try {
      await db.resetDatabase();
    } catch (dbErr) {
      console.warn('Reset database on signout error:', dbErr);
    }

    clearGuestImportHistory();
    useUIStore.getState().resetUIState();
    try {
      localStorage.removeItem('foclyra_custom_youtube_api_key');
    } catch {}

    set({ 
      user: null, 
      profile: null, 
      session: null, 
      status: AUTH_STATUS.UNAUTHENTICATED,
      isLoading: false 
    });
  },

  deleteAccount: async () => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { user } = get();
    if (!user) throw new Error('No user is currently signed in.');

    cleanupRealtime();
    await flushPendingProgressSync().catch(() => {});

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

    localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
    try {
      await db.resetDatabase();
    } catch (dbErr) {
      console.warn('Reset database on delete account error:', dbErr);
    }

    clearGuestImportHistory();
    setReturningRegisteredUser(false);
    useUIStore.getState().resetUIState();
    try {
      localStorage.removeItem('foclyra_custom_youtube_api_key');
    } catch {}

    set({ 
      user: null, 
      profile: null, 
      session: null, 
      status: AUTH_STATUS.UNAUTHENTICATED,
      isLoading: false 
    });
  }
}));
