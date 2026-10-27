import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE_URL = process.env.FOCLYRA_TEST_BASE_URL || 'http://127.0.0.1:4173';
const EVIDENCE_DIR = 'docs/evidence/phase6d';
let passed = 0;
let failed = 0;
const evidence = { phase: '6D', checks: [] };

function assert(condition, description) {
  evidence.checks.push({ description, passed: Boolean(condition) });
  if (condition) {
    passed += 1;
    console.log(`[PASS] ${description}`);
  } else {
    failed += 1;
    console.error(`[FAIL] ${description}`);
  }
}

async function installPlayerProbe(context) {
  await context.addInitScript(() => {
    window.__watchPlayers = [];
    window.__watchPlayerLog = { created: 0, destroyed: 0, plays: 0, pauses: 0, seeks: [] };
    class FakePlayer {
      constructor(_target, options) {
        window.__watchPlayerLog.created += 1;
        window.__watchPlayers.push(this);
        this.options = options;
        this.time = 23.4;
        this.duration = 100;
        this.state = 2;
        setTimeout(() => options.events.onReady({ target: this }), 0);
      }
      getDuration() { return this.duration; }
      getCurrentTime() { return this.time; }
      getPlayerState() { return this.state; }
      isMuted() { return false; }
      setPlaybackRate() {}
      setPlaybackQuality() {}
      loadModule() {}
      unloadModule() {}
      seekTo(time) { this.time = time; window.__watchPlayerLog.seeks.push(time); }
      playVideo() { this.state = 1; window.__watchPlayerLog.plays += 1; this.options.events.onStateChange({ data: 1, target: this }); }
      pauseVideo() { this.state = 2; window.__watchPlayerLog.pauses += 1; this.options.events.onStateChange({ data: 2, target: this }); }
      mute() {}
      unMute() {}
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
      await db.courses.add({ id: 'phase6d-course', title: 'Phase 6D Course', channelName: 'Test', type: 'youtube' });
      await db.lessons.bulkAdd([
        {
          id: 'Hr5iLG7sUa0',
          courseId: 'phase6d-course',
          index: 1,
          title: 'Workspace interactions',
          type: 'youtube',
          videoId: 'Hr5iLG7sUa0',
          duration: '1:40',
          durationSeconds: 100,
          chapters: [
            { title: 'A very long chapter title that must wrap without clipping at narrow widths', timestamp: 48, formattedTime: '0:48' }
          ]
        },
        { id: 'phase6d-empty', courseId: 'phase6d-course', index: 2, title: 'Empty chapters', type: 'youtube', videoId: 'phase6d-empty', duration: '1:40', durationSeconds: 100, chapters: [] }
      ]);
      await db.notes.add({ id: 6001, courseId: 'phase6d-course', lessonId: 'Hr5iLG7sUa0', timestamp: 12, content: 'Existing note', createdAt: 100, updatedAt: 100 });
    });
  });
}

async function readNote(page, id) {
  return page.evaluate(async noteId => (await import('/src/db/FoclyraDB.js')).db.notes.get(noteId), id);
}

