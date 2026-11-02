/**
 * Verification Test: Guest & Authenticated Routing Suite (Phase 3)
 * Tests:
 * 1. Guest user visits / -> lands on LandingPage.
 * 2. Guest user visits /studio -> lands on Playlist Import page.
 * 3. Guest user visits /import -> redirected to /studio.
 * 4. Guest user visits random route -> redirected to /studio.
 * 5. Authenticated user visits / or /landing -> automatically redirected to /studio.
 * 6. Sign out -> redirects to /studio (Guest Playlist Import page) with "Sign In" option.
 */

import { chromium } from 'playwright';

async function runRoutingTests() {
  console.log('\n======================================================');
  console.log('🧭 FOCLYRA GUEST & AUTHENTICATED ROUTING VERIFICATION');
  console.log('======================================================\n');

  const browser = await chromium.launch({ headless: true, channel: 'chrome' });

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    const guestContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await guestContext.newPage();

    // --------------------------------------------------------------------------
    // TEST 1: Guest visits / (Landing Page)
    // --------------------------------------------------------------------------
    console.log('--- Test 1: Guest User on Root Path ---');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    const currentUrl1 = page.url();
    assert(currentUrl1.endsWith('/') || currentUrl1.endsWith('/landing'), 'Guest remains on Landing Page when visiting /');
    
    const heroTitle = await page.locator('h1').first().innerText();
    assert(heroTitle.toLowerCase().includes('study any youtube playlist') || heroTitle.toLowerCase().includes('youtube'), 'Landing page hero is displayed to guests');

    // --------------------------------------------------------------------------
    // TEST 2: Guest visits /studio (Playlist Import Page)
    // --------------------------------------------------------------------------
    console.log('\n--- Test 2: Guest User on /studio ---');
    await page.goto('http://localhost:5173/studio', { waitUntil: 'networkidle' });
    const currentUrl2 = page.url();
    assert(currentUrl2.endsWith('/studio'), 'Guest lands directly on /studio');
    
    // Check that "Sign In" button is displayed in the header
    const signInBtn = page.locator('button:has-text("Sign In")').first();
    assert(await signInBtn.isVisible(), 'Sign In option clearly visible in header');

    // --------------------------------------------------------------------------
    // TEST 3: /import Alias Redirect
    // --------------------------------------------------------------------------
    console.log('\n--- Test 3: /import Redirects to /studio ---');
    await page.goto('http://localhost:5173/import', { waitUntil: 'networkidle' });
    const currentUrl3 = page.url();
    assert(currentUrl3.endsWith('/studio'), '/import seamlessly redirects to /studio');

    // --------------------------------------------------------------------------
    // TEST 4: Wildcard 404 Route Redirect
    // --------------------------------------------------------------------------
    console.log('\n--- Test 4: Wildcard 404 Redirects to /studio ---');
    await page.goto('http://localhost:5173/some-non-existent-route-99', { waitUntil: 'networkidle' });
    const currentUrl4 = page.url();
    assert(currentUrl4.endsWith('/studio'), 'Unknown routes safely redirect to /studio');

    // --------------------------------------------------------------------------
    // TEST 5: Authenticated User Auto-Redirect from Landing Page
    // --------------------------------------------------------------------------
    console.log('\n--- Test 5: Authenticated User Auto-Redirects from Landing Page ---');
    
    const authContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const authPage = await authContext.newPage();

    // Populate localStorage directly on initial page
    await authPage.goto('http://localhost:5173/studio', { waitUntil: 'domcontentloaded' });
    await authPage.evaluate(() => {
      const mockSession = {
        access_token: 'mock-access-token-12345',
        refresh_token: 'mock-refresh-token-12345',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: {
          id: 'b2c3d4e5-f6a1-4b2c-8d3e-4f5a6b7c8d9e',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'student.auth@foclyra.com',
          user_metadata: { full_name: 'Alex Rivera' }
        }
      };
      window.localStorage.setItem('sb-vafzelnurniofibxynro-auth-token', JSON.stringify(mockSession));
    });

    // Test navigation to root '/' as authenticated user
    await authPage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    const authRootUrl = authPage.url();
    assert(authRootUrl.endsWith('/studio'), `Authenticated user on / is automatically redirected to /studio (actual: ${authRootUrl})`);

    // Also test navigation to '/landing' as authenticated user
    await authPage.goto('http://localhost:5173/landing', { waitUntil: 'networkidle' });
    const authLandingUrl = authPage.url();
    assert(authLandingUrl.endsWith('/studio'), `Authenticated user on /landing is automatically redirected to /studio (actual: ${authLandingUrl})`);

    // --------------------------------------------------------------------------
    // TEST 6: Sign Out Redirect to Guest Playlist Import Page
    // --------------------------------------------------------------------------
    console.log('\n--- Test 6: Sign Out Redirect to Guest Playlist Import Page ---');
    
    // Perform sign out in the authenticated context
    await authPage.evaluate(async () => {
      const { useAuth } = await import('/src/hooks/useAuth.js');
      await useAuth.getState().signOut();
    });

    // Verify localStorage auth token is cleared
    const storedToken = await authPage.evaluate(() => {
      return window.localStorage.getItem('sb-vafzelnurniofibxynro-auth-token');
    });
    assert(storedToken === null, 'Auth token is cleared from localStorage upon signOut()');

    // Reload /studio (should be guest now)
    await authPage.goto('http://localhost:5173/studio', { waitUntil: 'networkidle' });
    const signedOutUrl = authPage.url();
    assert(signedOutUrl.endsWith('/studio'), 'Signed-out user lands on /studio (Guest Playlist Import page)');

    // Verify Sign In option is present
    const signInAfterLogout = authPage.locator('button:has-text("Sign In")').first();
    assert(await signInAfterLogout.isVisible(), 'Guest Playlist Import page shows Sign In button after logout');

    // --------------------------------------------------------------------------
    // SUMMARY
    // --------------------------------------------------------------------------
    console.log('\n======================================================');
    console.log(`TOTAL ROUTING TESTS: ${passed + failed}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log('======================================================\n');

    if (failed > 0) process.exit(1);
    else process.exit(0);

  } finally {
    await browser.close();
  }
}

runRoutingTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
