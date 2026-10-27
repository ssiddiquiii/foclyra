import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { isNavigationActive } from '../../../src/components/shell/navigation.js';

const BASE_URL = process.env.FOCLYRA_TEST_BASE_URL || 'http://127.0.0.1:4173';
const SCREENSHOT_DIRECTORY = path.resolve('docs/evidence/phase4/screenshots');
const VIEWPORTS = [
  ['phone-portrait-320x568', 320, 568],
  ['phone-portrait-375x667', 375, 667],
  ['phone-portrait-390x844', 390, 844],
  ['phone-landscape-667x375', 667, 375],
  ['tablet-portrait-768x1024', 768, 1024],
  ['tablet-landscape-1024x768', 1024, 768],
  ['desktop-1280x720', 1280, 720],
  ['desktop-1440x900', 1440, 900],
  ['desktop-1920x1080', 1920, 1080]
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
  assert(isNavigationActive('/', '/'), 'Dashboard is active only at the root route');
  assert(!isNavigationActive('/courses/course-1', '/'), 'Course routes do not falsely activate Dashboard');
  assert(isNavigationActive('/practice/topic', '/practice'), 'Nested Practice routes activate Practice');
  assert(!isNavigationActive('/practice-tools', '/practice'), 'Route-prefix collisions do not activate Practice');

  await fs.mkdir(SCREENSHOT_DIRECTORY, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

    const menuButton = page.getByRole('button', { name: 'Open navigation' });
    assert(await menuButton.isVisible(), 'Tablet width uses the mobile/tablet navigation control');
    assert(!(await page.getByTestId('desktop-navigation').isVisible()), 'Desktop dock is absent at 768px');
    assert((await menuButton.boundingBox())?.height >= 44, 'Menu control meets the 44px touch-target minimum');
    const safeAreaLayout = await page.evaluate(() => {
      document.documentElement.style.setProperty('--safe-area-top', '40px');
      const header = document.querySelector('header');
      const main = document.querySelector('main');
      return {
        headerBottom: header.getBoundingClientRect().bottom,
        firstContentTop: main.firstElementChild.getBoundingClientRect().top
      };
    });
    assert(
      safeAreaLayout.firstContentTop >= safeAreaLayout.headerBottom,
      'Main content reserves the same simulated top safe-area inset as the fixed header'
    );
    await page.evaluate(() => document.documentElement.style.removeProperty('--safe-area-top'));

    await menuButton.click();
    const drawer = page.locator('#mobile-navigation');
    assert(await drawer.getAttribute('aria-modal') === 'true', 'Drawer exposes modal dialog semantics');
    assert(await drawer.locator('[aria-current="page"]').getAttribute('href') === '/', 'Drawer exposes the active route with aria-current');
    assert(await page.evaluate(() => document.body.style.overflow) === 'hidden', 'Open drawer locks background scrolling');
    assert(await drawer.evaluate(node => node.contains(document.activeElement)), 'Opening the drawer moves focus inside it');

    const drawerLinks = drawer.locator('a[href]');
    const firstDrawerLink = drawerLinks.first();
    const lastDrawerLink = drawerLinks.last();
    await lastDrawerLink.focus();
    await page.keyboard.press('Tab');
    assert(await firstDrawerLink.evaluate(node => node === document.activeElement), 'Tab wraps from the last drawer control to the first');

    await page.keyboard.press('Escape');
    assert(await drawer.getAttribute('aria-hidden') === 'true', 'Escape closes the drawer');
    assert(await menuButton.evaluate(node => node === document.activeElement), 'Closing the drawer restores focus to its trigger');

    const searchButton = page.getByRole('button', { name: 'Open command palette' });
    await searchButton.focus();
    await searchButton.click();
    const commandDialog = page.getByRole('dialog', { name: 'Command palette' });
    assert(await commandDialog.isVisible(), 'Shared dialog exposes the command palette name and modal role');
    await page.waitForFunction(
      () => document.activeElement?.getAttribute('aria-label') === 'Search commands and interview questions'
    );
    assert(
      await commandDialog.getByRole('textbox', { name: 'Search commands and interview questions' })
        .evaluate(node => node === document.activeElement),
      'Shared dialog focuses its autofocus target'
    );
    await page.keyboard.press('Escape');
    assert(!(await commandDialog.isVisible()), 'Shared dialog closes on Escape');
    await page.waitForFunction(
      () => document.activeElement?.getAttribute('aria-label') === 'Open command palette'
    );
    assert(await searchButton.evaluate(node => node === document.activeElement), 'Shared dialog restores trigger focus');

    await menuButton.click();
    const practiceLink = drawer.getByRole('link', { name: 'Practice' });
    await practiceLink.focus();
    await page.keyboard.press('Control+k');
    const stackedDialog = page.getByRole('dialog', { name: 'Command palette' });
    assert(await stackedDialog.isVisible(), 'Command palette can open above the navigation drawer');
    await page.keyboard.press('Escape');
    assert(!(await stackedDialog.isVisible()), 'Escape closes the topmost stacked dialog');
    assert(await drawer.getAttribute('aria-hidden') === 'false', 'Escape leaves the underlying drawer open');
    await page.waitForFunction(
      () => document.activeElement?.textContent?.trim() === 'Practice'
    );
    assert(await practiceLink.evaluate(node => node === document.activeElement), 'Stacked dialog restores focus inside the drawer');
    await page.keyboard.press('Escape');

    await menuButton.click();
    await page.getByTestId('navigation-backdrop').click({ position: { x: 700, y: 500 } });
    assert(await drawer.getAttribute('aria-hidden') === 'true', 'Backdrop click closes the drawer');

    await menuButton.click();
    await drawer.getByRole('link', { name: 'Practice' }).click();
    await page.waitForURL('**/practice');
    assert(await drawer.getAttribute('aria-hidden') === 'true', 'Navigation closes the drawer during route changes');

    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    assert(await page.getByTestId('desktop-navigation').isVisible(), 'Desktop dock starts at 1024px');
    assert(!(await page.getByRole('button', { name: 'Open navigation' }).isVisible()), 'Mobile header is absent at 1024px');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    const reducedMotion = await page.evaluate(() => ({
      matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      transitionDuration: getComputedStyle(document.querySelector('main')).transitionDuration
    }));
    assert(reducedMotion.matches, 'Reduced-motion preference is honored by the document');
    assert(
      Number.parseFloat(reducedMotion.transitionDuration) <= 0.00001,
      'Reduced-motion CSS removes meaningful shell transition duration'
    );

    let responsiveMatrixPassed = true;
    for (const [name, width, height] of VIEWPORTS) {
      await page.setViewportSize({ width, height });
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      responsiveMatrixPassed = responsiveMatrixPassed && overflow <= 1;
      await page.screenshot({
        path: path.join(SCREENSHOT_DIRECTORY, `${name}.png`),
        fullPage: true
      });
    }
    assert(responsiveMatrixPassed, 'Dashboard shell has no root overflow across the nine-viewport matrix');

    await page.setViewportSize({ width: 640, height: 900 });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    const zoomOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    assert(zoomOverflow <= 1, 'Shell remains usable at the CSS viewport equivalent of 200% zoom');
    assert(await page.getByRole('button', { name: 'Open navigation' }).isVisible(), 'Navigation remains available at 200% zoom');
  } finally {
    await browser.close();
  }

  console.log(`\nPhase 4 responsive shell verification: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
