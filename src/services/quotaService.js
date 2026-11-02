import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { db } from '../db/FoclyraDB.js';

const GUEST_IMPORTS_STORAGE_KEY = 'foclyra_guest_imported_playlists';
export const GUEST_MAX_PLAYLISTS = 1;
export const REGISTERED_MAX_PLAYLISTS = 5;

/**
 * Extracts and normalizes a clean YouTube playlist ID from raw ID or full URL.
 * Supports:
 * - Direct IDs (e.g. PLu71SKxNbfoBuX3f4EOACle2y-tRC5Q37)
 * - Standard playlist URLs (youtube.com/playlist?list=PL...)
 * - Watch URLs with playlist (youtube.com/watch?v=...&list=PL...)
 * - Shortened share URLs (youtu.be/... or music.youtube.com/...)
 */
export function normalizePlaylistId(input) {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{12,}$/.test(trimmed) && !trimmed.includes('http') && !trimmed.includes('/')) {
    return trimmed;
  }
  try {
    const urlObj = new URL(trimmed);
    const listId = urlObj.searchParams.get('list');
    if (listId) return listId;
  } catch (_) {
    const match = trimmed.match(/[&?]list=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
  }
  return trimmed;
}

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
    const cleanId = normalizePlaylistId(playlistId);
    const history = getGuestImportHistory();
    if (!history.includes(cleanId)) {
      history.push(cleanId);
      localStorage.setItem(GUEST_IMPORTS_STORAGE_KEY, JSON.stringify(history));
    }
  } catch (err) {
    console.warn('Failed to record guest import in localStorage:', err);
  }
}

/**
 * Removes a playlist from guest history (e.g. when course is deleted to free slot).
 */
export function removeGuestImport(playlistId) {
  try {
    const cleanId = normalizePlaylistId(playlistId);
    const history = getGuestImportHistory();
    const updated = history.filter(id => id !== cleanId);
    localStorage.setItem(GUEST_IMPORTS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to remove guest import from localStorage:', err);
  }
}

/**
 * Clears all guest import history from browser storage (e.g. after successful migration to account).
 */
export function clearGuestImportHistory() {
  try {
    localStorage.removeItem(GUEST_IMPORTS_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear guest import history from localStorage:', err);
  }
}

/**
 * Validates whether the user (guest or registered) is allowed to import this playlist.
 * @param {object} params
 * @param {object|null} params.user Current Supabase user (null for guest)
 * @param {string} params.playlistId The YouTube playlist ID or course URL
 * @returns {Promise<{ allowed: boolean, reason?: string, currentCount: number, maxLimit: number, isReimport: boolean }>}
 */
export async function checkPlaylistImportQuota({ user, playlistId }) {
  const cleanId = normalizePlaylistId(playlistId);

  // GUEST USER CHECKS
  if (!user) {
    const guestHistory = getGuestImportHistory();
    const currentCourses = await db.courses.count();
    const isReimport = guestHistory.includes(cleanId);

    // Re-importing their allowed trial course is always free
    if (isReimport) {
      return {
        allowed: true,
        reason: null,
        currentCount: guestHistory.length,
        currentActiveCount: currentCourses,
        maxLimit: GUEST_MAX_PLAYLISTS,
        isReimport: true
      };
    }

    // If guest already used their trial allowance and is trying a new playlist
    if (currentCourses >= GUEST_MAX_PLAYLISTS || guestHistory.length >= GUEST_MAX_PLAYLISTS) {
      return {
        allowed: false,
        reason: 'GUEST_LIMIT_REACHED',
        currentCount: guestHistory.length,
        currentActiveCount: currentCourses,
        maxLimit: GUEST_MAX_PLAYLISTS,
        isReimport: false
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

  // REGISTERED USER CHECKS (Cloud Supabase first)
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: userCourses, error } = await supabase
        .from('user_courses')
        .select('course_id')
        .eq('user_id', user.id);

      if (error) {
        console.warn('Could not query Supabase user_courses, falling back to local DB check:', error);
      } else if (userCourses) {
        const uniquePlaylists = [...new Set(userCourses.map(c => c.course_id))];
        const isReimport = uniquePlaylists.includes(cleanId);

        if (isReimport) {
          // Re-importing a previously imported playlist does not consume an extra slot
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
  const existingLocal = await db.courses.get(cleanId);

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
  const cleanId = normalizePlaylistId(course.id);

  if (!user) {
    recordGuestImport(cleanId);
    return;
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('user_courses').upsert({
        user_id: user.id,
        course_id: cleanId,
        title: course.title,
        thumbnail_url: course.thumbnailUrl || '',
        total_lessons: lessonCount,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,course_id' });
    } catch (err) {
      console.warn('Failed to record course import in Supabase:', err);
    }
  }
}

/**
 * Frees course slot in Supabase and local storage when removed.
 */
export async function trackCourseRemoval({ user, courseId }) {
  const cleanId = normalizePlaylistId(courseId);

  if (!user) {
    removeGuestImport(cleanId);
    return;
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('user_courses')
        .delete()
        .eq('user_id', user.id)
        .eq('course_id', cleanId);
    } catch (err) {
      console.warn('Failed to delete course in Supabase:', err);
    }
  }
}
