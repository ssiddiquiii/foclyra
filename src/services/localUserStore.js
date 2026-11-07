import { db } from '../db/FoclyraDB.js';

/**
 * Snapshots a user's local Dexie state (courses, lessons, progress, notes, practiceProgress)
 * to localStorage so switching accounts never destroys local offline data.
 */
export async function snapshotUserLocalData(userId) {
  if (!userId || userId === 'guest') return;
  try {
    const [courses, lessons, progress, notes, practiceProgress] = await Promise.all([
      db.courses.toArray(),
      db.lessons.toArray(),
      db.progress.toArray(),
      db.notes.toArray(),
      db.practiceProgress.toArray()
    ]);
    if (courses.length > 0 || progress.length > 0 || notes.length > 0) {
      localStorage.setItem(`foclyra_user_cache_${userId}`, JSON.stringify({
        courses, lessons, progress, notes, practiceProgress, savedAt: Date.now()
      }));
    }
  } catch (err) {
    console.warn('Failed to snapshot user local data:', err);
  }
}

/**
 * Restores a user's local Dexie state from their local snapshot.
 */
export async function restoreUserLocalData(userId) {
  if (!userId || userId === 'guest') return false;
  try {
    const raw = localStorage.getItem(`foclyra_user_cache_${userId}`);
    if (!raw) return false;
    const cache = JSON.parse(raw);
    await db.transaction('rw', [db.courses, db.lessons, db.progress, db.notes, db.practiceProgress], async () => {
      await db.courses.clear();
      await db.lessons.clear();
      await db.progress.clear();
      await db.notes.clear();
      await db.practiceProgress.clear();

      if (cache.courses?.length) await db.courses.bulkPut(cache.courses);
      if (cache.lessons?.length) await db.lessons.bulkPut(cache.lessons);
      if (cache.progress?.length) await db.progress.bulkPut(cache.progress);
      if (cache.notes?.length) await db.notes.bulkPut(cache.notes);
      if (cache.practiceProgress?.length) await db.practiceProgress.bulkPut(cache.practiceProgress);
    });
    return true;
  } catch (err) {
    console.warn('Failed to restore user local data:', err);
    return false;
  }
}
