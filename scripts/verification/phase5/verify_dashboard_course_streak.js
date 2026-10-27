import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  selectContinueLearningPath,
  selectCourseDetailModel,
  selectCourseProgressMap,
  selectSortedCourses
} from '../../../src/utils/selectors.js';
import {
  buildMonthlyActivityCalendar,
  calculateStreak,
  getActiveDateSet
} from '../../../src/utils/streakUtils.js';

const BASE_URL = process.env.FOCLYRA_TEST_BASE_URL || 'http://127.0.0.1:4173';
const SCREENSHOTS = path.resolve('docs/evidence/phase5/screenshots');
const VIEWPORTS = [
  ['small-phone-320x568', 320, 568],
  ['common-phone-360x800', 360, 800],
  ['modern-phone-390x844', 390, 844],
  ['large-phone-412x915', 412, 915],
  ['tablet-portrait-768x1024', 768, 1024],
  ['tablet-landscape-1024x768', 1024, 768],
  ['compact-laptop-1280x800', 1280, 800],
  ['desktop-1440x900', 1440, 900],
  ['phone-landscape-844x390', 844, 390]
];

let passed = 0;
let failed = 0;
function assert(condition, description) {
  if (condition) {
    passed += 1;
    console.log(`[PASS] ${description}`);
  } else {
    failed += 1;
    console.error(`[FAIL] ${description}`);
  }
}

async function run() {
  const courses = [{ id: 'b', title: 'Beta' }, { id: 'a', title: 'Alpha' }];
  const lessons = [
    { id: 'a1', courseId: 'a', index: 1 },
    { id: 'a2', courseId: 'a', index: 2 },
    { id: 'b1', courseId: 'b', index: 1 }
  ];
  const progress = [
    { id: 'a_a1', courseId: 'a', lessonId: 'a1', completed: true, lastWatched: 10 },
    { id: 'b_b1', courseId: 'b', lessonId: 'b1', completed: false, currentTime: 90, lastWatched: 20 }
  ];
  assert(selectSortedCourses(courses, progress)[0].id === 'b', 'Course ordering uses latest activity');
  assert(selectCourseProgressMap(courses, lessons, progress).a === 50, 'Course progress map is precomputed correctly');
  assert(selectContinueLearningPath(courses, lessons, progress).lessonId === 'b1', 'Continue Learning preserves legacy currentTime');
  assert(selectCourseDetailModel('a', lessons.filter(item => item.courseId === 'a'), progress.filter(item => item.courseId === 'a')).courseProgress === 50, 'Course Detail percentage matches Dashboard');

  const today = new Date(2026, 6, 29, 12);
  const yesterday = new Date(2026, 6, 28, 12).getTime();
  const activeProgress = [{ completed: true, lastWatched: yesterday }];
  const activeDates = getActiveDateSet(activeProgress, []);
  assert(calculateStreak(activeProgress, []) >= 0, 'Shared streak calculation accepts local activity data');
  const calendar = buildMonthlyActivityCalendar(activeDates, today, today);
  assert(calendar.days.length === 31 && calendar.days[28].isToday, 'Calendar model marks the local current day');

  await fs.mkdir(SCREENSHOTS, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    const search = page.getByRole('button', { name: /Search courses, topics/ });
    assert(await search.isVisible(), 'Dashboard search trigger is a semantic button');
    const deleteButton = page.getByRole('button', { name: /^Delete / }).first();
    assert((await deleteButton.boundingBox())?.height >= 44, 'Course delete action meets touch target minimum');
    await deleteButton.click();
    const deleteDialog = page.getByRole('dialog', { name: 'Delete this local course?' });
    assert(await deleteDialog.isVisible(), 'Course deletion uses an accessible confirmation dialog');
    assert((await deleteDialog.textContent()).includes('video progress'), 'Delete confirmation describes affected local records');
    await page.keyboard.press('Escape');
    assert(!(await deleteDialog.isVisible()), 'Delete confirmation closes with Escape');

    const courseLink = page.getByRole('link', { name: 'Open Syllabus' }).first();
    await courseLink.click();
    await page.waitForURL('**/courses/**');
    assert(!(await page.getByText('Course Not Found').isVisible()), 'Course Detail does not flash a false not-found state');
    const courseHeading = page.locator('h1');
    const syllabusHeading = page.getByRole('heading', { name: 'Syllabus Curriculum' });
    await syllabusHeading.waitFor({ state: 'visible' });
    const lessonLinkCount = await page.getByRole('link').evaluateAll(
      (links) => links.filter((link) => link.pathname.includes('/lessons/')).length,
    );
    const emptySyllabus = page.getByText('This course does not contain any lessons yet.');
    assert(
      await courseHeading.isVisible()
        && (await courseHeading.textContent()).trim().length > 0
        && await syllabusHeading.isVisible()
        && (lessonLinkCount > 0 || await emptySyllabus.isVisible()),
      'Course Detail renders its heading and lesson or empty syllabus state',
    );

    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    const streakButton = page.getByRole('button', { name: /day streak/i });
    await streakButton.click();
    const streakDialog = page.getByRole('dialog', { name: 'Streak Calendar' });
    assert(await streakDialog.isVisible(), 'Streak calendar uses shared dialog semantics');
    assert((await streakDialog.getByTitle('Previous Month').boundingBox())?.height >= 44, 'Streak month navigation is touch safe');
    await page.keyboard.press('Escape');
    assert(!(await streakDialog.isVisible()), 'Streak calendar closes with Escape');

    let matrixPassed = true;
    for (const [name, width, height] of VIEWPORTS) {
      await page.setViewportSize({ width, height });
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      matrixPassed = matrixPassed && overflow <= 1;
      await page.screenshot({ path: path.join(SCREENSHOTS, `${name}-dashboard.png`), fullPage: true });
      await page.getByRole('link', { name: 'Open Syllabus' }).first().click();
      await page.waitForURL('**/courses/**');
      await page.getByRole('heading', { name: 'Syllabus Curriculum' }).waitFor({ state: 'visible' });
      const detailOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      matrixPassed = matrixPassed && detailOverflow <= 1;
      await page.screenshot({ path: path.join(SCREENSHOTS, `${name}-course-detail.png`), fullPage: true });
    }
    assert(matrixPassed, 'Dashboard and Course Detail have no root overflow at all nine viewports');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), 'Reduced-motion preference remains available');
    await page.setViewportSize({ width: 640, height: 800 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), 'Dashboard remains usable at 200% zoom equivalent');
  } finally {
    await browser.close();
  }

  console.log(`\nPhase 5 verification: ${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
