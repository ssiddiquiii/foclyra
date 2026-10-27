import { supabase, isSupabaseConfigured } from './supabaseClient';
import { db } from '../db/FocusFlowDB';

/**
 * Background Cloud Synchronization Engine.
 * Syncs user courses, notes, and progress between Dexie (IndexedDB) and Supabase Postgres.
 */
export async function syncNoteToCloud(user, note) {
  if (!user || !isSupabaseConfigured() || !supabase) return;

  try {
    await supabase.from('user_notes').insert({
      user_id: user.id,
      course_id: note.courseId,
      lesson_id: note.lessonId,
      timestamp: note.timestamp,
      content: note.content,
      created_at: new Date(note.createdAt || Date.now()).toISOString(),
      updated_at: new Date(note.updatedAt || Date.now()).toISOString()
    });
  } catch (err) {
    console.warn('Background sync note to cloud error:', err);
  }
}

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
 * Hydrates local Dexie DB from cloud backup if local storage was cleared or user switches devices.
 */
export async function hydrateFromCloud(user) {
  if (!user || !isSupabaseConfigured() || !supabase) return;

  try {
    // Fetch user notes from cloud
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
  } catch (err) {
    console.warn('Cloud hydration warning:', err);
  }
}
