import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import {
  clampPlaybackTime,
  COMPLETION_THRESHOLD,
  createPlaybackPersistenceSession,
  getBoundedResumeSeconds,
  PROGRESS_SAVE_INTERVAL_MS
} from '../../../src/features/watch/playbackPersistence.js';

const BASE_URL = process.env.FOCLYRA_TEST_BASE_URL || 'http://127.0.0.1:4173';
let passed = 0;
let failed = 0;
const evidence = {
  phase: '6C',
  intervalMs: PROGRESS_SAVE_INTERVAL_MS,
  completionThreshold: COMPLETION_THRESHOLD
};

function assert(condition, description) {
  if (condition) {
    passed += 1;
    console.log(`[PASS] ${description}`);
  } else {
    failed += 1;
    console.error(`[FAIL] ${description}`);
  }
}

async function waitForProgress(page, id, predicate) {
  await page.waitForFunction(async ({ progressId, predicateSource }) => {
    const record = await (await import('/src/db/FoclyraDB.js')).db.progress.get(progressId);
    return Function('record', `return (${predicateSource})(record)`)(record);
  }, { progressId: id, predicateSource: predicate.toString() });
}

async function runPurePersistenceChecks() {
  assert(PROGRESS_SAVE_INTERVAL_MS >= 10000 && PROGRESS_SAVE_INTERVAL_MS <= 15000, 'periodic persistence interval is between 10 and 15 seconds');
  assert(COMPLETION_THRESHOLD === 0.9, 'completion threshold remains ninety percent');
  assert(clampPlaybackTime(150, 100) === 100 && clampPlaybackTime(-5, 100) === 0, 'playback positions are bounded to the playable duration');
  assert(getBoundedResumeSeconds({ currentTime: 150, completed: false }, 100) === 100, 'legacy currentTime resume is bounded');
  assert(getBoundedResumeSeconds({ watchTime: 42, currentTime: 90, completed: false }, 100) === 40, 'watchTime remains authoritative with the two-second rewind');
  assert(getBoundedResumeSeconds({ watchTime: 95, completed: true }, 100, 7) === 7, 'completed lessons reopen at the configured lesson start');

  const writes = [];
  const session = createPlaybackPersistenceSession({
    courseId: 'course',
    lessonId: 'lesson',
    writeProgress: async (...args) => writes.push(args)
  });
  session.persist({ seconds: 25.4, duration: 100 });
  session.persist({ seconds: 25.4, duration: 100 });
  session.persist({ seconds: 91, duration: 100 });
  await session.flush();
  assert(writes.length === 2, 'overlapping identical lifecycle events are deduplicated');
  assert(writes[0][0] === 'course' && writes[0][1] === 'lesson', 'queued writes remain scoped to the originating lesson');
  assert(writes[1][2] === 91 && writes[1][3] === true, 'queued writes remain ordered and carry completion');
}

async function installPlayerProbe(context) {
  await context.addInitScript(() => {
    window.__renderCounts = {};
    window.__foclyraRenderProbe = name => {
      window.__renderCounts[name] = (window.__renderCounts[name] || 0) + 1;
    };
    window.__watchPlayers = [];
    window.__watchPlayerLog = { created: 0, destroyed: 0, loads: 0, unloads: 0, plays: 0, pauses: 0, seeks: [] };
    class FakePlayer {
      constructor(_target, options) {
        window.__watchPlayerLog.created += 1;
        window.__watchPlayers.push(this);
        this.options = options;
        this.time = 0;
        this.duration = 100;
        this.state = 2;
        this.muted = false;
        setTimeout(() => options.events.onReady({ target: this }), 0);
      }
      getDuration() { return this.duration; }
      getCurrentTime() { return this.time; }
      getPlayerState() { return this.state; }
      isMuted() { return this.muted; }
      setPlaybackRate() {}
      setPlaybackQuality() {}
      setOption() {}
      loadModule() { window.__watchPlayerLog.loads += 1; }
      unloadModule() { window.__watchPlayerLog.unloads += 1; }
      seekTo(time) { this.time = time; window.__watchPlayerLog.seeks.push(time); }
      playVideo() { this.state = 1; window.__watchPlayerLog.plays += 1; this.options.events.onStateChange({ data: 1, target: this }); }
      pauseVideo() { this.state = 2; window.__watchPlayerLog.pauses += 1; this.options.events.onStateChange({ data: 2, target: this }); }
      endVideo() { this.state = 0; this.time = this.duration; this.options.events.onStateChange({ data: 0, target: this }); }
      mute() { this.muted = true; }
      unMute() { this.muted = false; }
      destroy() { window.__watchPlayerLog.destroyed += 1; }
    }
    window.YT = { Player: FakePlayer, PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0 } };
  });
}

