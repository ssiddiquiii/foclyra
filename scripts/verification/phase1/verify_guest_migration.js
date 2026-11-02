/**
 * Verification Test: Guest-to-User Playlist Migration Suite (Phase 2)
 * Runs in Playwright Chrome environment with real IndexedDB and real browser storage.
 * Tests:
 * 1. Safe migration of guest playlist, progress, and notes into authenticated account.
 * 2. Idempotence: Migration retries do not create duplicate records.
 * 3. Network resilience: Failures do not discard guest data or clear guest quota.
 * 4. Confirmation: Guest-specific storage is cleared only after confirmed upload.
 */

import { chromium } from 'playwright';

async function runGuestMigrationBrowserTest() {
  console.log('\n======================================================');
  console.log('🔄 FOCLYRA GUEST-TO-USER MIGRATION VERIFICATION SUITE');
  console.log('======================================================\n');

  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  try {
    await page.goto('http://localhost:5173/studio', { waitUntil: 'networkidle' });
    console.log('Opened studio at http://localhost:5173/studio');

    const result = await page.evaluate(async () => {
      const logs = [];
      let passed = 0;
      let failed = 0;

      function assert(condition, message) {
        if (condition) {
          logs.push(`  ✓ PASS: ${message}`);
          passed++;
        } else {
          logs.push(`  ✗ FAIL: ${message}`);
          failed++;
        }
      }

      const { db } = await import('/src/db/FoclyraDB.js');
      const { migrateGuestPlaylistToAccount } = await import('/src/services/cloudSyncService.js');
      const { getGuestImportHistory, recordGuestImport, clearGuestImportHistory } = await import('/src/services/quotaService.js');
      const { supabase } = await import('/src/services/supabaseClient.js');

      const testUser = { id: 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d', email: 'guest-to-user@foclyra.com' };

      // Spy / interceptor for Supabase calls to simulate real cloud cloud sync & network failure
      const cloudStore = {
        courses: new Map(),
        progress: new Map(),
        notes: []
      };

      let simulateNetworkFailure = false;

      // Mock Supabase from(...) handlers
      const originalFrom = supabase.from.bind(supabase);
      supabase.from = (table) => {
        if (simulateNetworkFailure) {
          return {
            upsert: async () => ({ error: { message: 'Network connection lost (503 Service Unavailable)' } }),
            insert: async () => ({ error: { message: 'Network connection lost (503 Service Unavailable)' } }),
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) })
                  })
                })
              })
            })
          };
        }

        if (table === 'user_courses') {
          return {
            upsert: async (payload, opts) => {
              const key = `${payload.user_id}:${payload.course_id}`;
              cloudStore.courses.set(key, payload);
              return { data: payload, error: null };
            }
          };
        }

        if (table === 'user_progress') {
          return {
            upsert: async (payload, opts) => {
              cloudStore.progress.set(payload.id, payload);
              return { data: payload, error: null };
            }
          };
        }

        if (table === 'user_notes') {
          return {
            select: () => ({
              eq: (f1, v1) => ({
                eq: (f2, v2) => ({
                  eq: (f3, v3) => ({
                    eq: (f4, v4) => ({
                      maybeSingle: async () => {
                        const existing = cloudStore.notes.find(
                          n => n.user_id === v1 && n.course_id === v2 && n.lesson_id === v3 && n.timestamp === v4
                        );
                        return { data: existing || null, error: null };
                      }
                    })
                  })
                })
              })
            }),
            insert: async (payload) => {
              cloudStore.notes.push(payload);
              return { data: payload, error: null };
            }
          };
        }

        return originalFrom(table);
      };

      // --------------------------------------------------------------------------
      // TEST 1: Clean No-Op When Guest Has Zero Courses
      // --------------------------------------------------------------------------
      logs.push('--- Test 1: Clean No-Op for New Empty Guest ---');
      await db.resetDatabase();
      clearGuestImportHistory();

      const emptyMigration = await migrateGuestPlaylistToAccount(testUser);
      assert(emptyMigration.success === true, 'Empty migration succeeds as clean no-op');
      assert(emptyMigration.migratedCount === 0, 'Zero courses migrated when none exist');

      // --------------------------------------------------------------------------
      // TEST 2: Successful Guest Playlist, Progress & Notes Migration
      // --------------------------------------------------------------------------
      logs.push('\n--- Test 2: Successful Migration of 1 Guest Playlist ---');
      const testCourseId = 'PLu71SKxNbfoBuX3f4EOACle2y-tRC5Q37';

      // 1. Setup guest state in IndexedDB and localStorage
      recordGuestImport(testCourseId);
      assert(getGuestImportHistory().length === 1, 'Guest history records 1 imported playlist');

      await db.courses.put({
        id: testCourseId,
        title: 'Modern Full-Stack Engineering',
        thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        channelName: 'Tech Academy',
        type: 'youtube',
        totalLessons: 3,
        createdAt: Date.now()
      });

      await db.lessons.bulkPut([
        { id: 'vid_01', courseId: testCourseId, title: 'Lesson 1: Intro', duration: '12:30', index: 1, type: 'youtube' },
        { id: 'vid_02', courseId: testCourseId, title: 'Lesson 2: Setup', duration: '15:45', index: 2, type: 'youtube' },
        { id: 'vid_03', courseId: testCourseId, title: 'Lesson 3: Build', duration: '20:10', index: 3, type: 'youtube' }
      ]);

      await db.progress.bulkPut([
        { id: `${testCourseId}_vid_01`, courseId: testCourseId, lessonId: 'vid_01', completed: true, watchTime: 750, lastWatched: Date.now() },
        { id: `${testCourseId}_vid_02`, courseId: testCourseId, lessonId: 'vid_02', completed: false, watchTime: 320, lastWatched: Date.now() }
      ]);

      await db.notes.add({
        courseId: testCourseId,
        lessonId: 'vid_01',
        timestamp: 120,
        content: 'Key architectural insight on local-first design',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      // 2. Perform Migration
      const migrationResult = await migrateGuestPlaylistToAccount(testUser);
      assert(migrationResult.success === true, 'migrateGuestPlaylistToAccount executed successfully');
      assert(migrationResult.migratedCount === 1, 'Exactly 1 course was migrated');

      // 3. Verify Cloud Stores Populated
      const cloudCourseKey = `${testUser.id}:${testCourseId}`;
      assert(cloudStore.courses.has(cloudCourseKey), 'Course successfully migrated into Supabase user_courses');
      assert(cloudStore.progress.size >= 2, 'Watch progress records uploaded to Supabase user_progress');
      assert(cloudStore.notes.length === 1, 'Timestamped note uploaded to Supabase user_notes');

      // 4. Verify Guest Data Was Cleared Only After Success
      const guestHistoryAfter = getGuestImportHistory();
      assert(guestHistoryAfter.length === 0, 'Guest storage cleared after confirmed migration (0 items)');

      // 5. Verify Local Dexie Data Was Not Discarded During Signup
      const localCoursesAfter = await db.courses.toArray();
      assert(localCoursesAfter.length === 1 && localCoursesAfter[0].id === testCourseId, 'Local playlist preserved in Dexie for immediate seamless playback');
      const localLessonsAfter = await db.lessons.where('courseId').equals(testCourseId).count();
      assert(localLessonsAfter === 3, 'All 3 lessons preserved locally');
      const localProgressAfter = await db.progress.where('courseId').equals(testCourseId).toArray();
      assert(localProgressAfter.length === 2, 'Local watch progress preserved');

      // --------------------------------------------------------------------------
      // TEST 3: Idempotence & Safe Retries (No Duplicate Records)
      // --------------------------------------------------------------------------
      logs.push('\n--- Test 3: Idempotence & Retry Protection (Edge Case 3) ---');
      const retryResult = await migrateGuestPlaylistToAccount(testUser);
      assert(retryResult.success === true, 'Migration retry executes smoothly');
      assert(retryResult.migratedCount === 1, 'Retry successfully processes course idempotently');

      // Check cloud store sizes: exactly 1 course, exactly 2 progress, exactly 1 note!
      assert(cloudStore.courses.size === 1, 'Cloud courses count strictly 1 (Zero duplicates on retry)');
      assert(cloudStore.notes.length === 1, 'Cloud notes count strictly 1 (Zero duplicate notes on retry)');

      // --------------------------------------------------------------------------
      // TEST 4: Network Failure Resilience (Edge Case 11)
      // --------------------------------------------------------------------------
      logs.push('\n--- Test 4: Network Failure Resilience (Edge Case 11) ---');
      
      // Simulate new guest course
      clearGuestImportHistory();
      const failCourseId = 'PLu71SKxNbfoFailNetwork99';
      recordGuestImport(failCourseId);
      assert(getGuestImportHistory().length === 1, 'Guest history set for network failure test');

      // Enable network failure simulation
      simulateNetworkFailure = true;
      const failedMigration = await migrateGuestPlaylistToAccount(testUser);
      assert(failedMigration.success === false, 'Migration returns success: false on network failure');
      assert(failedMigration.error.includes('Network connection lost'), 'Informative error returned');

      // CRITICAL: Guest storage MUST NOT be cleared on failure!
      const guestHistoryAfterFailure = getGuestImportHistory();
      assert(guestHistoryAfterFailure.length === 1, 'Guest data strictly preserved in localStorage when network fails');
      assert(guestHistoryAfterFailure[0] === failCourseId, 'Correct playlist ID preserved for future retry');

      // Reset network failure and retry migration
      simulateNetworkFailure = false;
      const retryAfterNetworkRestore = await migrateGuestPlaylistToAccount(testUser);
      assert(retryAfterNetworkRestore.success === true, 'Migration succeeds after network is restored');
      assert(getGuestImportHistory().length === 0, 'Guest storage cleared only after network restoration and success');

      // Clean up test database
      await db.resetDatabase();
      clearGuestImportHistory();
      supabase.from = originalFrom;

      return { passed, failed, logs };
    });

    result.logs.forEach(l => console.log(l));

    console.log('\n======================================================');
    console.log(`TOTAL MIGRATION TESTS: ${result.passed + result.failed}`);
    console.log(`PASSED: ${result.passed}`);
    console.log(`FAILED: ${result.failed}`);
    console.log('======================================================\n');

    if (result.failed > 0) process.exit(1);
    else process.exit(0);

  } finally {
    await browser.close();
  }
}

runGuestMigrationBrowserTest().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
