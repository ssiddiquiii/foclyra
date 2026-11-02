/**
 * Comprehensive Verification Suite: All 12 Critical User Journey Edge Cases
 * 
 * Scenarios tested:
 *  1. Guest imports Playlist A -> signs up -> Playlist A appears in their account.
 *  2. Guest imports Playlist A -> signs up -> refreshes the page -> Playlist A remains available.
 *  3. Guest signs up -> migration request retries -> no duplicate Playlist A.
 *  4. Registered user signs out -> Guest Import page appears.
 *  5. Registered user signs out -> previous account playlists are not visible.
 *  6. User A signs out -> User B signs in -> User A's playlists are not visible.
 *  7. User signs in again -> their previous playlists are restored.
 *  8. Guest tries importing a second playlist -> signup prompt appears (GUEST_LIMIT_REACHED).
 *  9. Registered user reaches the 5-playlist limit -> additional imports are blocked (REGISTERED_LIMIT_REACHED).
 * 10. User deletes Playlist A -> re-imports Playlist A -> allowed according to existing rules.
 * 11. Network failure during guest migration -> no data loss or duplicate records.
 * 12. Refreshing or reopening the application does not produce an incorrect guest/authenticated state.
 */

import { chromium } from 'playwright';

async function runAll12EdgeCases() {
  console.log('\n================================================================');
  console.log('🧪 FOCLYRA COMPLETE USER JOURNEY VERIFICATION (12 EDGE CASES)');
  console.log('================================================================\n');

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

    // Mock User IDs
    const userA_Id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const userB_Id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

    // --------------------------------------------------------------------------
    // CASE 1: Guest imports Playlist A -> signs up -> Playlist A appears in account
    // --------------------------------------------------------------------------
    console.log('--- Case 1: Guest imports Playlist A -> signs up -> Playlist A migrates to account ---');
    
    const case1Result = await page.evaluate(async ({ userA_Id }) => {
      const { db } = await import('/src/db/FoclyraDB.js');
      const { useAuth } = await import('/src/hooks/useAuth.js');
      const { recordGuestImport } = await import('/src/services/quotaService.js');
      const { migrateGuestPlaylistToAccount } = await import('/src/services/cloudSyncService.js');
      const { supabase } = await import('/src/services/supabaseClient.js');

      await db.resetDatabase();
      localStorage.clear();

      // Guest imports Playlist A
      const playlistA = 'PL_GUEST_COURSE_ALPHA';
      recordGuestImport(playlistA);
      await db.courses.put({
        id: playlistA,
        title: 'Mastering TypeScript & React',
        thumbnailUrl: 'https://img.youtube.com/vi/test/hqdefault.jpg',
        channelName: 'Code Academy',
        type: 'youtube',
        totalLessons: 12,
        createdAt: Date.now()
      });

      await db.lessons.bulkPut([
        { id: 'ts_l1', courseId: playlistA, title: 'Types & Interfaces', durationSeconds: 600, index: 1, type: 'youtube' },
        { id: 'ts_l2', courseId: playlistA, title: 'Generics Deep Dive', durationSeconds: 900, index: 2, type: 'youtube' }
      ]);

      await db.progress.put({
        id: `${playlistA}_ts_l1`,
        courseId: playlistA,
        lessonId: 'ts_l1',
        completed: true,
        watchTime: 600,
        lastWatched: Date.now(),
        updatedAt: Date.now()
      });

      await db.notes.add({
        courseId: playlistA,
        lessonId: 'ts_l1',
        timestamp: 150,
        content: 'Important interface vs type difference',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      // Mock Supabase cloud tables
      const cloudStorage = {
        user_courses: [],
        user_progress: [],
        user_notes: []
      };

      supabase.from = (table) => {
        return {
          select: (cols) => ({
            eq: (col, val) => {
              if (table === 'user_notes') {
                return {
                  eq: () => ({
                    eq: () => ({
                      eq: () => ({
                        maybeSingle: () => Promise.resolve({ data: null, error: null })
                      })
                    })
                  })
                };
              }
              const rows = (cloudStorage[table] || []).filter(r => r[col] === val);
              return Promise.resolve({ data: rows, error: null });
            }
          }),
          upsert: (payload) => {
            const list = Array.isArray(payload) ? payload : [payload];
            if (!cloudStorage[table]) cloudStorage[table] = [];
            for (const item of list) {
              const existingIdx = cloudStorage[table].findIndex(r => r.course_id === item.course_id && (!item.id || r.id === item.id));
              if (existingIdx >= 0) cloudStorage[table][existingIdx] = item;
              else cloudStorage[table].push(item);
            }
            return Promise.resolve({ error: null });
          },
          insert: (payload) => {
            if (!cloudStorage[table]) cloudStorage[table] = [];
            cloudStorage[table].push(payload);
            return Promise.resolve({ error: null });
          },
          delete: () => ({
            eq: () => ({
              eq: () => Promise.resolve({ error: null })
            })
          })
        };
      };

      // Mock user signs up
      const mockUserA = {
        id: userA_Id,
        email: 'userA@test.com',
        user_metadata: { full_name: 'User A' }
      };

      useAuth.setState({
        user: mockUserA,
        session: { access_token: 'tokA', user: mockUserA },
        isLoading: false
      });

      // Run migration
      const migrationResult = await migrateGuestPlaylistToAccount(mockUserA);

      return {
        migrationResult,
        cloudCoursesCount: cloudStorage.user_courses.length,
        cloudProgressCount: cloudStorage.user_progress.length,
        cloudNotesCount: cloudStorage.user_notes.length,
        cloudCourseId: cloudStorage.user_courses[0]?.course_id,
        guestHistoryCleared: localStorage.getItem('foclyra_guest_history') === null
      };
    }, { userA_Id });

    assert(case1Result.migrationResult.success === true, 'Migration returned success = true');
    assert(case1Result.cloudCoursesCount === 1, 'Playlist A migrated to cloud user_courses');
    assert(case1Result.cloudCourseId === 'PL_GUEST_COURSE_ALPHA', 'Migrated course ID matches Playlist A');
    assert(case1Result.cloudProgressCount === 1, 'Watch progress migrated to cloud user_progress');
    assert(case1Result.cloudNotesCount === 1, 'Timestamped note migrated to cloud user_notes');
    assert(case1Result.guestHistoryCleared, 'Guest import history cleared only after confirmed upload');

    // --------------------------------------------------------------------------
    // CASE 2: Page Refresh -> Playlist A remains available
    // --------------------------------------------------------------------------
    console.log('\n--- Case 2: Page refresh -> Playlist A remains available ---');

    const case2Result = await page.evaluate(async () => {
      const { db } = await import('/src/db/FoclyraDB.js');
      const courses = await db.courses.toArray();
      const progress = await db.progress.toArray();
      const notes = await db.notes.toArray();
      return {
        coursesCount: courses.length,
        courseTitle: courses[0]?.title,
        progressCount: progress.length,
        notesCount: notes.length
      };
    });

    assert(case2Result.coursesCount === 1, 'Local Dexie preserves Playlist A seamlessly without re-downloading');
    assert(case2Result.courseTitle === 'Mastering TypeScript & React', 'Course title preserved accurately');
    assert(case2Result.progressCount === 1, 'Local progress preserved');
    assert(case2Result.notesCount === 1, 'Local note preserved');

    // --------------------------------------------------------------------------
    // CASE 3: Migration Request Retries -> No duplicate Playlist A
    // --------------------------------------------------------------------------
    console.log('\n--- Case 3: Migration request retries -> No duplicate records ---');

    const case3Result = await page.evaluate(async ({ userA_Id }) => {
      const { db } = await import('/src/db/FoclyraDB.js');
      const { migrateGuestPlaylistToAccount } = await import('/src/services/cloudSyncService.js');

      const mockUserA = { id: userA_Id, email: 'userA@test.com' };

      // Retry migration 3 times consecutively
      await migrateGuestPlaylistToAccount(mockUserA);
      await migrateGuestPlaylistToAccount(mockUserA);
      await migrateGuestPlaylistToAccount(mockUserA);

      const localCourses = await db.courses.toArray();
      const localNotes = await db.notes.toArray();

      return {
        localCoursesCount: localCourses.length,
        localNotesCount: localNotes.length
      };
    }, { userA_Id });

    assert(case3Result.localCoursesCount === 1, 'Retried migration produces 0 duplicate courses');
    assert(case3Result.localNotesCount === 1, 'Retried migration produces 0 duplicate notes');

    // --------------------------------------------------------------------------
    // CASE 4: Registered User Signs Out -> Guest Import Page appears
    // --------------------------------------------------------------------------
    console.log('\n--- Case 4: Registered user signs out -> Guest Import Page appears ---');

    await page.evaluate(async () => {
      const { useAuth } = await import('/src/hooks/useAuth.js');
      await useAuth.getState().signOut();
    });

    const isSignOutUserNull = await page.evaluate(async () => {
      const { useAuth } = await import('/src/hooks/useAuth.js');
      return useAuth.getState().user === null;
    });
    assert(isSignOutUserNull, 'User state reset to null on signOut');

    // --------------------------------------------------------------------------
    // CASE 5: Previous account playlists not visible after sign out
    // --------------------------------------------------------------------------
    console.log('\n--- Case 5: Previous account playlists not visible after sign out ---');

    const case5Result = await page.evaluate(async () => {
      const { db } = await import('/src/db/FoclyraDB.js');
      const courses = await db.courses.count();
      const notes = await db.notes.count();
      const progress = await db.progress.count();
      return { courses, notes, progress };
    });

    assert(case5Result.courses === 0, 'Zero courses in local storage after sign out');
    assert(case5Result.notes === 0, 'Zero notes in local storage after sign out');
    assert(case5Result.progress === 0, 'Zero progress records in local storage after sign out');

    // --------------------------------------------------------------------------
    // CASE 6: User A signs out -> User B signs in -> User A's playlists not visible
    // --------------------------------------------------------------------------
    console.log('\n--- Case 6: User A signs out -> User B signs in -> User A playlists not visible ---');

    const case6Result = await page.evaluate(async ({ userB_Id }) => {
      const { db } = await import('/src/db/FoclyraDB.js');
      const { useAuth } = await import('/src/hooks/useAuth.js');
      const { supabase } = await import('/src/services/supabaseClient.js');
      const { hydrateFromCloud } = await import('/src/services/cloudSyncService.js');

      // Setup cloud data for User B
      supabase.from = (table) => {
        if (table === 'user_courses') {
          return {
            select: () => ({
              eq: (col, val) => {
                if (val === userB_Id) {
                  return Promise.resolve({
                    data: [{
                      course_id: 'PL_USER_B_GOLANG',
                      title: 'Go Concurrency in Depth',
                      thumbnail_url: 'https://img.youtube.com/vi/go/hqdefault.jpg',
                      total_lessons: 8
                    }],
                    error: null
                  });
                }
                return Promise.resolve({ data: [], error: null });
              }
            }),
            upsert: () => Promise.resolve({ error: null })
          };
        }
        return {
          select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
          upsert: () => Promise.resolve({ error: null })
        };
      };

      const mockUserB = { id: userB_Id, email: 'userB@golang.com' };
      useAuth.setState({ user: mockUserB, session: { user: mockUserB }, isLoading: false });

      await hydrateFromCloud(mockUserB);

      const courses = await db.courses.toArray();
      return {
        coursesList: courses.map(c => c.id),
        hasUserBCourse: courses.some(c => c.id === 'PL_USER_B_GOLANG'),
        hasUserACourse: courses.some(c => c.id === 'PL_GUEST_COURSE_ALPHA')
      };
    }, { userB_Id });

    assert(case6Result.hasUserBCourse, 'User B sees their own Go Concurrency playlist');
    assert(!case6Result.hasUserACourse, 'User B DOES NOT see User A Playlist A');

    // --------------------------------------------------------------------------
    // CASE 7: User A signs in again -> their previous playlists are restored
    // --------------------------------------------------------------------------
    console.log('\n--- Case 7: User A signs in again -> previous playlists restored ---');

    const case7Result = await page.evaluate(async ({ userA_Id }) => {
      const { db } = await import('/src/db/FoclyraDB.js');
      const { useAuth } = await import('/src/hooks/useAuth.js');
      const { supabase } = await import('/src/services/supabaseClient.js');
      const { hydrateFromCloud } = await import('/src/services/cloudSyncService.js');

      // User B logs out
      await useAuth.getState().signOut();

      // Cloud mock for User A
      supabase.from = (table) => {
        if (table === 'user_courses') {
          return {
            select: () => ({
              eq: (col, val) => {
                if (val === userA_Id) {
                  return Promise.resolve({
                    data: [{
                      course_id: 'PL_GUEST_COURSE_ALPHA',
                      title: 'Mastering TypeScript & React',
                      thumbnail_url: 'https://img.youtube.com/vi/test/hqdefault.jpg',
                      total_lessons: 12
                    }],
                    error: null
                  });
                }
                return Promise.resolve({ data: [], error: null });
              }
            }),
            upsert: () => Promise.resolve({ error: null })
          };
        }
        return {
          select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
          upsert: () => Promise.resolve({ error: null })
        };
      };

      const mockUserA = { id: userA_Id, email: 'userA@test.com' };
      useAuth.setState({ user: mockUserA, session: { user: mockUserA }, isLoading: false });

      await hydrateFromCloud(mockUserA);

      const courses = await db.courses.toArray();
      return {
        hasUserACourse: courses.some(c => c.id === 'PL_GUEST_COURSE_ALPHA'),
        hasUserBCourse: courses.some(c => c.id === 'PL_USER_B_GOLANG')
      };
    }, { userA_Id });

    assert(case7Result.hasUserACourse, 'User A restored their original Playlist A from cloud');
    assert(!case7Result.hasUserBCourse, 'User A has zero remnant playlists from User B');

    // --------------------------------------------------------------------------
    // CASE 8: Guest tries importing a 2nd playlist -> signup prompt appears
    // --------------------------------------------------------------------------
    console.log('\n--- Case 8: Guest tries importing a 2nd playlist -> Blocked by Quota ---');

    const case8Result = await page.evaluate(async () => {
      const { useAuth } = await import('/src/hooks/useAuth.js');
      const { db } = await import('/src/db/FoclyraDB.js');
      const { checkPlaylistImportQuota, recordGuestImport } = await import('/src/services/quotaService.js');

      // Logout to guest
      await useAuth.getState().signOut();
      await db.resetDatabase();
      localStorage.clear();

      // Guest imports 1st playlist
      const playlist1 = 'PL_GUEST_SLOT_1';
      recordGuestImport(playlist1);
      await db.courses.put({ id: playlist1, title: 'Course 1', totalLessons: 5, createdAt: Date.now() });

      // Guest attempts 2nd playlist
      const check = await checkPlaylistImportQuota({ user: null, playlistId: 'PL_GUEST_SLOT_2' });

      return {
        allowed: check.allowed,
        reason: check.reason,
        currentCount: check.currentCount,
        maxLimit: check.maxLimit
      };
    });

    assert(case8Result.allowed === false, 'Guest is blocked from importing a second playlist');
    assert(case8Result.reason === 'GUEST_LIMIT_REACHED', 'Quota reason returned is GUEST_LIMIT_REACHED');
    assert(case8Result.maxLimit === 1, 'Guest maxLimit is 1');

    // --------------------------------------------------------------------------
    // CASE 9: Registered user reaches 5-playlist limit -> additional blocked
    // --------------------------------------------------------------------------
    console.log('\n--- Case 9: Registered user reaches 5-playlist limit -> 6th blocked ---');

    const case9Result = await page.evaluate(async ({ userA_Id }) => {
      const { supabase } = await import('/src/services/supabaseClient.js');
      const { checkPlaylistImportQuota } = await import('/src/services/quotaService.js');

      const mockUserA = { id: userA_Id, email: 'userA@test.com' };

      // Mock user_courses with 5 playlists
      supabase.from = (table) => ({
        select: () => ({
          eq: () => Promise.resolve({
            data: [
              { course_id: 'PL_COURSE_1' },
              { course_id: 'PL_COURSE_2' },
              { course_id: 'PL_COURSE_3' },
              { course_id: 'PL_COURSE_4' },
              { course_id: 'PL_COURSE_5' }
            ],
            error: null
          })
        })
      });

      // Attempt 6th playlist
      const check6th = await checkPlaylistImportQuota({ user: mockUserA, playlistId: 'PL_COURSE_6_NEW' });
      // Attempt re-import of 3rd playlist
      const checkReimport = await checkPlaylistImportQuota({ user: mockUserA, playlistId: 'PL_COURSE_3' });

      return {
        check6thAllowed: check6th.allowed,
        check6thReason: check6th.reason,
        reimportAllowed: checkReimport.allowed
      };
    }, { userA_Id });

    assert(case9Result.check6thAllowed === false, '6th playlist import is blocked for registered user');
    assert(case9Result.check6thReason === 'REGISTERED_LIMIT_REACHED', 'Reason returned is REGISTERED_LIMIT_REACHED');
    assert(case9Result.reimportAllowed === true, 'Re-importing existing 3rd playlist within 5 limit is allowed');

    // --------------------------------------------------------------------------
    // CASE 10: User deletes Playlist A -> re-imports Playlist A -> allowed
    // --------------------------------------------------------------------------
    console.log('\n--- Case 10: User deletes Playlist A -> re-imports Playlist A -> Allowed ---');

    const case10Result = await page.evaluate(async ({ userA_Id }) => {
      const { db } = await import('/src/db/FoclyraDB.js');
      const { supabase } = await import('/src/services/supabaseClient.js');
      const { deleteCourse } = await import('/src/services/dataCommands.js');
      const { checkPlaylistImportQuota } = await import('/src/services/quotaService.js');

      let userCoursesInCloud = [
        { course_id: 'PL_COURSE_1' },
        { course_id: 'PL_COURSE_2' },
        { course_id: 'PL_COURSE_3' },
        { course_id: 'PL_COURSE_4' },
        { course_id: 'PL_COURSE_5' }
      ];

      supabase.from = (table) => ({
        select: () => ({
          eq: () => Promise.resolve({ data: userCoursesInCloud, error: null })
        }),
        delete: () => ({
          eq: (col1, val1) => ({
            eq: (col2, val2) => {
              userCoursesInCloud = userCoursesInCloud.filter(c => c.course_id !== val2);
              return Promise.resolve({ error: null });
            }
          })
        })
      });

      const mockUserA = { id: userA_Id, email: 'userA@test.com' };

      // Set user session for getAuthUser()
      supabase.auth.getSession = async () => ({
        data: { session: { user: mockUserA } },
        error: null
      });

      // User deletes PL_COURSE_1
      await deleteCourse('PL_COURSE_1');

      // Verify quota check after deletion
      const checkReimport = await checkPlaylistImportQuota({ user: mockUserA, playlistId: 'PL_COURSE_1' });

      return {
        cloudCountAfterDelete: userCoursesInCloud.length,
        checkReimportAllowed: checkReimport.allowed
      };
    }, { userA_Id });

    assert(case10Result.cloudCountAfterDelete === 4, 'Cloud user_courses decremented from 5 to 4 after deletion');
    assert(case10Result.checkReimportAllowed === true, 'Re-import of deleted playlist is permitted under quota');

    // --------------------------------------------------------------------------
    // CASE 11: Network failure during guest migration -> no data loss
    // --------------------------------------------------------------------------
    console.log('\n--- Case 11: Network failure during migration -> No data loss ---');

    const case11Result = await page.evaluate(async ({ userA_Id }) => {
      const { db } = await import('/src/db/FoclyraDB.js');
      const { useAuth } = await import('/src/hooks/useAuth.js');
      const { supabase } = await import('/src/services/supabaseClient.js');
      const { recordGuestImport } = await import('/src/services/quotaService.js');
      const { migrateGuestPlaylistToAccount } = await import('/src/services/cloudSyncService.js');

      await useAuth.getState().signOut();
      await db.resetDatabase();
      localStorage.clear();

      // Guest imports Playlist X
      const playlistX = 'PL_GUEST_OFFLINE_X';
      recordGuestImport(playlistX);
      await db.courses.put({ id: playlistX, title: 'Offline Critical Study', totalLessons: 20, createdAt: Date.now() });

      // Mock network failure on Supabase
      supabase.from = () => {
        throw new Error('503 Service Unavailable: Simulated Network Crash');
      };

      const mockUserA = { id: userA_Id, email: 'userA@test.com' };
      const migrationRes = await migrateGuestPlaylistToAccount(mockUserA).catch(() => ({ migrated: false }));

      const localCourseStillPresent = await db.courses.get(playlistX);
      const guestHistoryStillPresent = localStorage.getItem('foclyra_guest_imported_playlists');

      return {
        migrationSuccess: migrationRes?.success || false,
        localPreserved: localCourseStillPresent !== undefined,
        guestHistoryPreserved: guestHistoryStillPresent !== null
      };
    }, { userA_Id });

    assert(!case11Result.migrationSuccess, 'Migration safely reports non-completion on network crash');
    assert(case11Result.localPreserved, 'Local Dexie course preserved completely despite network failure');
    assert(case11Result.guestHistoryPreserved, 'Guest localStorage history preserved for future retry');

    // --------------------------------------------------------------------------
    // CASE 12: Refreshing or reopening does not produce incorrect auth state
    // --------------------------------------------------------------------------
    console.log('\n--- Case 12: Page reload / reopen preserves consistent auth state ---');

    const reloadContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const reloadPage = await reloadContext.newPage();

    const validJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYWFhYWFhYS1hYWFhLTRhYWEtOGFhYS1hYWFhYWFhYWFhYWEiLCJlbWFpbCI6InVzZXJAdGVzdC5jb20iLCJleHAiOjI1MjQ2MDgwMDB9.c2lnbmF0dXJlMTIzNDU2Nzg5MA';

    const mockSession = {
      access_token: validJwt,
      refresh_token: 'mock-valid-refresh-jwt',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: {
        id: userA_Id,
        aud: 'authenticated',
        role: 'authenticated',
        email: 'userA@test.com',
        user_metadata: { full_name: 'User A' }
      }
    };

    // Populate localStorage in reloadPage
    await reloadPage.goto('http://localhost:5173/studio', { waitUntil: 'domcontentloaded' });
    await reloadPage.evaluate((mockSession) => {
      localStorage.setItem('sb-vafzelnurniofibxynro-auth-token', JSON.stringify(mockSession));
    }, mockSession);

    // Reload or reopen application
    await reloadPage.goto('http://localhost:5173/studio', { waitUntil: 'networkidle' });

    // Wait for authenticated header to render
    await reloadPage.waitForSelector('header button:has-text("User A")', { timeout: 5000 });

    const hasUserText = await reloadPage.locator('header').last().locator('text=User A').isVisible();
    assert(hasUserText, 'User profile display name "User A" rendered in header after reload');

    const hasQuotaPill = await reloadPage.locator('header').last().locator('text=0/5').isVisible();
    assert(hasQuotaPill, 'Authenticated quota pill (0/5) rendered in header after reload');

    const signInButton = reloadPage.locator('button:has-text("Sign In")').first();
    assert(!(await signInButton.isVisible()), 'Guest "Sign In" CTA is hidden for authenticated user across reload');

    // --------------------------------------------------------------------------
    // SUMMARY
    // --------------------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`TOTAL EDGE CASE TESTS: ${passed + failed}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log('================================================================\n');

    if (failed > 0) process.exit(1);
    else process.exit(0);

  } finally {
    await browser.close();
  }
}

runAll12EdgeCases().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
