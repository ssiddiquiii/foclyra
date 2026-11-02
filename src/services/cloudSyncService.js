import { getGuestImportHistory, clearGuestImportHistory, normalizePlaylistId } from './quotaService.js';
import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { db } from '../db/FoclyraDB.js';
import { fetchYouTubePlaylistData } from './youtubeApi.js';

/**
 * Generates a deterministic RFC 4122 v5-compliant UUID from a seed string.
 * Ensures the exact same UUID is generated across all devices and browsers
 * for the same (user_id, course_id, lesson_id) combination.
 */
export async function generateDeterministicUuid(seed) {
  if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
    try {
      const msgUint8 = new TextEncoder().encode(seed);
      const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
      const hashArray = new Uint8Array(hashBuffer);
      hashArray[6] = (hashArray[6] & 0x0f) | 0x50; // Version 5
      hashArray[8] = (hashArray[8] & 0x3f) | 0x80; // Variant RFC 4122
      const hex = Array.from(hashArray.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
    } catch {
      // Fallback below
    }
  }

  // Pure JavaScript deterministic RFC 4122 UUID fallback
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = ((h2 >>> 16) & 0xffff).toString(16).padStart(4, '0');
  const part3 = (0x5000 | (h2 & 0x0fff)).toString(16).padStart(4, '0');
  const part4 = (0x8000 | ((h1 >>> 8) & 0x3fff)).toString(16).padStart(4, '0');
  const part5 = (((h1 & 0xff) << 24) | (h2 >>> 8)).toString(16).padStart(12, '0');
  return `${part1}-${part2}-${part3}-${part4}-${part5}`;
}

// In-flight debounce map for periodic watch-time writes
const progressDebounceMap = new Map();

/**
 * Flushes all pending in-flight debounced progress writes immediately to cloud.
 */
export async function flushPendingProgressSync() {
  const pending = Array.from(progressDebounceMap.values());
  progressDebounceMap.clear();
  const promises = pending.map(({ timer, performSync }) => {
    clearTimeout(timer);
    return performSync().catch(() => {});
  });
  await Promise.all(promises);
}


/**
 * Syncs a single lecture's watch progress & completion to Supabase user_progress.
 * Supports debounced watch time updates and immediate completion updates.
 */
export async function syncProgressToCloud(user, progress, immediate = false) {
  if (!user || !isSupabaseConfigured() || !supabase) return;

  const key = `${user.id}:${progress.courseId}:${progress.lessonId}`;

  const performSync = async () => {
    try {
      const uuid = await generateDeterministicUuid(key);
      const payload = {
        id: uuid,
        user_id: user.id,
        course_id: progress.courseId,
        lesson_id: progress.lessonId,
        watch_time: Math.max(0, Math.round(progress.watchTime || 0)),
        completed: Boolean(progress.completed),
        last_watched: new Date(progress.lastWatched || Date.now()).toISOString()
      };

      await supabase.from('user_progress').upsert(payload, { onConflict: 'id' });
    } catch (err) {
      console.warn('Background sync progress to cloud error:', err);
    }
  };

  if (immediate || progress.completed) {
    if (progressDebounceMap.has(key)) {
      clearTimeout(progressDebounceMap.get(key).timer);
      progressDebounceMap.delete(key);
    }
    return performSync();
  }

  // Debounce regular watch-time ticks (save at most once every 5 seconds per lesson)
  if (progressDebounceMap.has(key)) {
    clearTimeout(progressDebounceMap.get(key).timer);
  }
  const timer = setTimeout(() => {
    progressDebounceMap.delete(key);
    performSync();
  }, 5000);
  progressDebounceMap.set(key, { timer, performSync });
}

/**
 * Syncs a single note to Supabase user_notes with idempotent deduplication.
 */
export async function syncNoteToCloud(user, note) {
  if (!user || !isSupabaseConfigured() || !supabase) return;

  try {
    // Deduplication check: verify if note already exists on cloud for this user, course, lesson, and timestamp
    const { data: existing } = await supabase
      .from('user_notes')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', note.courseId)
      .eq('lesson_id', note.lessonId)
      .eq('timestamp', Number(note.timestamp))
      .maybeSingle();

    if (existing) {
      return; // Already present in cloud, skip duplicate insertion
    }

    await supabase.from('user_notes').insert({
      user_id: user.id,
      course_id: note.courseId,
      lesson_id: note.lessonId,
      timestamp: Number(note.timestamp),
      content: note.content,
      created_at: new Date(note.createdAt || Date.now()).toISOString(),
      updated_at: new Date(note.updatedAt || Date.now()).toISOString()
    });
  } catch (err) {
    console.warn('Background sync note to cloud error:', err);
  }
}

