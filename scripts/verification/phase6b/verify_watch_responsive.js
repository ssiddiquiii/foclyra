import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const BASE_URL = process.env.FOCLYRA_TEST_BASE_URL || 'http://127.0.0.1:4173';
const SCREENSHOT_DIR = 'docs/evidence/phase6b/screenshots';
const VIEWPORTS = [
  ['small-phone', 320, 568],
  ['common-phone', 360, 800],
  ['modern-phone', 390, 844],
  ['large-phone', 412, 915],
  ['tablet-portrait', 768, 1024],
  ['tablet-landscape', 1024, 768],
  ['compact-laptop', 1280, 800],
  ['desktop', 1440, 900],
  ['phone-landscape', 844, 390]
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

async function installFakePlayer(context) {
  await context.addInitScript(() => {
    window.__watchPlayerLog = { created: 0, destroyed: 0, plays: 0, pauses: 0, seeks: [] };
    class FakePlayer {
      constructor(_target, options) {
        window.__watchPlayerLog.created += 1;
        this.options = options;
        this.time = 20;
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
      unloadModule() {}
      loadModule() {}
      seekTo(time) { this.time = time; window.__watchPlayerLog.seeks.push(time); }
      playVideo() { this.state = 1; window.__watchPlayerLog.plays += 1; this.options.events.onStateChange({ data: 1, target: this }); }
      pauseVideo() { this.state = 2; window.__watchPlayerLog.pauses += 1; this.options.events.onStateChange({ data: 2, target: this }); }
      loadVideoById() {}
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
    const { db } = await import('/src/db/FoclyraDB.js');
    const tables = [db.courses, db.lessons, db.progress, db.notes, db.practiceProgress];
    await db.transaction('rw', tables, async () => {
      await Promise.all(tables.map(table => table.clear()));
      await db.courses.add({ id: 'responsive-course', title: 'Responsive Watch Workspace', channelName: 'Test', type: 'youtube' });
      await db.lessons.bulkAdd([
        { id: 'responsive-a', courseId: 'responsive-course', index: 1, title: 'Responsive lesson with a deliberately long title', type: 'youtube', videoId: 'responsive-a', duration: '1:40', durationSeconds: 100, description: 'Responsive evidence lesson.', chapters: [{ title: 'Start', timestamp: 10, formattedTime: '0:10' }] },
        { id: 'responsive-b', courseId: 'responsive-course', index: 2, title: 'Next lesson', type: 'youtube', videoId: 'responsive-b', duration: '1:40', durationSeconds: 100 }
      ]);
      await db.notes.add({ id: 'responsive-note', courseId: 'responsive-course', lessonId: 'responsive-a', timestamp: 12, content: 'Responsive note evidence', createdAt: Date.now() });
    });
  });
}

async function metrics(page) {
  return page.evaluate(() => {
    const player = document.querySelector('[data-testid="watch-player"]');
    const playerBox = player.getBoundingClientRect();
    const visibleScrollable = [...document.querySelectorAll('*')].filter(element => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return box.width > 0 && box.height > 0 && /(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 1;
    }).map(element => element.getAttribute('data-testid') || element.tagName);
    return {
      rootOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      bodyOverflow: document.body.scrollWidth - document.body.clientWidth,
      playerRatio: playerBox.width / playerBox.height,
      playerBox: { x: playerBox.x, y: playerBox.y, width: playerBox.width, height: playerBox.height },
      sideVisible: document.querySelector('[data-testid="watch-side-workspace"]').getBoundingClientRect().width > 0,
      inlineVisible: document.querySelector('[data-testid="watch-inline-workspace"]').getBoundingClientRect().width > 0,
      visibleScrollable
    };
  });
}

async function run() {
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  await installFakePlayer(context);
  const page = await context.newPage();
  try {
    await seed(page);
    for (const [name, width, height] of VIEWPORTS) {
      await page.setViewportSize({ width, height });
      await page.goto(`${BASE_URL}/courses/responsive-course/lessons/responsive-a`, { waitUntil: 'networkidle' });
      const before = await metrics(page);
      await page.waitForTimeout(150);
      const after = await metrics(page);
      assert(Math.abs(after.playerRatio - (16 / 9)) < 0.02, `${name} ${width}x${height}: player is 16:9`);
      assert(after.rootOverflow <= 1 && after.bodyOverflow <= 1, `${name} ${width}x${height}: no root or body horizontal overflow`);
      assert(width >= 1280 ? after.sideVisible && !after.inlineVisible : !after.sideVisible && after.inlineVisible, `${name} ${width}x${height}: workspace uses the intended breakpoint`);
      if (width < 1280) assert(after.visibleScrollable.length === 0, `${name} ${width}x${height}: document is the only page scroll container`);
      assert(Math.abs(before.playerBox.height - after.playerBox.height) < 1, `${name} ${width}x${height}: reserved player geometry has no layout shift`);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}-${width}x${height}-watch.png`, fullPage: true });
    }

    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(`${BASE_URL}/courses/responsive-course/lessons/responsive-a`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /Play Responsive lesson/ }).click();
    await page.waitForFunction(() => window.__watchPlayerLog.plays > 0);
    const primaryTargets = await page.locator('[data-testid="player-controls"] button[aria-label]').evaluateAll(buttons => buttons.filter(button => ['Pause video', 'Mute video', 'Unmute video', 'Enter fullscreen'].includes(button.getAttribute('aria-label'))).map(button => button.getBoundingClientRect()).map(box => ({ width: box.width, height: box.height })));
    assert(primaryTargets.length >= 3 && primaryTargets.every(box => box.width >= 44 && box.height >= 44), '320x568: primary controls have 44px touch targets');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/small-phone-320x568-player-controls.png` });
    await page.getByLabel('Player settings').click();
    assert(await page.getByTitle('Change Playback Speed').isVisible(), '320x568: secondary controls open in player settings');
    const settingsContained = await page.getByTitle('Change Playback Speed').evaluate(button => {
      const panel = button.parentElement.getBoundingClientRect();
      const player = button.closest('[data-testid="watch-player"]').getBoundingClientRect();
      return panel.left >= player.left - 1 && panel.right <= player.right + 1 && panel.top >= player.top - 1 && panel.bottom <= player.bottom + 1;
    });
    assert(settingsContained, '320x568: player settings are not clipped by the media surface');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/small-phone-320x568-player-settings.png` });
    await page.getByTitle('Change Playback Speed').focus();
    await page.keyboard.press('Enter');
    const timeline = page.getByRole('slider', { name: 'Seek video' });
    const timelineBefore = Number(await timeline.getAttribute('aria-valuenow'));
    await timeline.focus();
    await page.keyboard.press('ArrowRight');
    assert(await page.evaluate(expected => window.__watchPlayerLog.seeks.at(-1) === expected, Math.min(100, timelineBefore + 5)), 'keyboard timeline advances five seconds');
    await page.getByRole('button', { name: 'Pause video' }).focus();
    await page.keyboard.press('Enter');
    assert(await page.evaluate(() => window.__watchPlayerLog.pauses > 0), 'keyboard activates the primary playback control');

    await page.getByLabel('Player settings').click();
    await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
    const zoomMetrics = await metrics(page);
    assert(zoomMetrics.rootOverflow <= 1 && zoomMetrics.bodyOverflow <= 1, '200% zoom: no horizontal page overflow');
    await page.evaluate(() => { document.documentElement.style.zoom = ''; });
    assert(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), 'reduced-motion preference is active during responsive verification');
  } finally {
    await context.close();
    await browser.close();
  }
  console.log(`\nPhase 6B verification: ${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
