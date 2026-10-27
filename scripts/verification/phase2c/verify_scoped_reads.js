import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import {
  getWatchedSeconds,
  selectContinueLearningPath,
  selectCourseDetailModel,
  selectCourseProgressMap,
  selectDashboardStats,
  selectSortedCourses
} from '../../../src/utils/selectors.js';

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

const courses = [
  { id: 'course-b', title: 'Beta' },
  { id: 'course-a', title: 'Alpha' }
];
const lessons = [
  { id: 'a-2', courseId: 'course-a', index: 2 },
  { id: 'b-1', courseId: 'course-b', index: 1 },
  { id: 'a-1', courseId: 'course-a', index: 1 }
];

async function run() {
  console.log('--- Phase 2C Scoped Read Model Verification ---');

  assert(getWatchedSeconds({ watchTime: 0, currentTime: 50 }) === 0, 'explicit zero watchTime remains authoritative');
  assert(getWatchedSeconds({ currentTime: 50 }) === 50, 'legacy currentTime supplies watched seconds');
  assert(getWatchedSeconds(null) === 0, 'missing progress supplies zero watched seconds');

  const progressMap = selectCourseProgressMap(courses, lessons, [
    { id: 'course-a_a-1', courseId: 'course-a', lessonId: 'a-1', completed: true },
    { id: 'course-b_b-1', courseId: 'course-b', lessonId: 'b-1', completed: false }
  ]);
  assert(progressMap['course-a'] === 50 && progressMap['course-b'] === 0, 'course progress map is computed in one pure pass');

  const continueInProgress = selectContinueLearningPath(courses, lessons, [
    { id: 'course-a_a-1', courseId: 'course-a', lessonId: 'a-1', completed: false, watchTime: 5, lastWatched: 20 },
    { id: 'course-b_b-1', courseId: 'course-b', lessonId: 'b-1', completed: false, watchTime: 5, lastWatched: 10 }
  ]);
  assert(continueInProgress.courseId === 'course-a' && continueInProgress.lessonId === 'a-1', 'continue selector chooses latest incomplete progress');

  const continueAfterCompleted = selectContinueLearningPath(courses, lessons, [
    { id: 'course-a_a-1', courseId: 'course-a', lessonId: 'a-1', completed: true, lastWatched: 30 }
  ]);
  assert(continueAfterCompleted.lessonId === 'a-2', 'continue selector chooses first incomplete lesson in the recent course');

  const emptyContinue = selectContinueLearningPath([], [], []);
  assert(emptyContinue === null, 'continue selector handles an empty catalog');

  const fallbackContinue = selectContinueLearningPath(courses, lessons, []);
  assert(fallbackContinue.courseId === 'course-a' && fallbackContinue.lessonId === 'a-1', 'continue fallback uses deterministic title and lesson ordering');

  const tieOrder = selectSortedCourses(courses, [
    { courseId: 'course-a', updatedAt: 10 },
    { courseId: 'course-b', updatedAt: 10 }
  ]);
  assert(tieOrder.map(course => course.id).join(',') === 'course-a,course-b', 'course ordering resolves activity ties by title');

  const stats = selectDashboardStats([
    { watchTime: 0, currentTime: 3600, completed: false },
    { currentTime: 1800, completed: true }
  ], 3);
  assert(stats.totalHours === '0.5' && stats.completedLessons === 1 && stats.totalNotes === 3, 'dashboard stats preserve zero-time and legacy-time semantics');

  const detail = selectCourseDetailModel('course-a', lessons.filter(item => item.courseId === 'course-a'), [
    { id: 'course-a_a-1', courseId: 'course-a', lessonId: 'a-1', currentTime: 75, completed: false, lastWatched: 5 }
  ]);
  assert(detail.lastWatched.watchTime === 75 && detail.resumeLesson.id === 'a-1', 'course detail resumes legacy-time progress');
  assert(detail.courseProgress === 0, 'course detail percentage counts completion only');

  const completedDetail = selectCourseDetailModel('course-a', lessons.filter(item => item.courseId === 'course-a'), [
    { id: 'course-a_a-1', courseId: 'course-a', lessonId: 'a-1', completed: true, lastWatched: 5 },
    { id: 'course-a_a-2', courseId: 'course-a', lessonId: 'a-2', completed: true, lastWatched: 10 }
  ]);
  assert(completedDetail.courseProgress === 100 && completedDetail.resumeLesson.id === 'a-1', 'completed course falls back to its first lesson');

  const consumerFiles = [
    'src/pages/Dashboard.jsx',
    'src/pages/CourseDetail.jsx',
    'src/pages/Watch.jsx',
    'src/pages/PracticeHub.jsx',
    'src/pages/Settings.jsx',
    'src/components/ImportPlaylistModal.jsx'
  ];
  const consumerSources = await Promise.all(consumerFiles.map(file => readFile(file, 'utf8')));
  assert(consumerSources.every(source => !source.includes('useFoclyra')), 'zero application consumers reference useFoclyra');

  const courseDetailSource = await readFile('src/hooks/useCourseDetail.js', 'utf8');
  const watchSource = await readFile('src/hooks/useWatchData.js', 'utf8');
  assert(
    courseDetailSource.includes("where('courseId').equals(courseId)") &&
    !courseDetailSource.includes('toArray()) || []'),
    'Course Detail reads are course-scoped'
  );
  assert(
    watchSource.includes("where('[courseId+lessonId]').equals([courseId, lessonId])"),
    'Watch notes use the compound lesson scope'
  );

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    const isolation = await page.evaluate(async () => {
      const { db } = await import('/src/db/FoclyraDB.js');
      const { liveQuery } = await import('/node_modules/.vite/deps/dexie.js');
      const tables = [db.courses, db.lessons, db.progress, db.notes, db.practiceProgress];
      await db.transaction('rw', tables, async () => {
        await Promise.all(tables.map(table => table.clear()));
        await db.progress.bulkAdd([
          { id: 'course-a_a-1', courseId: 'course-a', lessonId: 'a-1', completed: false },
          { id: 'course-b_b-1', courseId: 'course-b', lessonId: 'b-1', completed: false }
        ]);
      });

      let emissions = 0;
      const subscription = liveQuery(
        () => db.progress.where('courseId').equals('course-b').toArray()
      ).subscribe(() => {
        emissions++;
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      const initialEmissions = emissions;
      await db.progress.put({
        id: 'course-a_a-1',
        courseId: 'course-a',
        lessonId: 'a-1',
        completed: false,
        watchTime: 12
      });
      await new Promise(resolve => setTimeout(resolve, 75));
      const afterUnrelatedWrite = emissions;
      await db.progress.put({
        id: 'course-b_b-1',
        courseId: 'course-b',
        lessonId: 'b-1',
        completed: false,
        watchTime: 12
      });
      await new Promise(resolve => setTimeout(resolve, 75));
      const afterRelatedWrite = emissions;
      subscription.unsubscribe();
      await db.resetDatabase();
      return { initialEmissions, afterUnrelatedWrite, afterRelatedWrite };
    });
    assert(
      isolation.initialEmissions === isolation.afterUnrelatedWrite,
      'unrelated course progress writes do not emit the scoped read'
    );
    assert(
      isolation.afterRelatedWrite > isolation.afterUnrelatedWrite,
      'related course progress writes emit the scoped read'
    );

    const catalog = await page.evaluate(async () => {
      const { db } = await import('/src/db/FoclyraDB.js');
      const course = await db.courses.orderBy('title').first();
      const lesson = course
        ? await db.lessons.where('courseId').equals(course.id).sortBy('index')
        : [];
      return { courseId: course?.id, lessonId: lesson[0]?.id };
    });
    const viewports = [
      [320, 568],
      [360, 800],
      [390, 844],
      [412, 915],
      [768, 1024],
      [1024, 768],
      [1280, 800],
      [1440, 900],
      [844, 390]
    ];
    let responsiveRoutesPassed = Boolean(catalog.courseId && catalog.lessonId);
    for (const [width, height] of viewports) {
      await page.setViewportSize({ width, height });
      for (const route of [
        '/',
        `/courses/${catalog.courseId}`,
        `/courses/${catalog.courseId}/lessons/${catalog.lessonId}`
      ]) {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
        const routeState = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          bodyText: document.body.innerText
        }));
        responsiveRoutesPassed =
          responsiveRoutesPassed &&
          routeState.overflow === 0 &&
          !routeState.bodyText.includes('Course Not Found') &&
          !routeState.bodyText.includes('Lecture Details Not Found');
      }
    }
    assert(responsiveRoutesPassed, 'Dashboard, Course Detail, and Watch pass the nine-viewport route matrix');

    await page.goto(`${BASE_URL}/courses/phase2c-missing-course`, { waitUntil: 'networkidle' });
    assert(
      await page.getByText('Course Not Found').isVisible(),
      'resolved missing Course Detail route renders not-found state'
    );
  } finally {
    await browser.close();
  }

  console.log(`\nPhase 2C Results: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