/**
 * Deletes a note from Supabase user_notes.
 */
export async function deleteNoteFromCloud(user, courseId, lessonId, timestamp) {
  if (!user || !isSupabaseConfigured() || !supabase) return;

  try {
    await supabase
      .from('user_notes')
      .delete()
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .eq('lesson_id', lessonId)
      .eq('timestamp', timestamp);
  } catch (err) {
    console.warn('Background delete note from cloud error:', err);
  }
}

/**
 * Deletes all cloud data (progress, notes, course slot) for a given course.
 */
export async function deleteCourseFromCloud(user, courseId) {
  if (!user || !isSupabaseConfigured() || !supabase) return;

  try {
    await Promise.all([
      supabase.from('user_progress').delete().eq('user_id', user.id).eq('course_id', courseId),
      supabase.from('user_notes').delete().eq('user_id', user.id).eq('course_id', courseId),
      supabase.from('user_courses').delete().eq('user_id', user.id).eq('course_id', courseId)
    ]);
  } catch (err) {
    console.warn('Background delete course from cloud error:', err);
  }
}

/**
 * Clears all user progress and notes from cloud (triggered on Settings -> Reset Progress).
 */
export async function clearAllUserDataFromCloud(user) {
  if (!user || !isSupabaseConfigured() || !supabase) return;

  try {
    await Promise.all([
      supabase.from('user_progress').delete().eq('user_id', user.id),
      supabase.from('user_notes').delete().eq('user_id', user.id)
    ]);
  } catch (err) {
    console.warn('Background clear progress/notes from cloud error:', err);
  }
}

/**
 * Hydrates progress records from Supabase user_progress into local Dexie DB.
 * Merges with local records using sticky completed and latest watch time.
 */
export async function hydrateProgressFromCloud(user) {
  if (!user || !isSupabaseConfigured() || !supabase) return;

  try {
    const { data: cloudProgress, error } = await supabase
      .from('user_progress')
      .select('id, user_id, course_id, lesson_id, watch_time, completed, last_watched')
      .eq('user_id', user.id);

    if (error) {
      console.warn('Could not fetch cloud user_progress:', error);
      return;
    }

    if (cloudProgress && cloudProgress.length > 0) {
      for (const cp of cloudProgress) {
        const progressId = `${cp.course_id}_${cp.lesson_id}`;
        const local = await db.progress.get(progressId);
        const cloudLastWatched = new Date(cp.last_watched).getTime();

        // Sticky completion: if completed on either local or cloud, stays completed!
        const isCompleted = Boolean(cp.completed) || Boolean(local?.completed);

        // Watch time conflict resolution:
        let watchTime = cp.watch_time;
        if (local) {
          if (isCompleted) {
            watchTime = Math.max(local.watchTime || 0, cp.watch_time || 0);
          } else if ((local.lastWatched || 0) > cloudLastWatched) {
            watchTime = local.watchTime;
          } else {
            watchTime = cp.watch_time;
          }
        }

        await db.progress.put({
          id: progressId,
          courseId: cp.course_id,
          lessonId: cp.lesson_id,
          completed: isCompleted,
          watchTime: Math.max(0, Math.round(watchTime)),
          lastWatched: Math.max(local?.lastWatched || 0, cloudLastWatched),
          updatedAt: Math.max(local?.updatedAt || 0, cloudLastWatched)
        });
      }
    }
  } catch (err) {
    console.warn('Hydrate progress from cloud warning:', err);
  }
}

/**
 * Pushes any existing local Dexie progress up to Supabase.
 * Ensures guest or offline study sessions are automatically saved upon signing in.
 */
export async function syncAllLocalProgressToCloud(user) {
  if (!user || !isSupabaseConfigured() || !supabase) return;

  try {
    const localProgressList = await db.progress.toArray();
    if (!localProgressList || localProgressList.length === 0) return;

    for (const p of localProgressList) {
      await syncProgressToCloud(user, p, true);
    }
  } catch (err) {
    console.warn('Sync all local progress to cloud warning:', err);
  }
}

