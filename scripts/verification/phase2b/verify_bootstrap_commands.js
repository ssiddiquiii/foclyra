import { chromium } from 'playwright';

const BASE_URL = process.env.FOCLYRA_TEST_BASE_URL || 'http://127.0.0.1:4173';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

async function run() {
  console.log('--- Phase 2B Bootstrap and Command Boundary Verification ---');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

    const result = await page.evaluate(async () => {
      const { createBootstrapController } = await import('/src/db/bootstrap.js');
      const { db } = await import('/src/db/FoclyraDB.js');
      const commands = await import('/src/services/dataCommands.js');

      let openCalls = 0;
      let seedCalls = 0;
      const controller = createBootstrapController({
        openDatabase: async () => {
          openCalls++;
          await new Promise(resolve => setTimeout(resolve, 10));
        },
        seedDatabase: async () => {
          seedCalls++;
        }
      });
      const concurrentPromises = [
        controller.bootstrap(),
        controller.bootstrap(),
        controller.bootstrap()
      ];
      await Promise.all(concurrentPromises);
      const concurrentCounts = { openCalls, seedCalls };

      await controller.retry();
      const retryCounts = { openCalls, seedCalls };

      let failureOpenCalls = 0;
      let failureSeedCalls = 0;
      const retryController = createBootstrapController({
        openDatabase: async () => {
          failureOpenCalls++;
          if (failureOpenCalls === 1) throw new Error('intentional bootstrap failure');
        },
        seedDatabase: async () => {
          failureSeedCalls++;
        }
      });
      let firstFailure = '';
      try {
        await retryController.bootstrap();
      } catch (error) {
        firstFailure = error.message;
      }
      await retryController.retry();

      const tables = [db.courses, db.lessons, db.progress, db.notes, db.practiceProgress];
      await db.transaction('rw', tables, async () => {
        await Promise.all(tables.map(table => table.clear()));
      });

      const course = {
        id: 'phase2b-course',
        title: 'Phase 2B Course',
        description: '',
        thumbnailUrl: '',
        channelName: 'Test',
        type: 'youtube',
        udemyUrl: ''
      };
      const lesson = {
        id: 'phase2b-lesson',
        courseId: course.id,
        title: 'Phase 2B Lesson',
        description: '',
        thumbnailUrl: '',
        duration: '5:00',
        index: 1,
        type: 'youtube'
      };

      const importReturn = await commands.importCourse(course, [lesson]);
      const saveReturn = await commands.saveProgress(course.id, lesson.id, 90, true);
      const progressAfterSave = await db.progress.get(`${course.id}_${lesson.id}`);
      const completionReturn = await commands.setLessonCompletion(course.id, lesson.id, false, 0);
      const progressAfterExplicitChange = await db.progress.get(`${course.id}_${lesson.id}`);
      const noteId = await commands.createNote({
        courseId: course.id,
        lessonId: lesson.id,
        timestamp: 12,
        content: 'Phase 2B note'
      });
      const noteCreated = await db.notes.get(noteId);
      const deleteNoteReturn = await commands.deleteNote(noteId);
      const noteDeleted = !(await db.notes.get(noteId));
      const toggleOnReturn = await commands.togglePractice(
        course.id,
        lesson.id,
        'q1',
        '',
        true
      );
      const practiceCreated = await db.practiceProgress.get(`${lesson.id}_q1`);
      const toggleOffReturn = await commands.togglePractice(
        course.id,
        lesson.id,
        'q1',
        '',
        false
      );
      const practiceDeleted = !(await db.practiceProgress.get(`${lesson.id}_q1`));
      const backup = await commands.exportBackup();

      await commands.clearProgressAndNotes();
      const clearedCounts = {
        courses: await db.courses.count(),
        lessons: await db.lessons.count(),
        progress: await db.progress.count(),
        notes: await db.notes.count(),
        practiceProgress: await db.practiceProgress.count()
      };
      const importBackupReturn = await commands.importBackup(backup);
      const restoredProgress = await db.progress.get(`${course.id}_${lesson.id}`);
      const deleteCourseReturn = await commands.deleteCourse(course.id);
      const deletedCourseState = {
        course: await db.courses.get(course.id),
        lesson: await db.lessons.get(lesson.id),
        progress: await db.progress.get(`${course.id}_${lesson.id}`)
      };
      const resetReturn = await commands.resetDatabase();
      const resetCounts = {
        courses: await db.courses.count(),
        lessons: await db.lessons.count(),
        progress: await db.progress.count(),
        notes: await db.notes.count(),
        practiceProgress: await db.practiceProgress.count()
      };

      const voidCommandContracts = [
        importReturn,
        saveReturn,
        completionReturn,
        deleteNoteReturn,
        toggleOnReturn,
        toggleOffReturn,
        importBackupReturn,
        deleteCourseReturn,
        resetReturn
      ].every(value => value === undefined);

      return {
        concurrentCounts,
        retryCounts,
        firstFailure,
        failureOpenCalls,
        failureSeedCalls,
        voidCommandContracts,
        progressAfterSave,
        progressAfterExplicitChange,
        noteId,
        noteCreated,
        noteDeleted,
        practiceCreated,
        practiceDeleted,
        backup,
        clearedCounts,
        restoredProgress,
        deletedCourseState,
        resetCounts
      };
    });

    assert(
      result.concurrentCounts.openCalls === 1 && result.concurrentCounts.seedCalls === 1,
      'concurrent and StrictMode-style bootstrap calls share one flight'
    );
    assert(
      result.retryCounts.openCalls === 2 && result.retryCounts.seedCalls === 2,
      'explicit retry starts one new bootstrap flight'
    );
    assert(result.firstFailure === 'intentional bootstrap failure', 'bootstrap failure propagates to the gate');
    assert(
      result.failureOpenCalls === 2 && result.failureSeedCalls === 1,
      'failed bootstrap resets its lock and retry succeeds'
    );
    assert(
      result.voidCommandContracts,
      'void commands preserve their Promise<void> contracts'
    );
    assert(result.progressAfterSave.completed === true, 'saveProgress writes sticky completion');
    assert(result.progressAfterExplicitChange.completed === false, 'explicit completion command can uncomplete');
    assert(Number.isInteger(result.noteId) && result.noteCreated.content === 'Phase 2B note', 'createNote returns its numeric key');
    assert(result.noteDeleted, 'deleteNote removes only the requested note');
    assert(result.practiceCreated.completed === true && result.practiceDeleted, 'togglePractice preserves add/delete semantics');
    assert(result.backup.version === 2, 'exportBackup preserves backup version 2 contract');
    assert(
      result.clearedCounts.courses === 1 &&
      result.clearedCounts.lessons === 1 &&
      result.clearedCounts.progress === 0 &&
      result.clearedCounts.notes === 0 &&
      result.clearedCounts.practiceProgress === 0,
      'clearProgressAndNotes preserves catalog and clears activity'
    );
    assert(result.restoredProgress.completed === false, 'importBackup restores the exported progress payload');
    assert(
      !result.deletedCourseState.course &&
      !result.deletedCourseState.lesson &&
      !result.deletedCourseState.progress,
      'deleteCourse removes its complete course-scoped data'
    );
    assert(
      result.resetCounts.courses > 0 &&
      result.resetCounts.lessons > 0 &&
      result.resetCounts.progress === 0 &&
      result.resetCounts.notes === 0 &&
      result.resetCounts.practiceProgress === 0,
      'resetDatabase preserves Phase 2A atomic reset outcome'
    );
  } catch (error) {
    console.error(error);
    failed++;
  } finally {
    await browser.close();
  }

  console.log(`\nPhase 2B Results: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

run();