async function seed(page) {
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    localStorage.setItem('foclyra:watch:captions-enabled', 'true');
    const { db } = await import('/src/db/FoclyraDB.js');
    const tables = [db.courses, db.lessons, db.progress, db.notes, db.practiceProgress];
    await db.transaction('rw', tables, async () => {
      await Promise.all(tables.map(table => table.clear()));
      await db.courses.add({ id: 'phase6c-course', title: 'Phase 6C Course', channelName: 'Test', type: 'youtube' });
      await db.lessons.bulkAdd([
        { id: 'phase6c-a', courseId: 'phase6c-course', index: 1, title: 'Lifecycle A', type: 'youtube', videoId: 'phase6c-a', duration: '1:40', durationSeconds: 100, chapters: [{ title: 'Middle', timestamp: 50, formattedTime: '0:50' }] },
        { id: 'phase6c-b', courseId: 'phase6c-course', index: 2, title: 'Lifecycle B', type: 'youtube', videoId: 'phase6c-b', duration: '1:40', durationSeconds: 100 }
      ]);
      await db.progress.add({ id: 'phase6c-course_phase6c-a', courseId: 'phase6c-course', lessonId: 'phase6c-a', currentTime: 150, legacyMarker: 'preserve-me', completed: false });
    });
  });
}

