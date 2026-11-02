import { chromium } from 'playwright';

const VIEWPORTS = [
  { name: 'Small Mobile', width: 320, height: 700 },
  { name: 'Standard Mobile', width: 375, height: 750 },
  { name: 'Large Mobile', width: 430, height: 850 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Small Laptop', width: 1024, height: 768 },
  { name: 'Desktop', width: 1440, height: 900 }
];

const ROUTES = [
  { name: 'Landing Page', path: '/' },
  { name: 'Studio Dashboard (Enrolled)', path: '/studio' },
  { name: 'Course Detail', path: '/courses/test-course-101' },
  { name: 'Watch Workspace', path: '/courses/test-course-101/lessons/lesson-1' },
  { name: 'Settings Console', path: '/settings' }
];

async function runAudit() {
  console.log('🚀 Starting Foclyra Comprehensive End-to-End Responsiveness Audit...\n');
  const browser = await chromium.launch({
    executablePath: 'C:\\Users\\samee\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe',
    headless: true
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // First seed test course and lessons into IndexedDB
  await page.goto('http://localhost:5173/studio');
  await page.waitForTimeout(600);
  await page.evaluate(async () => {
    return new Promise((resolve) => {
      const req = indexedDB.open('FoclyraDB');
      req.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction(['courses', 'lessons'], 'readwrite');
        
        const coursesStore = tx.objectStore('courses');
        coursesStore.put({
          id: 'test-course-101',
          title: 'Full-Stack Modern React & TypeScript Architecture Course',
          type: 'youtube',
          channelName: 'Antigravity Academy',
          thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
          createdAt: Date.now(),
          updatedAt: Date.now()
        });

        const lessonsStore = tx.objectStore('lessons');
        lessonsStore.put({
          id: 'lesson-1',
          courseId: 'test-course-101',
          title: '01. Introduction to Full-Stack Architecture & Modern UI Ecosystem',
          videoId: 'dQw4w9WgXcQ',
          index: 1,
          duration: '12:45',
          durationSeconds: 765,
          type: 'youtube'
        });
        lessonsStore.put({
          id: 'lesson-2',
          courseId: 'test-course-101',
          title: '02. State Management, Hooks & Performance Optimization in Depth',
          videoId: 'dQw4w9WgXcQ',
          index: 2,
          duration: '24:10',
          durationSeconds: 1450,
          type: 'youtube'
        });

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      };
      req.onerror = () => resolve(false);
    });
  });

  const auditResults = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n========================================`);
    console.log(`📱 Testing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`========================================`);
    await page.setViewportSize({ width: vp.width, height: vp.height });

    for (const route of ROUTES) {
      const url = `http://localhost:5173${route.path}`;
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(350);

      const pageMetrics = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const bodyWidth = document.body.scrollWidth;
        const hasOverflow = docWidth > winWidth + 1 || bodyWidth > winWidth + 1;

        // Find elements causing overflow
        const overflowElements = [];
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
          const rect = el.getBoundingClientRect();
          if (rect.right > winWidth + 1 && el.tagName !== 'HTML' && el.tagName !== 'BODY') {
            const id = el.id ? `#${el.id}` : '';
            const cls = el.className && typeof el.className === 'string' ? `.${el.className.split(' ')[0]}` : '';
            overflowElements.push({
              tag: el.tagName.toLowerCase(),
              identifier: `${el.tagName.toLowerCase()}${id}${cls}`,
              right: Math.round(rect.right),
              excess: Math.round(rect.right - winWidth)
            });
            if (overflowElements.length >= 3) break;
          }
        }

        return {
          winWidth,
          docWidth,
          hasOverflow,
          overflowElements
        };
      });

      const status = pageMetrics.hasOverflow ? '❌ OVERFLOW' : '✅ CLEAN';
      console.log(`  ${status} [${route.name}] (${route.path}): docWidth=${pageMetrics.docWidth}px (viewport=${vp.width}px)`);

      if (pageMetrics.hasOverflow) {
        console.log(`    Offending elements:`, pageMetrics.overflowElements);
      }

      auditResults.push({
        viewport: vp.name,
        width: vp.width,
        route: route.name,
        path: route.path,
        hasOverflow: pageMetrics.hasOverflow,
        excess: pageMetrics.docWidth - vp.width,
        overflowElements: pageMetrics.overflowElements
      });
    }
  }

  // Now test Modals on Small Mobile (320px)
  console.log(`\n========================================`);
  console.log(`🔍 Testing Modals & Dialogs on Small Mobile (320px)`);
  console.log(`========================================`);
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('http://localhost:5173/studio', { waitUntil: 'networkidle' });

  // 1. Command Palette Trigger
  console.log(`\nTesting Command Palette...`);
  await page.keyboard.press('Control+KeyK');
  await page.waitForTimeout(300);
  const paletteCheck = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]') || document.querySelector('[data-testid="command-palette-backdrop"]');
    if (!dialog) return { found: false };
    const rect = dialog.getBoundingClientRect();
    return {
      found: true,
      width: Math.round(rect.width),
      right: Math.round(rect.right),
      overflow: rect.right > window.innerWidth
    };
  });
  console.log(`  Palette modal check:`, paletteCheck);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  // 2. Mobile Drawer Navigation
  console.log(`\nTesting Mobile Drawer Navigation...`);
  const menuButton = await page.$('button[aria-label="Open navigation"]');
  if (menuButton) {
    await menuButton.click();
    await page.waitForTimeout(300);
    const drawerCheck = await page.evaluate(() => {
      const drawer = document.querySelector('#mobile-navigation');
      if (!drawer) return { found: false };
      const rect = drawer.getBoundingClientRect();
      return {
        found: true,
        width: Math.round(rect.width),
        right: Math.round(rect.right),
        overflow: rect.right > window.innerWidth
      };
    });
    console.log(`  Drawer navigation check:`, drawerCheck);
    // Close drawer using backdrop click or Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(350);
  }

  // 3. Streak Modal Check
  console.log(`\nTesting Streak Modal...`);
  const streakBtn = await page.$('button[title="View 30-Day Activity Heatmap"]');
  if (streakBtn) {
    await streakBtn.click({ force: true });
    await page.waitForTimeout(300);
    const streakCheck = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]');
      if (!modal) return { found: false };
      const rect = modal.getBoundingClientRect();
      return {
        found: true,
        width: Math.round(rect.width),
        right: Math.round(rect.right),
        overflow: rect.right > window.innerWidth + 1
      };
    });
    console.log(`  Streak modal check:`, streakCheck);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
  }

  // 4. Beta Modal Check
  console.log(`\nTesting Beta Modal...`);
  const betaBtn = await page.$('button[title="Foclyra is in Public Beta. Click for details."]');
  if (betaBtn) {
    await betaBtn.click({ force: true });
    await page.waitForTimeout(300);
    const betaCheck = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]');
      if (!modal) return { found: false };
      const rect = modal.getBoundingClientRect();
      return {
        found: true,
        width: Math.round(rect.width),
        right: Math.round(rect.right),
        overflow: rect.right > window.innerWidth + 1
      };
    });
    console.log(`  Beta modal check:`, betaCheck);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
  }

  // Clean up seeded test data
  await page.evaluate(async () => {
    return new Promise((resolve) => {
      const req = indexedDB.open('FoclyraDB');
      req.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction(['courses', 'lessons'], 'readwrite');
        tx.objectStore('courses').delete('test-course-101');
        tx.objectStore('lessons').delete('lesson-1');
        tx.objectStore('lessons').delete('lesson-2');
        tx.oncomplete = () => resolve(true);
      };
      req.onerror = () => resolve(false);
    });
  });

  await browser.close();
  console.log('\n✅ Comprehensive audit completed successfully.');
}

runAudit().catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
