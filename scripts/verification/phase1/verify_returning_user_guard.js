/**
 * Verification Test: Returning Registered User Guard (No Ghost Guest Sessions)
 * 
 * Tests:
 * 1. Fresh guest user (never signed up) -> allowed 1 guest trial playlist.
 * 2. User signs up / signs in -> sets foclyra_has_registered_account flag in localStorage.
 * 3. Registered user logs out -> lands on Studio (Guest mode) but with "Welcome Back" indicator.
 * 4. Logged out registered user attempts playlist import -> immediately blocked from ghost guesting,
 *    AuthModal opens with 'returning_user' context and 'signin' mode.
 * 5. Intended playlist URL is preserved in sessionStorage for seamless post-login auto-import.
 * 6. Permanent account deletion resets returning user flag back to clean first-time guest.
 */

import { chromium } from 'playwright';

async function runReturningUserGuardTests() {
  console.log('\n======================================================');
  console.log('🛡️  FOCLYRA RETURNING REGISTERED USER GUARD VERIFICATION');
  console.log('======================================================\n');

  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

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
    await page.goto('http://localhost:5173/studio', { waitUntil: 'networkidle' });

    // --------------------------------------------------------------------------
    // TEST 1: Fresh Guest User is Allowed Trial
    // --------------------------------------------------------------------------
    console.log('--- Test 1: Fresh Guest User Allowance ---');

    const test1Result = await page.evaluate(async () => {
      const { db } = await import('/src/db/FoclyraDB.js');
      const { useAuth } = await import('/src/hooks/useAuth.js');
      const { isReturningRegisteredUser, checkPlaylistImportQuota } = await import('/src/services/quotaService.js');

      await useAuth.getState().signOut();
      await db.resetDatabase();
      localStorage.clear();

      const isReturning = isReturningRegisteredUser();
      const quota = await checkPlaylistImportQuota({ user: null, playlistId: 'PL_FRESH_TRIAL_1' });

      return {
        isReturning,
        allowed: quota.allowed
      };
    });

    assert(!test1Result.isReturning, 'Fresh guest is not marked as returning registered user');
    assert(test1Result.allowed, 'Fresh guest is allowed 1 free trial playlist');

    // --------------------------------------------------------------------------
    // TEST 2: Active User Signs In -> Flag is Persisted
    // --------------------------------------------------------------------------
    console.log('\n--- Test 2: Active User Marks Registered State ---');

    const test2Result = await page.evaluate(async () => {
      const { useAuth } = await import('/src/hooks/useAuth.js');
      const { isReturningRegisteredUser } = await import('/src/services/quotaService.js');

      const mockUser = {
        id: '12345678-1234-4234-8234-123456789abc',
        email: 'learner@foclyra.com',
        user_metadata: { full_name: 'Active Learner' }
      };

      // Set user session in store
      useAuth.setState({
        user: mockUser,
        session: { access_token: 'tok', user: mockUser },
        isLoading: false
      });

      // Call initAuth listener or helper
      const { setReturningRegisteredUser } = await import('/src/services/quotaService.js');
      setReturningRegisteredUser(true);

      const flagInStorage = localStorage.getItem('foclyra_has_registered_account');
      const isReturning = isReturningRegisteredUser();

      return { flagInStorage, isReturning };
    });

    assert(test2Result.flagInStorage === 'true', 'foclyra_has_registered_account stored in localStorage');
    assert(test2Result.isReturning === true, 'isReturningRegisteredUser() returns true for active user');

    // --------------------------------------------------------------------------
    // TEST 3: User Logs Out -> Returns to Guest Mode with Welcome Back
    // --------------------------------------------------------------------------
    console.log('\n--- Test 3: Logged Out Registered User State ---');

    const test3Result = await page.evaluate(async () => {
      const { useAuth } = await import('/src/hooks/useAuth.js');
      const { db } = await import('/src/db/FoclyraDB.js');
      const { isReturningRegisteredUser } = await import('/src/services/quotaService.js');

      // User signs out
      await useAuth.getState().signOut();

      // Session isolation verified
      const currentUser = useAuth.getState().user;
      const coursesInDexie = await db.courses.count();

      // But registered user memory is preserved
      const isReturning = isReturningRegisteredUser();

      return {
        isUserNull: currentUser === null,
        coursesInDexie,
        isReturning
      };
    });

    assert(test3Result.isUserNull, 'Auth store user is null after logout');
    assert(test3Result.coursesInDexie === 0, 'Dexie database is wiped clean on logout for session isolation');
    assert(test3Result.isReturning === true, 'Returning registered user flag persists across logout');

    // --------------------------------------------------------------------------
    // TEST 4: Logged Out Registered User Quota Check Blocked
    // --------------------------------------------------------------------------
    console.log('\n--- Test 4: Quota Check Blocks Ghost Guest Sessions ---');

    const test4Result = await page.evaluate(async () => {
      const { checkPlaylistImportQuota } = await import('/src/services/quotaService.js');

      const quotaCheck = await checkPlaylistImportQuota({
        user: null,
        playlistId: 'PL_RETURNING_ATTEMPT_1'
      });

      return {
        allowed: quotaCheck.allowed,
        reason: quotaCheck.reason
      };
    });

    assert(test4Result.allowed === false, 'Returning registered user is blocked from importing as guest');
    assert(test4Result.reason === 'RETURNING_USER_SIGNIN_REQUIRED', 'Quota reason returned is RETURNING_USER_SIGNIN_REQUIRED');

    // --------------------------------------------------------------------------
    // TEST 5: UI Form Submission Prompts Sign In & Preserves Intended URL
    // --------------------------------------------------------------------------
    console.log('\n--- Test 5: UI Form Submission Opens AuthModal (Returning User) ---');

    // Fill the input in Studio
    const inputLocator = page.locator('input[placeholder*="Paste YouTube"]').first();
    await inputLocator.fill('https://www.youtube.com/playlist?list=PL_TEST_RETURNING_FLOW_99');

    // Click Import Playlist button
    const submitBtn = page.locator('button:has-text("Import Playlist")').first();
    await submitBtn.click();
    await page.waitForTimeout(300);

    // Verify AuthModal opened with returning_user context
    const modalState = await page.evaluate(async () => {
      const { useUIStore } = await import('/src/hooks/useUIStore.js');
      return {
        isOpen: useUIStore.getState().authModalOpen,
        context: useUIStore.getState().authModalContext,
        pendingUrl: sessionStorage.getItem('foclyra_pending_import_url')
      };
    });

    assert(modalState.isOpen === true, 'AuthModal opens automatically when returning user attempts import');
    assert(modalState.context === 'returning_user', 'AuthModal context is set to returning_user');
    assert(modalState.pendingUrl === 'https://www.youtube.com/playlist?list=PL_TEST_RETURNING_FLOW_99', 'Intended playlist URL saved in sessionStorage for post-login auto-import');

    // Check modal UI content
    const modalHeading = await page.locator('h2').first().innerText();
    assert(modalHeading.includes('Sign in to your Foclyra Account'), 'Modal displays "Sign in to your Foclyra Account" heading');

    const welcomeBadge = await page.locator('text=Welcome Back').first().isVisible();
    assert(welcomeBadge, 'Modal displays "Welcome Back" badge');

    // Close modal
    await page.locator('button[aria-label="Close modal"]').first().click();
    await page.waitForTimeout(200);

    // --------------------------------------------------------------------------
    // TEST 6: Account Deletion Resets Returning Flag Back to Fresh Guest
    // --------------------------------------------------------------------------
    console.log('\n--- Test 6: Account Deletion Cleans Registered State ---');

    const test6Result = await page.evaluate(async () => {
      const { useAuth } = await import('/src/hooks/useAuth.js');
      const { isReturningRegisteredUser } = await import('/src/services/quotaService.js');

      // Simulate logged in user
      useAuth.setState({
        user: { id: 'usr-del', email: 'del@foclyra.com' },
        session: { user: { id: 'usr-del' } }
      });

      // User deletes account
      await useAuth.getState().deleteAccount();

      return {
        isReturning: isReturningRegisteredUser(),
        storageValue: localStorage.getItem('foclyra_has_registered_account')
      };
    });

    assert(!test6Result.isReturning, 'After deleteAccount(), user is no longer marked as returning');
    assert(test6Result.storageValue === null, 'foclyra_has_registered_account removed from localStorage');

    // --------------------------------------------------------------------------
    // SUMMARY
    // --------------------------------------------------------------------------
    console.log('\n======================================================');
    console.log(`TOTAL RETURNING USER GUARD TESTS: ${passed + failed}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log('======================================================\n');

    if (failed > 0) process.exit(1);
    else process.exit(0);

  } finally {
    await browser.close();
  }
}

runReturningUserGuardTests().catch(err => {
  console.error('Returning user verification error:', err);
  process.exit(1);
});
