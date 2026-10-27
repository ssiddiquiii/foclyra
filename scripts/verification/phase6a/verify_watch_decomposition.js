import { readFile, readdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const BASE_URL = process.env.FOCLYRA_TEST_BASE_URL || 'http://127.0.0.1:4173';
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

async function readWatchSources() {
  const featureFiles = await readdir('src/features/watch').catch(() => []);
  const files = ['src/pages/Watch.jsx', ...featureFiles.filter(file => /\.(js|jsx)$/.test(file)).map(file => `src/features/watch/${file}`)];
  return (await Promise.all(files.map(file => readFile(file, 'utf8')))).join('\n');
}

async function run() {
  const source = await readWatchSources();
  assert((source.match(/new window\.YT\.Player/g) || []).length === 1, 'Watch defines exactly one YouTube player construction site');
  assert(source.includes('PROGRESS_SAVE_INTERVAL_MS = 10000'), 'progress-save frequency remains ten seconds');
  assert(source.includes('COMPLETION_THRESHOLD = 0.9'), 'automatic completion threshold remains ninety percent');
  assert(source.includes('cc_load_policy:'), 'YouTube caption initialization remains explicitly configured');
  assert(source.includes('watchedSeconds - 2'), 'resume position retains the two-second rewind');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addInitScript(() => {
    window.__watchPlayers = [];
    window.__watchPlayerLog = { created: 0, destroyed: 0, seeks: [], plays: 0, pauses: 0, rates: [], qualities: [], captions: 0, live: 0 };
    class FakePlayer {
      constructor(_target, options) {
        window.__watchPlayerLog.created += 1;
        window.__watchPlayerLog.live += 1;
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
      setPlaybackRate(rate) { window.__watchPlayerLog.rates.push(rate); }
      setPlaybackQuality(quality) { window.__watchPlayerLog.qualities.push(quality); }
      setOption() {}
      unloadModule() {}
      loadModule() { window.__watchPlayerLog.captions += 1; }
      seekTo(time) { this.time = time; window.__watchPlayerLog.seeks.push(time); }
      playVideo() { this.state = 1; window.__watchPlayerLog.plays += 1; this.options.events.onStateChange({ data: 1, target: this }); }
      pauseVideo() { this.state = 2; window.__watchPlayerLog.pauses += 1; this.options.events.onStateChange({ data: 2, target: this }); }
      loadVideoById({ startSeconds }) { this.seekTo(startSeconds || 0); }
      mute() { this.muted = true; }
      unMute() { this.muted = false; }
      destroy() { window.__watchPlayerLog.destroyed += 1; window.__watchPlayerLog.live -= 1; }
    }
    window.YT = { Player: FakePlayer, PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0 } };
  });

  const page = await context.newPage();
  try {
    await page.setViewportSize({ width: 800, height: 900 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      const { db } = await import('/src/db/FoclyraDB.js');
      const tables = [db.courses, db.lessons, db.progress, db.notes, db.practiceProgress];
      await db.transaction('rw', tables, async () => {
        await Promise.all(tables.map(table => table.clear()));
        await db.courses.add({ id: 'watch-course', title: 'Watch Characterization', channelName: 'Test', type: 'youtube' });
        await db.lessons.bulkAdd([
          { id: 'watch-a', courseId: 'watch-course', index: 1, title: 'Lesson A', type: 'youtube', videoId: 'watch-a', duration: '1:40', durationSeconds: 100 },
          { id: 'watch-b', courseId: 'watch-course', index: 2, title: 'Lesson B', type: 'youtube', videoId: 'watch-b', duration: '1:40', durationSeconds: 100 }
        ]);
        await db.progress.add({ id: 'watch-course_watch-a', courseId: 'watch-course', lessonId: 'watch-a', currentTime: 42, completed: false });
      });
    });

    await page.goto(`${BASE_URL}/courses/watch-course/lessons/watch-a`, { waitUntil: 'networkidle' });
    await page.getByAltText('Lesson A').click({ force: true });
    await page.waitForFunction(() => window.__watchPlayerLog.plays > 0);
    const initialized = await page.evaluate(() => ({ ...window.__watchPlayerLog }));
    assert(initialized.created === 1 && initialized.live === 1, 'click-to-play initializes exactly one live player instance');
    assert(initialized.seeks.includes(40), 'player resumes legacy currentTime with the existing rewind');

    await page.keyboard.press('k');
    await page.waitForFunction(() => window.__watchPlayerLog.pauses > 0);
    assert(await page.evaluate(() => window.__watchPlayerLog.pauses === 1), 'keyboard playback control pauses the active player');
    await page.keyboard.press('k');
    assert(await page.evaluate(() => window.__watchPlayerLog.plays >= 2), 'keyboard playback control resumes the active player');
    await page.keyboard.press('ArrowRight');
    assert(await page.evaluate(() => window.__watchPlayerLog.seeks.at(-1) === 45), 'keyboard seek control advances five seconds');
    await page.keyboard.press('m');
    assert(await page.evaluate(() => window.__watchPlayers.at(-1).muted === true), 'keyboard mute control updates the active player');
    await page.keyboard.press('c');
    await page.waitForFunction(() => window.__watchPlayerLog.captions > 0);
    assert(await page.evaluate(() => window.__watchPlayerLog.captions >= 1), 'caption control loads the existing captions module');
    await page.getByLabel('Player settings').click();
    await page.getByTitle('Change Playback Speed').click();
    assert(await page.evaluate(() => window.__watchPlayerLog.rates.at(-1) === 1.25), 'speed control preserves the existing option cycle');
    await page.getByTitle('Change Video Quality / Resolution').click();
    assert(await page.evaluate(() => window.__watchPlayerLog.qualities.at(-1) === 'highres'), 'quality control preserves the existing option cycle');

    await page.evaluate(() => { window.__watchPlayers.at(-1).time = 55; });
    await page.getByPlaceholder(/timestamped note/).first().fill('Phase 6A note');
    await page.getByRole('button', { name: /Save Note/ }).first().click();
    await page.getByText('Phase 6A note').first().waitFor();
    const note = await page.evaluate(async () => (await (await import('/src/db/FoclyraDB.js')).db.notes.toArray())[0]);
    assert(note.content === 'Phase 6A note' && note.timestamp === 55, 'note creation preserves content and player timestamp');
    await page.getByTitle('Delete note').first().click({ force: true });
    await page.getByRole('dialog').getByRole('button', { name: 'Delete note' }).click();
    await page.waitForFunction(async () => (await (await import('/src/db/FoclyraDB.js')).db.notes.count()) === 0);
    assert(true, 'note deletion removes the selected note');

    await page.evaluate(() => { window.__watchPlayers.at(-1).time = 95; window.__watchPlayers.at(-1).pauseVideo(); });
    await page.waitForFunction(async () => (await (await import('/src/db/FoclyraDB.js')).db.progress.get('watch-course_watch-a'))?.completed === true);
    assert(true, 'pause persistence marks ninety-percent playback complete');

    await page.getByRole('button', { name: /Lesson B/ }).click();
    await page.waitForURL('**/lessons/watch-b');
    await page.waitForFunction(() => window.__watchPlayerLog.destroyed === 1);
    assert(await page.evaluate(() => window.__watchPlayerLog.live === 0), 'lesson route change cleans up the previous player');

    await page.getByAltText('Lesson B').click({ force: true });
    await page.waitForFunction(() => window.__watchPlayerLog.created === 2);
    assert(await page.evaluate(() => window.__watchPlayerLog.live === 1), 'new lesson still owns exactly one live player');
  } finally {
    await context.close();
    await browser.close();
  }

  console.log(`\nPhase 6A verification: ${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