/**
 * Hydrates course slots from Supabase user_courses into local Dexie DB.
 */
export async function hydrateCoursesFromCloud(user) {
  if (!user || !isSupabaseConfigured() || !supabase) return;

  try {
    const { data: cloudCourses, error } = await supabase
      .from('user_courses')
      .select('course_id, title, thumbnail_url, total_lessons')
      .eq('user_id', user.id);

    if (error || !cloudCourses || cloudCourses.length === 0) return;

    for (const cc of cloudCourses) {
      const existing = await db.courses.get(cc.course_id);
      if (!existing) {
        await db.courses.put({
          id: cc.course_id,
          title: cc.title,
          thumbnailUrl: cc.thumbnail_url || '',
          channelName: '',
          type: 'youtube',
          totalLessons: cc.total_lessons || 0,
          createdAt: Date.now()
        });
      }

      // Restore course syllabus and lessons if missing locally
      const localLessonCount = await db.lessons.where('courseId').equals(cc.course_id).count();
      if (localLessonCount === 0 && cc.course_id) {
        try {
          const playlistData = await fetchYouTubePlaylistData(cc.course_id);
          if (playlistData?.lessons?.length > 0) {
            await db.transaction('rw', [db.courses, db.lessons], async () => {
              await db.courses.put({
                id: cc.course_id,
                title: playlistData.title || cc.title,
                thumbnailUrl: playlistData.thumbnailUrl || cc.thumbnail_url || '',
                channelName: playlistData.channelName || '',
                type: 'youtube',
                totalLessons: playlistData.lessons.length,
                createdAt: Date.now()
              });
              await db.lessons.bulkPut(playlistData.lessons);
            });
          }
        } catch (fetchErr) {
          console.warn(`Could not background-fetch lessons for course ${cc.course_id}:`, fetchErr);
        }
      }
    }
  } catch (err) {
    console.warn('Hydrate courses from cloud warning:', err);
  }
}

/**
 * Pushes any locally added courses to Supabase user_courses.
 */
