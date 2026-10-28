import { db } from '../db/FoclyraDB';
import { CourseSchema, LessonSchema } from '../types/schemas';

export async function saveProgress(courseId, lessonId, seconds, completed = false) {
  const progressId = `${courseId}_${lessonId}`;
  const now = Date.now();

  await db.transaction('rw', db.progress, async () => {
    const existing = await db.progress.get(progressId);
    await db.progress.put({
      ...existing,
      id: progressId,
      courseId,
      lessonId,
      completed: completed || existing?.completed === true,
      watchTime: Math.max(0, Math.round(seconds)),
      lastWatched: now,
      updatedAt: now
    });
  });
}

export async function setLessonCompletion(courseId, lessonId, completed, seconds = 0) {
  const progressId = `${courseId}_${lessonId}`;
  const now = Date.now();

  await db.transaction('rw', db.progress, async () => {
    const existing = await db.progress.get(progressId);
    await db.progress.put({
      ...existing,
      id: progressId,
      courseId,
      lessonId,
      completed,
      watchTime: Math.max(0, Math.round(seconds)),
      lastWatched: now,
      updatedAt: now
    });
  });
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
}


export async function createNote({ courseId, lessonId, timestamp, content }) {
  const now = Date.now();
  return db.notes.add({
    courseId,
    lessonId,
    timestamp,
    content,
    createdAt: now,
    updatedAt: now
  });
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

export function deleteNote(noteId) {
  return db.notes.delete(noteId);
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
export const clearProgressAndNotes = () => db.clearProgressAndNotes();
export const resetDatabase = () => db.resetDatabase();
