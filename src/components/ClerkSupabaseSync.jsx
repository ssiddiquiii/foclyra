import React, { useEffect } from 'react';
import { useUser, useAuth as useClerkAuth, useClerk } from '@clerk/clerk-react';
import { setClerkTokenGetter } from '../services/supabaseClient';
import { useAuth, AUTH_STATUS, ACTIVE_USER_STORAGE_KEY } from '../hooks/useAuth';
import { useUIStore } from '../hooks/useUIStore';
import { db } from '../db/FoclyraDB';
import { clearGuestImportHistory, setReturningRegisteredUser } from '../services/quotaService';
import { identifyUser, resetUser } from '../services/analytics';
import { hydrateFromCloud, migrateGuestPlaylistToAccount } from '../services/cloudSyncService';

/**
 * Headless synchronizer bridge connecting Clerk Authentication with Supabase & Local Dexie.
 */
export default function ClerkSupabaseSync() {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { getToken } = useClerkAuth();
  const clerk = useClerk();
  const { authModalOpen, closeAuthModal } = useUIStore();

  // 1. Register Clerk Supabase JWT Token Getter
  useEffect(() => {
    setClerkTokenGetter(async () => {
      try {
        return await getToken({ template: 'supabase' });
      } catch (err) {
        console.warn('Clerk Supabase token fetch error:', err);
        return null;
      }
    });
  }, [getToken]);

  // 2. Synchronize Clerk User into Foclyra useAuth store and Dexie
  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && clerkUser) {
      const activeUserId = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
      if (activeUserId && activeUserId !== clerkUser.id && activeUserId !== 'guest') {
        db.resetDatabase().catch(() => {});
        clearGuestImportHistory();
        setReturningRegisteredUser(false);
      }
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, clerkUser.id);

      const normalizedUser = {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        user_metadata: {
          full_name: clerkUser.fullName || clerkUser.firstName || '',
          avatar_url: clerkUser.imageUrl || ''
        }
      };

      useAuth.setState({
        user: normalizedUser,
        profile: {
          id: clerkUser.id,
          email: normalizedUser.email,
          full_name: normalizedUser.user_metadata.full_name,
          avatar_url: normalizedUser.user_metadata.avatar_url
        },
        session: { user: normalizedUser },
        status: AUTH_STATUS.AUTHENTICATED,
        isLoading: false
      });

      setReturningRegisteredUser(true);
      identifyUser(clerkUser.id, {
        email: normalizedUser.email,
        provider: 'clerk'
      });

      // Migrate guest playlist and sync cloud
      migrateGuestPlaylistToAccount(normalizedUser).catch(() => {});
      hydrateFromCloud(normalizedUser).catch(() => {});
    } else {
      // User is logged out
      const activeUserId = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
      if (activeUserId && activeUserId !== 'guest') {
        db.resetDatabase().catch(() => {});
        localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
      }
      resetUser();

      useAuth.setState({
        user: null,
        profile: null,
        session: null,
        status: AUTH_STATUS.UNAUTHENTICATED,
        isLoading: false
      });
    }
  }, [isLoaded, isSignedIn, clerkUser]);

  // 3. Listen to global UI store authModalOpen to open Clerk's native modal
  useEffect(() => {
    if (authModalOpen && isLoaded) {
      closeAuthModal();
      clerk.openSignIn();
    }
  }, [authModalOpen, isLoaded, closeAuthModal, clerk]);

  return null;
}