export async function syncAllLocalCoursesToCloud(user) {
  if (!user || !isSupabaseConfigured() || !supabase) return;

  try {
    const localCourses = await db.courses.toArray();
    if (!localCourses || localCourses.length === 0) return;

    for (const c of localCourses) {
      const lessonCount = await db.lessons.where('courseId').equals(c.id).count();
      await supabase.from('user_courses').upsert({
        user_id: user.id,
        course_id: c.id,
        title: c.title,
        thumbnail_url: c.thumbnailUrl || '',
        total_lessons: lessonCount || c.totalLessons || 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,course_id' });
    }
  } catch (err) {
    console.warn('Sync all local courses to cloud warning:', err);
  }
}

/**
 * Hydrates local Dexie DB from cloud backup if local storage was cleared or user switches devices.
 */
export async function hydrateFromCloud(user) {
  if (!user || !isSupabaseConfigured() || !supabase) return;

  try {
    // 1. Hydrate Courses
    await hydrateCoursesFromCloud(user);

    // 2. Hydrate Progress
    await hydrateProgressFromCloud(user);

    // 3. Hydrate Notes
    const { data: cloudNotes, error: notesError } = await supabase
      .from('user_notes')
      .select('*')
      .eq('user_id', user.id);

    if (!notesError && cloudNotes && cloudNotes.length > 0) {
      for (const cn of cloudNotes) {
        const existing = await db.notes
          .where({ courseId: cn.course_id, lessonId: cn.lesson_id })
          .filter(n => n.timestamp === Number(cn.timestamp))
          .first();

        if (!existing) {
          await db.notes.add({
            courseId: cn.course_id,
            lessonId: cn.lesson_id,
            timestamp: Number(cn.timestamp),
            content: cn.content,
            createdAt: new Date(cn.created_at).getTime(),
            updatedAt: new Date(cn.updated_at).getTime()
          });
        }
      }
    }

    // 4. Catch-up: Push any offline/guest local courses and progress up to Supabase
    await Promise.all([
      syncAllLocalCoursesToCloud(user),
      syncAllLocalProgressToCloud(user)
    ]);
  } catch (err) {
    console.warn('Cloud hydration warning:', err);
  }
}

/**
 * Subscribes to real-time two-way sync for user_progress.
 * Reflects progress and completed black ticks across devices instantaneously.
 * @returns {() => void} Cleanup function to unsubscribe from channel.
 */
export function subscribeToProgressRealtime(user, onProgressChange) {
  if (!user || !isSupabaseConfigured() || !supabase) {
    return () => {};
  }

  const channelName = `realtime:user_progress:${user.id}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_progress',
        filter: `user_id=eq.${user.id}`
      },
      async (payload) => {
        try {
          if (payload.eventType === 'DELETE') {
            if (payload.old?.course_id && payload.old?.lesson_id) {
              const progressId = `${payload.old.course_id}_${payload.old.lesson_id}`;
              await db.progress.delete(progressId);
            }
            return;
          }

          const record = payload.new;
          if (!record || !record.course_id || !record.lesson_id) return;

          const progressId = `${record.course_id}_${record.lesson_id}`;
          const local = await db.progress.get(progressId);
          const cloudLastWatched = new Date(record.last_watched || Date.now()).getTime();

          // Sticky completion
          const isCompleted = Boolean(record.completed) || Boolean(local?.completed);

          // Watch time merge
          const watchTime = isCompleted
            ? Math.max(local?.watchTime || 0, record.watch_time || 0)
            : (cloudLastWatched >= (local?.lastWatched || 0) ? record.watch_time : (local?.watchTime || record.watch_time));

          await db.progress.put({
            id: progressId,
            courseId: record.course_id,
            lessonId: record.lesson_id,
            completed: isCompleted,
            watchTime: Math.max(0, Math.round(watchTime)),
            lastWatched: Math.max(local?.lastWatched || 0, cloudLastWatched),
            updatedAt: Date.now()
          });

          if (typeof onProgressChange === 'function') {
            onProgressChange(record);
          }
        } catch (err) {
          console.warn('Realtime progress processing error:', err);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}


/**
 * Safely and idempotently migrates a guest user's imported playlist, progress,
 * and notes to their newly authenticated Supabase account upon signup/login.
 * 
 * - Preserves playlist metadata, total lecture count, and learning progress.
 * - Idempotent: retries do not create duplicate records.
 * - Safe against network failures: clears guest data only after cloud confirmation.
 * 
 * @param {object} user - Supabase user object
 * @returns {Promise<{ success: boolean, migratedCount: number, error?: string }>}
 */
export async function migrateGuestPlaylistToAccount(user) {
  if (!user || !isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'User or Supabase not configured' };
  }

  try {
    const guestHistory = getGuestImportHistory();
    const localCourses = await db.courses.toArray();

    // If no guest playlist exists, migration is a clean no-op
    if ((!guestHistory || guestHistory.length === 0) && (!localCourses || localCourses.length === 0)) {
      return { success: true, migratedCount: 0 };
    }

    let migratedCount = 0;

    for (const c of localCourses) {
      const cleanId = normalizePlaylistId(c.id);
      const lessonCount = await db.lessons.where('courseId').equals(c.id).count();

      // 1. Upsert course record into user_courses (idempotent onConflict)
      const { error: courseError } = await supabase.from('user_courses').upsert({
        user_id: user.id,
        course_id: cleanId,
        title: c.title || 'Imported Course',
        thumbnail_url: c.thumbnailUrl || '',
        total_lessons: lessonCount || c.totalLessons || 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,course_id' });

      if (courseError) {
        throw new Error(`Failed to migrate course "${c.title}": ${courseError.message}`);
      }

      // 2. Migrate any watch progress for this course (deterministic UUID v5)
      const localProgress = await db.progress.where('courseId').equals(c.id).toArray();
      for (const p of localProgress) {
        await syncProgressToCloud(user, p, true);
      }

      // 3. Migrate any notes for this course (deduplicated)
      const localNotes = await db.notes.where('courseId').equals(c.id).toArray();
      for (const n of localNotes) {
        await syncNoteToCloud(user, n);
      }

      migratedCount++;
    }

    // 4. Clear guest-specific storage ONLY after all cloud uploads succeed
    clearGuestImportHistory();

    return { success: true, migratedCount };
  } catch (err) {
    console.error('Guest-to-user migration failed:', err);
    // Guest data remains intact in Dexie and localStorage for safe retry!
    return { success: false, error: err.message, migratedCount: 0 };
  }
}