async function run() {
  await mkdir(`${EVIDENCE_DIR}/screenshots`, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 320, height: 568 }, reducedMotion: 'reduce' });
  await installPlayerProbe(context);
  const page = await context.newPage();
  try {
    await seed(page);
    await page.goto(`${BASE_URL}/courses/phase6d-course/lessons/Hr5iLG7sUa0`, { waitUntil: 'networkidle' });
    assert(await page.locator('[data-testid="notes-workspace"]').count() === 1, 'one Notes implementation is mounted at the phone layout');

    const writesBeforeTyping = await page.evaluate(async () => (await (await import('/src/db/FoclyraDB.js')).db.notes.count()));
    await page.getByLabel('New timestamped note').fill('Captured note');
    await page.waitForTimeout(100);
    const writesAfterTyping = await page.evaluate(async () => (await (await import('/src/db/FoclyraDB.js')).db.notes.count()));
    assert(writesAfterTyping === writesBeforeTyping, 'typing a note performs no database write');

    await page.getByRole('button', { name: 'Play Workspace interactions' }).click();
    await page.waitForFunction(() => window.__watchPlayerLog.created === 1);
    await page.evaluate(() => { window.__watchPlayers.at(-1).time = 23.4; });
    await page.getByRole('button', { name: /Save Note at current time/ }).dblclick();
    await page.waitForFunction(async () => (await (await import('/src/db/FoclyraDB.js')).db.notes.count()) === 2);
    const created = await page.evaluate(async () => (await (await import('/src/db/FoclyraDB.js')).db.notes.toArray()).find(note => note.content === 'Captured note'));
    assert(created.courseId === 'phase6d-course' && created.lessonId === 'Hr5iLG7sUa0', 'created note retains course and lesson ownership');
    assert(created.timestamp === 23, 'note creation captures the active player timestamp');
    const duplicateCount = await page.evaluate(async () => (await (await import('/src/db/FoclyraDB.js')).db.notes.toArray()).filter(note => note.content === 'Captured note').length);
    assert(duplicateCount === 1, 'rapid duplicate submit creates only one note');

    await page.evaluate(async () => {
      const { db } = await import('/src/db/FoclyraDB.js');
      window.__originalNoteAdd = db.notes.add;
      db.notes.add = async () => { throw new Error('Simulated note failure'); };
    });
    await page.getByLabel('New timestamped note').fill('Keep this failed draft');
    await page.getByRole('button', { name: /Save Note at current time/ }).click();
    await page.getByRole('alert').waitFor();
    assert(await page.getByLabel('New timestamped note').inputValue() === 'Keep this failed draft', 'save failure preserves the user draft');
    await page.evaluate(async () => {
      const { db } = await import('/src/db/FoclyraDB.js');
      db.notes.add = window.__originalNoteAdd;
    });
    await page.getByLabel('New timestamped note').fill('');

    await page.getByRole('button', { name: 'Edit note at 0:12' }).click();
    await page.getByRole('textbox', { name: 'Edit note' }).fill('Edited existing note');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await page.waitForFunction(async () => (await (await import('/src/db/FoclyraDB.js')).db.notes.get(6001))?.content === 'Edited existing note');
    const edited = await readNote(page, 6001);
    assert(edited.id === 6001 && edited.timestamp === 12 && edited.createdAt === 100, 'editing preserves the note ID, timestamp and creation time');

    await page.getByRole('button', { name: 'Delete note at 0:12' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
    assert(Boolean(await readNote(page, 6001)), 'delete cancellation preserves the note');
    await page.getByRole('button', { name: 'Delete note at 0:12' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete note' }).click();
    await page.waitForFunction(async () => !(await (await import('/src/db/FoclyraDB.js')).db.notes.get(6001)));
    assert(!(await readNote(page, 6001)), 'confirmed delete removes only the selected note');

    await page.getByRole('button', { name: /Seek to note at 0:23/ }).focus();
    await page.keyboard.press('Enter');
    assert(await page.evaluate(() => window.__watchPlayerLog.seeks.at(-1) === 23), 'keyboard-activated note timestamp seeks the active player');
    await page.getByRole('button', { name: /Play chapter .* at 0:48/ }).focus();
    await page.keyboard.press('Enter');
    assert(await page.evaluate(() => window.__watchPlayerLog.seeks.at(-1) === 48), 'keyboard-activated chapter seeks the active player');

    await page.getByRole('button', { name: 'Reading' }).click();
    assert(await page.getByText(/Reading position and article state are not saved/).isVisible(), 'Reading accurately communicates non-persistent state');
    const readingSafety = await page.evaluate(() => {
      const root = document.documentElement;
      const links = [...document.querySelectorAll('[data-testid="reading-workspace"] a[target="_blank"]')];
      const code = document.querySelector('[data-testid="reading-workspace"] pre');
      return {
        overflow: root.scrollWidth - root.clientWidth,
        linksSafe: links.length > 0 && links.every(link => link.rel.includes('noopener') && link.rel.includes('noreferrer') && link.getAttribute('aria-label')),
        codeContained: !code || code.getBoundingClientRect().right <= root.getBoundingClientRect().right + 1
      };
    });
    assert(readingSafety.overflow <= 1, '320px Reading content has no horizontal page overflow');
    assert(readingSafety.linksSafe, 'external Reading links use safe attributes and accessible names');
    assert(readingSafety.codeContained, 'long Reading code remains contained');
    await page.screenshot({ path: `${EVIDENCE_DIR}/screenshots/phone-320x568-reading.png`, fullPage: true });

    await page.setViewportSize({ width: 844, height: 390 });
    const landscapeOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert(landscapeOverflow <= 1, '844x390 Reading and workspace have no horizontal overflow');
    await page.screenshot({ path: `${EVIDENCE_DIR}/screenshots/landscape-844x390-reading.png`, fullPage: true });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.getByRole('button', { name: 'Notes' }).click();
    assert(await page.locator('[data-testid="notes-workspace"]').count() === 1, 'one Notes implementation is mounted at the desktop layout');

    const pausesBefore = await page.evaluate(() => window.__watchPlayerLog.pauses);
    await page.getByRole('button', { name: /\(Focus\)/ }).click();
    await page.getByRole('button', { name: /Lock Screen for Rest Break Now/ }).click();
    assert(await page.evaluate(before => window.__watchPlayerLog.pauses === before + 1, pausesBefore), 'Pomodoro rest transition pauses the actual active player');

    const staleSafety = await page.evaluate(async () => {
      const { useUIStore } = await import('/src/hooks/useUIStore.js');
      let staleCalls = 0;
      const stale = { lessonId: 'old', pause: () => { staleCalls += 1; } };
      useUIStore.getState().registerPlayerCommands(stale);
      useUIStore.getState().setActiveLessonId('new');
      const invoked = useUIStore.getState().pauseActivePlayer();
      return { invoked, staleCalls };
    });
    assert(staleSafety.invoked === false && staleSafety.staleCalls === 0, 'stale lesson player commands are rejected');

    await page.getByRole('button', { name: /Emergency Skip Rest Lock/ }).click();
    await page.getByRole('button', { name: /Empty chapters/ }).click();
    await page.waitForURL('**/lessons/phase6d-empty');
    await page.getByText('No chapters are available for this lesson.').waitFor();
    assert(true, 'empty chapter state is explicit');
    await page.waitForFunction(() => window.__watchPlayerLog.destroyed >= 1);
    assert(await page.evaluate(() => window.__watchPlayerLog.destroyed === 1), 'lesson change destroys the previous player instance');
  } finally {
    await context.close();
    await browser.close();
  }

  evidence.results = { passed, failed };
  await writeFile(`${EVIDENCE_DIR}/interaction-results.json`, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(`\nPhase 6D verification: ${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