async function runBrowserChecks() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await installPlayerProbe(context);
  const page = await context.newPage();
  try {
    await seed(page);
    await page.goto(`${BASE_URL}/courses/phase6c-course/lessons/phase6c-a`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Play Lifecycle A' }).click();
    await page.waitForFunction(() => window.__watchPlayerLog.plays > 0);
    assert(await page.evaluate(() => window.__watchPlayerLog.created === 1), 'exactly one player instance is created for the lesson');
    assert(await page.evaluate(() => window.__watchPlayerLog.seeks.includes(100)), 'restored legacy position is bounded to duration');
    assert(await page.evaluate(() => window.__watchPlayerLog.unloads === 0), 'playback start never forces captions off');

    await page.waitForTimeout(1200);
    const renderBefore = await page.evaluate(() => ({ ...window.__renderCounts }));
    await page.evaluate(() => { window.__watchPlayers.at(-1).time = 6; });
    await page.waitForTimeout(700);
    const renderAfter = await page.evaluate(() => ({ ...window.__renderCounts }));
    evidence.renderIsolation = {
      before: renderBefore,
      after: renderAfter,
      delta: Object.fromEntries(Object.keys(renderAfter).map(key => [key, renderAfter[key] - (renderBefore[key] || 0)]))
    };
    assert(renderAfter.PlayerControls > renderBefore.PlayerControls, 'time ticks rerender PlayerControls');
    assert(renderAfter.NotesPanel === renderBefore.NotesPanel, 'time ticks do not rerender Notes');
    assert(renderAfter.CourseSyllabus === renderBefore.CourseSyllabus, 'time ticks do not rerender Syllabus');
    assert(renderAfter.ChaptersPanel === renderBefore.ChaptersPanel, 'time ticks do not rerender Chapters');

    await page.evaluate(() => { window.__watchPlayers.at(-1).time = 24; });
    await page.waitForTimeout(PROGRESS_SAVE_INTERVAL_MS + 500);
    await waitForProgress(page, 'phase6c-course_phase6c-a', record => record?.watchTime === 24);
    assert(true, 'periodic timer persists the latest playback position');

    await page.evaluate(() => { window.__watchPlayers.at(-1).time = 31; window.__watchPlayers.at(-1).pauseVideo(); });
    await waitForProgress(page, 'phase6c-course_phase6c-a', record => record?.watchTime === 31);
    assert(true, 'pause persists the latest playback position');

    await page.evaluate(() => {
      window.__watchPlayers.at(-1).time = 38;
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await waitForProgress(page, 'phase6c-course_phase6c-a', record => record?.watchTime === 38);
    assert(true, 'document visibility change persists the latest position');

    await page.getByLabel('Player settings').click();
    await page.getByTitle('Toggle Captions (CC)').click();
    assert(await page.evaluate(() => localStorage.getItem('foclyra:watch:captions-enabled') === 'false'), 'caption preference can be disabled explicitly');
    await page.getByTitle('Toggle Captions (CC)').click();
    assert(await page.evaluate(() => localStorage.getItem('foclyra:watch:captions-enabled') === 'true'), 'caption preference is persisted');
    assert(await page.evaluate(() => window.__watchPlayerLog.loads > 0), 'caption preference is applied to the active player');
    const explicitUnloadCount = await page.evaluate(() => window.__watchPlayerLog.unloads);

    await page.evaluate(() => { window.__watchPlayers.at(-1).time = 44; });
    await page.getByRole('button', { name: /Lifecycle B/ }).click();
    await page.waitForURL('**/lessons/phase6c-b');
    await waitForProgress(page, 'phase6c-course_phase6c-a', record => record?.watchTime === 44);
    assert(true, 'lesson change persists the previous lesson position');
    await page.waitForFunction(() => window.__watchPlayerLog.destroyed >= 1);
    assert(await page.evaluate(() => window.__watchPlayerLog.destroyed === 1), 'lesson change destroys the previous player');

    await page.getByRole('button', { name: 'Play Lifecycle B' }).click();
    await page.waitForFunction(() => window.__watchPlayerLog.created === 2);
    assert(await page.evaluate(() => window.__watchPlayerLog.loads >= 2), 'caption preference synchronizes with the next player');
    assert(await page.evaluate(expected => window.__watchPlayerLog.unloads === expected, explicitUnloadCount), 'reopening playback does not silently disable captions');

    await page.evaluate(() => { window.__watchPlayers.at(-1).time = 53; });
    await page.getByRole('button', { name: /Solve Practice/ }).click();
    await page.waitForURL('**/practice');
    await waitForProgress(page, 'phase6c-course_phase6c-b', record => record?.watchTime === 53);
    assert(true, 'route exit and unmount persist the latest position');

    await page.goto(`${BASE_URL}/courses/phase6c-course/lessons/phase6c-b`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Play Lifecycle B' }).click();
    await page.waitForFunction(() => window.__watchPlayerLog.created === 1);
    await page.evaluate(() => { window.__watchPlayers.at(-1).time = 95; window.__watchPlayers.at(-1).pauseVideo(); });
    await waitForProgress(page, 'phase6c-course_phase6c-b', record => record?.completed === true);
    await page.evaluate(() => { window.__watchPlayers.at(-1).time = 60; window.dispatchEvent(new Event('pagehide')); });
    await waitForProgress(page, 'phase6c-course_phase6c-b', record => record?.watchTime === 60 && record?.completed === true);
    assert(true, 'overlapping lifecycle saves preserve sticky completion');

    await page.evaluate(() => window.__watchPlayers.at(-1).endVideo());
    await waitForProgress(page, 'phase6c-course_phase6c-b', record => record?.watchTime === 100 && record?.completed === true);
    assert(true, 'video end persists duration and completion');

    const preserved = await page.evaluate(async () => (await (await import('/src/db/FoclyraDB.js')).db.progress.get('phase6c-course_phase6c-a')));
    assert(preserved.currentTime === 150 && preserved.legacyMarker === 'preserve-me', 'watchTime saves preserve legacy currentTime and unknown fields');
  } finally {
    await context.close();
    await browser.close();
  }
}

async function run() {
  await runPurePersistenceChecks();
  await runBrowserChecks();
  evidence.results = { passed, failed };
  await mkdir('docs/evidence/phase6c', { recursive: true });
  await writeFile('docs/evidence/phase6c/render-isolation.json', `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(`\nPhase 6C verification: ${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
