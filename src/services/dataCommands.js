import { db } from '../db/FoclyraDB';
import { removeGuestImport } from './quotaService';
import { CourseSchema, LessonSchema } from '../types/schemas';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import {
  syncProgressToCloud,
  syncNoteToCloud,
  deleteNoteFromCloud,
  deleteCourseFromCloud,
  clearAllUserDataFromCloud
} from './cloudSyncService';

let cachedUser = null;
let lastUserCheck = 0;

async function getAuthUser() {
  if (!isSupabaseConfigured() || !supabase) return null;
  const now = Date.now();
  if (cachedUser && (now - lastUserCheck < 10000)) {
    return cachedUser;
  }
  try {
    const { data: { session } } = await supabase.auth.getSession();
    cachedUser = session?.user || null;
    lastUserCheck = now;
    return cachedUser;
  } catch {
    return null;
  }
}

export async function saveProgress(courseId, lessonId, seconds, completed = false) {
  const progressId = `${courseId}_${lessonId}`;
  const now = Date.now();
  const watchTime = Math.max(0, Math.round(seconds));

  let finalCompleted = completed;
  await db.transaction('rw', db.progress, async () => {
    const existing = await db.progress.get(progressId);
    finalCompleted = completed || existing?.completed === true;
    await db.progress.put({
      ...existing,
      id: progressId,
      courseId,
      lessonId,
      completed: finalCompleted,
      watchTime,
      lastWatched: now,
      updatedAt: now
    });
  });

  // Background Cloud Sync
  getAuthUser().then(user => {
    if (user) {
      syncProgressToCloud(user, {
        courseId,
        lessonId,
        watchTime,
        completed: finalCompleted,
        lastWatched: now
      }, false);
    }
  }).catch(() => {});
}

export async function setLessonCompletion(courseId, lessonId, completed, seconds = 0) {
  const progressId = `${courseId}_${lessonId}`;
  const now = Date.now();
  const watchTime = Math.max(0, Math.round(seconds));

  await db.transaction('rw', db.progress, async () => {
    const existing = await db.progress.get(progressId);
    await db.progress.put({
      ...existing,
      id: progressId,
      courseId,
      lessonId,
      completed,
      watchTime,
      lastWatched: now,
      updatedAt: now
    });
  });

  // Immediate Cloud Sync for explicit completion toggle
  getAuthUser().then(user => {
    if (user) {
      syncProgressToCloud(user, {
        courseId,
        lessonId,
        watchTime,
        completed,
        lastWatched: now
      }, true);
    }
  }).catch(() => {});
}

export async function importCourse(courseInput, lessonsInput) {
  const course = CourseSchema.parse(courseInput);
  const lessons = lessonsInput.map(lesson => LessonSchema.parse(lesson));

  if (lessons.some(lesson => lesson.courseId !== course.id)) {
    throw new Error('Every imported lesson must belong to the imported course.');
  }

  await db.transaction('rw', [db.courses, db.lessons], async () => {
    const existingLessons = await db.lessons.bulkGet(lessons.map(lesson => lesson.id));
    const collision = existingLessons.find(
      lesson => lesson && lesson.courseId !== course.id
    );
    if (collision) {
      throw new Error(
        `Cannot import this playlist because lesson "${collision.id}" already belongs to another course.`
      );
    }

    await db.courses.put(course);
    await db.lessons.bulkPut(lessons);
  });
}

export async function deleteCourse(courseId) {
  await db.transaction('rw', [db.courses, db.lessons, db.progress, db.notes, db.practiceProgress], async () => {
    await db.courses.delete(courseId);
    await db.lessons.where('courseId').equals(courseId).delete();
    await db.progress.where('courseId').equals(courseId).delete();
    await db.notes.where('courseId').equals(courseId).delete();
    await db.practiceProgress.where('courseId').equals(courseId).delete();
  });

  // Remove from guest history quota if guest
  removeGuestImport(courseId);

  // Clean up course slot, progress and notes in cloud
  getAuthUser().then(user => {
    if (user) {
      deleteCourseFromCloud(user, courseId);
    }
  }).catch(() => {});
}

export async function createNote({ courseId, lessonId, timestamp, content }) {
  const now = Date.now();
  const noteId = await db.notes.add({
    courseId,
    lessonId,
    timestamp,
    content,
    createdAt: now,
    updatedAt: now
  });

  getAuthUser().then(user => {
    if (user) {
      syncNoteToCloud(user, {
        courseId,
        lessonId,
        timestamp,
        content,
        createdAt: now,
        updatedAt: now
      });
    }
  }).catch(() => {});

  return noteId;
}

export async function updateNote(noteId, content) {
  const now = Date.now();
  return db.transaction('rw', db.notes, async () => {
    const existing = await db.notes.get(noteId);
    if (!existing) throw new Error('The note no longer exists.');
    await db.notes.put({
      ...existing,
      content,
      updatedAt: now
    });
  });
}

export async function deleteNote(noteId) {
  const existing = await db.notes.get(noteId);
  const result = await db.notes.delete(noteId);

  if (existing) {
    getAuthUser().then(user => {
      if (user) {
        deleteNoteFromCloud(user, existing.courseId, existing.lessonId, existing.timestamp);
      }
    }).catch(() => {});
  }

  return result;
}

/**
 * Persists discovered video duration back into IndexedDB.
 * Converts raw seconds to digital duration string (e.g. 14:22 or 1:04:12).
 */
export async function updateLessonDuration(lessonId, seconds) {
  if (!lessonId || typeof seconds !== 'number' || seconds <= 0 || !isFinite(seconds)) return;
  const totalSecs = Math.round(seconds);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const remainingSecs = totalSecs % 60;

  const formatted = hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`
    : `${minutes}:${remainingSecs.toString().padStart(2, '0')}`;

  try {
    const existing = await db.lessons.get(lessonId);
    if (existing && (!existing.duration || existing.duration === '0:00')) {
      await db.lessons.update(lessonId, { 
        duration: formatted,
        durationSeconds: totalSecs
      });
    }
  } catch (err) {
    console.warn('Failed to update lesson duration in DB:', err);
  }
}

export async function getNotesExportBundle(courseId = null) {
  if (courseId) {
    const [course, lessons, notes] = await Promise.all([
      db.courses.get(courseId),
      db.lessons.where('courseId').equals(courseId).sortBy('index'),
      db.notes.where('courseId').equals(courseId).toArray()
    ]);
    return {
      courses: course ? [course] : [],
      lessons,
      notes
    };
  }

  const [courses, lessons, notes] = await Promise.all([
    db.courses.toArray(),
    db.lessons.toArray(),
    db.notes.toArray()
  ]);

  return { courses, lessons, notes };
}

export const exportNotes = () => db.notes.toArray();
export const exportBackup = () => db.exportBackup();
export const importBackup = backup => db.importBackup(backup);
export const clearProgressAndNotes = async () => {
  await db.clearProgressAndNotes();
  getAuthUser().then(user => {
    if (user) {
      clearAllUserDataFromCloud(user);
    }
  }).catch(() => {});
};
export const resetDatabase = () => db.resetDatabase();
