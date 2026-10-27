import { supabase, isSupabaseConfigured } from './supabaseClient';
import { db } from '../db/FocusFlowDB';

const GUEST_IMPORTS_STORAGE_KEY = 'foclyra_guest_imported_playlists';
export const GUEST_MAX_PLAYLISTS = 1;
export const REGISTERED_MAX_PLAYLISTS = 5;

/**
 * Returns list of playlist IDs imported as a guest user.
 */
export function getGuestImportHistory() {
  try {
    const raw = localStorage.getItem(GUEST_IMPORTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Records a playlist import in guest history.
 */
export function recordGuestImport(playlistId) {
  try {
    const history = getGuestImportHistory();
    if (!history.includes(playlistId)) {
      history.push(playlistId);
      localStorage.setItem(GUEST_IMPORTS_STORAGE_KEY, JSON.stringify(history));
    }
  } catch (err) {
    console.warn('Failed to record guest import in localStorage:', err);
  }
}

/**
 * Validates whether the user (guest or registered) is allowed to import this playlist.
 * @param {object} params
 * @param {object|null} params.user Current Supabase user (null for guest)
 * @param {string} params.playlistId The YouTube playlist ID or course ID
 * @returns {Promise<{ allowed: boolean, reason?: string, currentCount: number, maxLimit: number, isReimport: boolean }>}
 */
export async function checkPlaylistImportQuota({ user, playlistId }) {
  // GUEST USER CHECKS
  if (!user) {
    const guestHistory = getGuestImportHistory();
    const currentCourses = await db.courses.count();

    // If guest already used their 1 trial allowance
    if (guestHistory.length >= GUEST_MAX_PLAYLISTS) {
      return {
        allowed: false,
        reason: 'GUEST_LIMIT_REACHED',
        currentCount: guestHistory.length,
        currentActiveCount: currentCourses,
        maxLimit: GUEST_MAX_PLAYLISTS,
        isReimport: guestHistory.includes(playlistId)
      };
    }

    return {
      allowed: true,
      currentCount: guestHistory.length,
      currentActiveCount: currentCourses,
      maxLimit: GUEST_MAX_PLAYLISTS,
      isReimport: false
    };
  }

  // REGISTERED USER CHECKS
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: userCourses, error } = await supabase
        .from('user_courses')
        .select('playlist_id, is_active')
        .eq('user_id', user.id);

      if (error) {
        console.warn('Could not query Supabase user_courses, falling back to local DB check:', error);
      } else if (userCourses) {
        const uniquePlaylists = [...new Set(userCourses.map(c => c.playlist_id))];
        const isReimport = uniquePlaylists.includes(playlistId);

        if (isReimport) {
          // Re-importing a previously imported playlist doesn't consume an additional slot
          return {
            allowed: true,
            reason: null,
            currentCount: uniquePlaylists.length,
            maxLimit: REGISTERED_MAX_PLAYLISTS,
            isReimport: true
          };
        }

        if (uniquePlaylists.length >= REGISTERED_MAX_PLAYLISTS) {
          return {
            allowed: false,
            reason: 'REGISTERED_LIMIT_REACHED',
            currentCount: uniquePlaylists.length,
            maxLimit: REGISTERED_MAX_PLAYLISTS,
            isReimport: false
          };
        }

        return {
          allowed: true,
          reason: null,
          currentCount: uniquePlaylists.length,
          maxLimit: REGISTERED_MAX_PLAYLISTS,
          isReimport: false
        };
      }
    } catch (err) {
      console.warn('Error checking quota against Supabase:', err);
    }
  }

  // Offline / Local fallback for registered user
  const localCount = await db.courses.count();
  const existingLocal = await db.courses.get(playlistId);

  if (existingLocal) {
    return {
      allowed: true,
      currentCount: localCount,
      maxLimit: REGISTERED_MAX_PLAYLISTS,
      isReimport: true
    };
  }

  if (localCount >= REGISTERED_MAX_PLAYLISTS) {
    return {
      allowed: false,
      reason: 'REGISTERED_LIMIT_REACHED',
      currentCount: localCount,
      maxLimit: REGISTERED_MAX_PLAYLISTS,
      isReimport: false
    };
  }

  return {
    allowed: true,
    currentCount: localCount,
    maxLimit: REGISTERED_MAX_PLAYLISTS,
    isReimport: false
  };
}

/**
 * Persists course slot tracking in Supabase when imported.
 */
export async function trackCourseImport({ user, course, lessonCount = 0 }) {
  if (!user) {
    recordGuestImport(course.id);
    return;
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('user_courses').upsert({
        user_id: user.id,
        playlist_id: course.id,
        title: course.title,
        thumbnail_url: course.thumbnailUrl || '',
        total_lessons: lessonCount,
        is_active: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,playlist_id' });
    } catch (err) {
      console.warn('Failed to record course import in Supabase:', err);
    }
  }
}

/**
 * Updates course status in Supabase when removed locally.
 */
export async function trackCourseRemoval({ user, courseId }) {
  if (!user || !isSupabaseConfigured() || !supabase) return;

  try {
    await supabase
      .from('user_courses')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('playlist_id', courseId);
  } catch (err) {
    console.warn('Failed to update course deletion status in Supabase:', err);
  }
}
