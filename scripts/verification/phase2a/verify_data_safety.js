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
  console.log('--- Phase 2A Data Safety Verification ---');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

    const result = await page.evaluate(async () => {
      const { db } = await import('/src/db/FoclyraDB.js');
      const {
        saveProgress,
        setLessonCompletion,
        importCourse
      } = await import('/src/services/dataCommands.js');

      const tables = [db.courses, db.lessons, db.progress, db.notes, db.practiceProgress];
      const clearAll = () => db.transaction('rw', tables, async () => {
        await Promise.all(tables.map(table => table.clear()));
      });
      const baseCourse = {
        id: 'phase2a-course',
        title: 'Phase 2A Course',
        description: '',
        thumbnailUrl: '',
        channelName: 'Test',
        type: 'youtube',
        udemyUrl: ''
      };
      const baseLesson = {
        id: 'phase2a-lesson',
        courseId: baseCourse.id,
        title: 'Phase 2A Lesson',
        description: '',
        thumbnailUrl: '',
        duration: '10:00',
        index: 1,
        type: 'youtube'
      };
      const backup = (overrides = {}) => ({
        version: 2,
        exportedAt: Date.now(),
        courses: [baseCourse],
        lessons: [baseLesson],
        progress: [],
        notes: [],
        practiceProgress: [],
        ...overrides
      });

      await clearAll();
      await db.importBackup(backup({
        version: 1,
        progress: [{
          id: `${baseCourse.id}_${baseLesson.id}`,
          courseId: baseCourse.id,
          lessonId: baseLesson.id,
          completed: false,
          currentTime: 321,
          lastWatched: Date.now(),
          legacyMarker: 'preserve-me'
        }]
      }));
      const importedLegacy = await db.progress.get(`${baseCourse.id}_${baseLesson.id}`);
      const exportedLegacy = (await db.exportBackup()).progress[0];

      await saveProgress(baseCourse.id, baseLesson.id, 400, true);
      await saveProgress(baseCourse.id, baseLesson.id, 15, false);
      const sticky = await db.progress.get(`${baseCourse.id}_${baseLesson.id}`);
      await setLessonCompletion(baseCourse.id, baseLesson.id, false, 0);
      const explicitlyUncompleted = await db.progress.get(`${baseCourse.id}_${baseLesson.id}`);

      await clearAll();
      const concurrentSeedResults = await Promise.all([
        db.seedIfEmpty(),
        db.seedIfEmpty(),
        db.seedIfEmpty()
      ]);
      const seedCounts = {
        courses: await db.courses.count(),
        lessons: await db.lessons.count()
      };
      const seededCourse = await db.courses.toCollection().first();
      await db.courses.update(seededCourse.id, { title: 'User Customized Title' });
      const populatedSeedResult = await db.seedIfEmpty();
      const preservedTitle = (await db.courses.get(seededCourse.id)).title;

      await clearAll();
      const legacyCourse = {
        ...baseCourse,
        id: 'udemy-agentic-ai',
        title: 'User Legacy Course'
      };
      await db.courses.add(legacyCourse);
      const partialSeedResult = await db.seedIfEmpty();
      const legacyStillPresent = await db.courses.get(legacyCourse.id);

      await clearAll();
      await db.courses.add(baseCourse);
      await db.lessons.add(baseLesson);
      let collisionMessage = '';
      try {
        await importCourse(
          { ...baseCourse, id: 'phase2a-other-course', title: 'Other Course' },
          [{ ...baseLesson, courseId: 'phase2a-other-course' }]
        );
      } catch (error) {
        collisionMessage = error.message;
      }
      const collisionState = {
        originalOwner: (await db.lessons.get(baseLesson.id))?.courseId,
        otherCourseExists: Boolean(await db.courses.get('phase2a-other-course'))
      };

      await db.progress.put({
        id: `${baseCourse.id}_${baseLesson.id}`,
        courseId: baseCourse.id,
        lessonId: baseLesson.id,
        completed: true,
        watchTime: 42,
        lastWatched: Date.now()
      });
      const sentinelBefore = await db.progress.get(`${baseCourse.id}_${baseLesson.id}`);
      const invalidBackups = [
        backup({ version: 99 }),
        backup({ lessons: [{ ...baseLesson, courseId: 'missing-course' }] }),
        backup({ progress: [{
          id: 'orphan-progress',
          courseId: baseCourse.id,
          lessonId: 'missing-lesson',
          completed: false,
          watchTime: 1,
          lastWatched: Date.now()
        }] }),
        backup({ notes: [{
          id: 1,
          courseId: 'missing-course',
          lessonId: baseLesson.id,
          timestamp: 1,
          content: 'orphan',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }] }),
        backup({ practiceProgress: [{
          id: 'orphan-practice',
          courseId: baseCourse.id,
          lessonId: 'missing-lesson',
          completed: true,
          completedAt: Date.now()
        }] })
      ];
      const rejectionMessages = [];
      for (const invalidBackup of invalidBackups) {
        try {
          await db.importBackup(invalidBackup);
          rejectionMessages.push('');
        } catch (error) {
          rejectionMessages.push(error.message);
        }
      }
      const sentinelAfter = await db.progress.get(`${baseCourse.id}_${baseLesson.id}`);

      await db.resetDatabase();
      const resetCounts = {
        courses: await db.courses.count(),
        lessons: await db.lessons.count(),
        progress: await db.progress.count(),
        notes: await db.notes.count(),
        practiceProgress: await db.practiceProgress.count()
      };

      return {
        importedLegacy,
        exportedLegacy,
        sticky,
        explicitlyUncompleted,
        concurrentSeedResults,
        seedCounts,
        populatedSeedResult,
        preservedTitle,
        partialSeedResult,
        legacyStillPresent,
        collisionMessage,
        collisionState,
        rejectionMessages,
        sentinelBefore,
        sentinelAfter,
        resetCounts
      };
    });

    assert(result.importedLegacy.currentTime === 321, 'legacy currentTime remains stored after import');
    assert(result.importedLegacy.watchTime === 321, 'legacy currentTime derives watchTime on import');
    assert(result.exportedLegacy.currentTime === 321, 'legacy currentTime survives export');
    assert(result.exportedLegacy.legacyMarker === 'preserve-me', 'unknown legacy progress fields survive backup parsing');
    assert(result.sticky.completed === true, 'routine progress save cannot uncomplete a completed lesson');
    assert(result.sticky.legacyMarker === 'preserve-me', 'routine progress save preserves unknown legacy fields');
    assert(result.explicitlyUncompleted.completed === false, 'explicit completion command can uncomplete a lesson');
    assert(result.explicitlyUncompleted.legacyMarker === 'preserve-me', 'explicit completion command preserves unknown fields');
    assert(result.concurrentSeedResults.filter(Boolean).length === 1, 'concurrent seed calls seed exactly once');
    assert(result.seedCounts.courses > 0 && result.seedCounts.lessons > 0, 'fresh empty database receives defaults');
    assert(result.populatedSeedResult === false, 'populated database is not reseeded');
    assert(result.preservedTitle === 'User Customized Title', 'user-modified seed course is not overwritten');
    assert(result.partialSeedResult === false, 'partially populated database is not seeded');
    assert(result.legacyStillPresent?.title === 'User Legacy Course', 'legacy hard-coded course ID is not deleted');
    assert(result.collisionMessage.includes('already belongs to another course'), 'cross-course lesson collision is rejected');
    assert(result.collisionState.originalOwner === 'phase2a-course', 'collision preserves original lesson ownership');
    assert(result.collisionState.otherCourseExists === false, 'collision aborts course creation atomically');
    assert(result.rejectionMessages.every(Boolean), 'unsupported and relationally invalid backups are rejected');
    assert(JSON.stringify(result.sentinelBefore) === JSON.stringify(result.sentinelAfter), 'invalid backups preserve sentinel progress');
    assert(
      result.resetCounts.courses > 0 &&
      result.resetCounts.lessons > 0 &&
      result.resetCounts.progress === 0 &&
      result.resetCounts.notes === 0 &&
      result.resetCounts.practiceProgress === 0,
      'factory reset atomically restores defaults and clears user activity'
    );
  } catch (error) {
    console.error(error);
    failed++;
  } finally {
    await browser.close();
  }

  console.log(`\nPhase 2A Results: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

run();
