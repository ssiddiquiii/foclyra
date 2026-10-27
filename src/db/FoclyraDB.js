import Dexie from 'dexie';
import { BackupSchema, parseBackupForImport } from '../types/schemas';

/**
 * Foclyra Local-First Browser Database
 * Manages IndexedDB tables using Dexie wrapper.
 */
class FoclyraDB extends Dexie {
  constructor() {
    super('FoclyraDB');
    
    // Define database tables and index keys
    this.version(1).stores({
      courses: 'id, title, type',
      lessons: 'id, courseId, index, type',
      progress: 'id, courseId, lessonId, completed',
      notes: '++id, courseId, lessonId, timestamp'
    });

    // Version 2: Add practice progress tracking table
    this.version(2).stores({
      courses: 'id, title, type',
      lessons: 'id, courseId, index, type',
      progress: 'id, courseId, lessonId, completed',
      notes: '++id, courseId, lessonId, timestamp',
      practiceProgress: 'id, courseId, lessonId, completed'
    });

    // Version 3: Add lastWatched index to progress table & compound [courseId+lessonId] to notes
    this.version(3).stores({
      courses: 'id, title, type',
      lessons: 'id, courseId, index, type',
      progress: 'id, courseId, lessonId, completed, lastWatched',
      notes: '++id, courseId, lessonId, [courseId+lessonId], timestamp',
      practiceProgress: 'id, courseId, lessonId, completed'
    });

    this.courses = this.table('courses');
    this.lessons = this.table('lessons');
    this.progress = this.table('progress');
    this.notes = this.table('notes');
    this.practiceProgress = this.table('practiceProgress');
  }

  /**
   * Seeds defaults only for a genuinely new, completely empty database.
   * Existing or partially populated databases are never repaired or overwritten.
   * @returns {Promise<void>}
   */
  async seedIfEmpty() {
    // Clean-slate onboarding: New public users start with a clean workspace (no default playlists seeded)
    return false;
  }

  /**
   * Clears user watch progress and timestamped notes while preserving all course catalogs and imported courses.
   * @returns {Promise<void>}
   */
  async clearProgressAndNotes() {
    await this.transaction('rw', [this.progress, this.notes, this.practiceProgress], async () => {
      await this.progress.clear();
      await this.notes.clear();
      await this.practiceProgress.clear();
    });
  }

  /**
   * Resets all progress, notes, and clears courses to a clean slate.
   * @returns {Promise<void>}
   */
  async resetDatabase() {
    await this.transaction('rw', [this.courses, this.lessons, this.progress, this.notes, this.practiceProgress], async () => {
      await this.courses.clear();
      await this.lessons.clear();
      await this.progress.clear();
      await this.notes.clear();
      await this.practiceProgress.clear();
    });
  }

  /**
   * Exports all database tables as a validated JSON backup structure.
   * @returns {Promise<object>} The backup payload.
   */
  async exportBackup() {
    const courses = await this.courses.toArray();
    const lessons = await this.lessons.toArray();
    const progress = await this.progress.toArray();
    const notes = await this.notes.toArray();
    const practiceProgress = await this.practiceProgress.toArray();

    const backupPayload = {
      version: 2,
      exportedAt: Date.now(),
      courses,
      lessons,
      progress,
      notes,
      practiceProgress
    };

    // Validate structure via Zod before returning
    return BackupSchema.parse(backupPayload);
  }

  /**
   * Imports and restores a backup JSON structure after strict validation.
   * @param {object} rawBackup The raw backup object to restore.
   * @returns {Promise<void>}
   */
  async importBackup(rawBackup) {
    // Validate backup structure via Zod
    const validatedBackup = parseBackupForImport(rawBackup);

    await this.transaction('rw', [this.courses, this.lessons, this.progress, this.notes, this.practiceProgress], async () => {
      // Clear current data
      await this.courses.clear();
      await this.lessons.clear();
      await this.progress.clear();
      await this.notes.clear();
      await this.practiceProgress.clear();

      // Ingest backed-up records
      await this.courses.bulkPut(validatedBackup.courses);
      await this.lessons.bulkPut(validatedBackup.lessons);
      await this.progress.bulkPut(validatedBackup.progress);
      await this.notes.bulkPut(validatedBackup.notes);
      if (validatedBackup.practiceProgress) {
        await this.practiceProgress.bulkPut(validatedBackup.practiceProgress);
      }
    });
  }
}

// Instantiate and export a single global database instance
export const db = new FoclyraDB();
