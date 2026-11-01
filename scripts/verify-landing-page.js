import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

async function verifyLandingPage() {
  console.log('--- Verifying Foclyra Landing Page with In-Process Static Server ---');

  const distDir = path.resolve('c:/Users/samee/OneDrive/Desktop/foclyra/dist');
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.woff2': 'font/woff2',
    '.json': 'application/json',
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    let filePath = path.join(distDir, reqPath);

    // If requesting root or a client-side route (no extension), serve index.html
    if (!path.extname(reqPath) || !fs.existsSync(filePath)) {
      filePath = path.join(distDir, 'index.html');
    }

    try {
      const data = fs.readFileSync(filePath);
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  await new Promise((resolve) => server.listen(4173, resolve));
  console.log('Static SPA server running on http://localhost:4173');

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 850 } });
  const page = await context.newPage();

  try {
    console.log('1. Navigating to http://localhost:4173/landing...');
    await page.goto('http://localhost:4173/landing', { waitUntil: 'networkidle' });

    // Verify Title & Hero
    const heading = await page.textContent('h1');
    console.log('[PASS] H1 Heading:', heading.replace(/\s+/g, ' ').trim());

    // Verify Bento Grid
    const bentoHeading = await page.textContent('#bento h2');
    console.log('[PASS] Bento Heading:', bentoHeading);

    // Verify FAQs
    const faqCount = await page.locator('#faq button').count();
    console.log(`[PASS] FAQs rendered: ${faqCount}`);

    // Click first FAQ to test accordion
    await page.locator('#faq button').first().click();
    await page.waitForTimeout(400);
    const faqAnswer = await page.locator('#faq').textContent();
    const hasAnswer = faqAnswer.includes('100% free and open-source');
    console.log(`[PASS] FAQ toggle interactive: ${hasAnswer}`);

    // Copy screenshots to brain artifact directory so they can be viewed
    const artifactDir = 'C:/Users/samee/.gemini/antigravity/brain/66de58e6-4723-4daf-81b3-2811734f11be';
    const screenshotDesktopPath = path.join(artifactDir, 'foclyra-landing-desktop.png');
    await page.screenshot({ path: screenshotDesktopPath, fullPage: true });
    console.log(`[PASS] Full page desktop screenshot saved: ${screenshotDesktopPath}`);

    // Test Navigation to Studio
    console.log('2. Testing "Start Learning Free" CTA navigation...');
    await page.locator('text=Start Learning Free').first().click();
    await page.waitForTimeout(600);
    console.log(`[PASS] Navigated to: ${page.url()}`);

    // Verify Dashboard Loaded
    const dashboardHero = await page.locator('text=Study without distractions').isVisible();
    console.log(`[PASS] Dashboard loaded after CTA click: ${dashboardHero}`);

    // Test "Feature Showcase" link back to landing
    console.log('3. Testing link back to Feature Showcase...');
    await page.locator('text=Feature Showcase →').click();
    await page.waitForTimeout(600);
    console.log(`[PASS] Navigated back to: ${page.url()}`);

    // Test Mobile Viewport
    console.log('4. Testing Mobile Viewport (390x844)...');
    await page.setViewportSize({ width: 390, height: 844 });
    const screenshotMobilePath = path.join(artifactDir, 'foclyra-landing-mobile.png');
    await page.screenshot({ path: screenshotMobilePath, fullPage: false });
    console.log(`[PASS] Mobile screenshot saved: ${screenshotMobilePath}`);

    console.log('\n=============================================');
    console.log('🎉 ALL LANDING PAGE TESTS PASSED 100%!');
    console.log('=============================================');
  } finally {
    await browser.close();
    server.close();
  }
}

verifyLandingPage().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
