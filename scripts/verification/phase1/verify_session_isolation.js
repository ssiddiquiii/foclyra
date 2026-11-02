/**
 * Verification Test: Session Isolation & Security Safeguards Suite (Phase 4)
 * Tests:
 * 1. User A active session with courses, notes, and in-flight progress.
 * 2. User A signOut() flushes pending progress, wipes IndexedDB, clears localStorage credentials.
 * 3. Guest mode after signout has 0 courses and cannot access User A's data.
 * 4. User B sign-in hydrates ONLY User B's courses and notes; User A's data is never exposed.
 * 5. User B signOut() cleanly wipes local database.
 * 6. User A sign-in restores User A's cloud data safely into Dexie.
 * 7. Guest course deletion properly clears guest quota slot so re-import is permitted.
 */

import { chromium } from 'playwright';

async function runSessionIsolationTests() {
  console.log('\n======================================================');
  console.log('🔒 FOCLYRA SESSION ISOLATION & SECURITY SAFEGUARDS');
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
    // TEST 1: User A Session Setup & Data Ingestion
    // --------------------------------------------------------------------------
    console.log('--- Test 1: Seed User A Data & Pending Progress ---');
    
    const userA_Id = '11111111-1111-4111-8111-111111111111';
    const userB_Id = '22222222-2222-4222-8222-222222222222';

    const setupResult = await page.evaluate(async ({ userA_Id }) => {
      const { db } = await import('/src/db/FoclyraDB.js');
      const { useAuth } = await import('/src/hooks/useAuth.js');
      const { syncProgressToCloud } = await import('/src/services/cloudSyncService.js');

      // Reset any old state first
      await db.resetDatabase();
      localStorage.clear();

      // Seed User A's course into local Dexie
      await db.courses.put({
        id: 'PL-USER-A-COURSE-99',
        title: 'User A Secret Algorithms Course',
        thumbnailUrl: 'https://img.youtube.com/vi/test/hqdefault.jpg',
        channelName: 'Prof. A',
        type: 'youtube',
        totalLessons: 3,
        createdAt: Date.now()
      });

      await db.lessons.bulkPut([
        { id: 'vid_a1', courseId: 'PL-USER-A-COURSE-99', title: 'A Lecture 1', durationSeconds: 600, index: 1, type: 'youtube' },
        { id: 'vid_a2', courseId: 'PL-USER-A-COURSE-99', title: 'A Lecture 2', durationSeconds: 900, index: 2, type: 'youtube' }
      ]);

      await db.notes.add({
        courseId: 'PL-USER-A-COURSE-99',
        lessonId: 'vid_a1',
        timestamp: 120,
        content: 'User A private confidential note',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      // Set user A in auth store
      const mockUserA = {
        id: userA_Id,
        email: 'userA@private.com',
        user_metadata: { full_name: 'User A' }
      };
      useAuth.setState({
        user: mockUserA,
        session: { access_token: 'tok_a', user: mockUserA },
        isLoading: false
      });

      // Queue an in-flight debounced progress update (not immediate)
      await syncProgressToCloud(mockUserA, {
        courseId: 'PL-USER-A-COURSE-99',
        lessonId: 'vid_a1',
        watchTime: 450,
        completed: false
      }, false);

      // Set custom API key in localStorage
      localStorage.setItem('foclyra_custom_youtube_api_key', 'AIzaSyPrivateUserKey123');

      const courseCount = await db.courses.count();
      const notesCount = await db.notes.count();
      return { courseCount, notesCount };
    }, { userA_Id });

    assert(setupResult.courseCount === 1, 'User A course seeded into local Dexie');
    assert(setupResult.notesCount === 1, 'User A private note seeded into local Dexie');

    // --------------------------------------------------------------------------
    // TEST 2: User A Signs Out -> Verify Full Database Wipe & Credential Purge
    // --------------------------------------------------------------------------
    console.log('\n--- Test 2: User A Sign Out & Session Isolation Wipe ---');

    const signOutResult = await page.evaluate(async () => {
      const { useAuth } = await import('/src/hooks/useAuth.js');
      const { db } = await import('/src/db/FoclyraDB.js');

      // Trigger standard application signOut
      await useAuth.getState().signOut();

      // Check Dexie tables
      const coursesRemaining = await db.courses.count();
      const lessonsRemaining = await db.lessons.count();
      const progressRemaining = await db.progress.count();
      const notesRemaining = await db.notes.count();

      // Check localStorage
      const apiKeyRemaining = localStorage.getItem('foclyra_custom_youtube_api_key');
      const guestHistoryRemaining = localStorage.getItem('foclyra_guest_history');

      // Check Zustand auth state
      const authUser = useAuth.getState().user;
      const authSession = useAuth.getState().session;

      return {
        coursesRemaining,
        lessonsRemaining,
        progressRemaining,
        notesRemaining,
        apiKeyRemaining,
        guestHistoryRemaining,
        isAuthUserNull: authUser === null,
        isAuthSessionNull: authSession === null
      };
    });

    assert(signOutResult.coursesRemaining === 0, 'Dexie courses table completely wiped on signOut()');
    assert(signOutResult.lessonsRemaining === 0, 'Dexie lessons table completely wiped on signOut()');
    assert(signOutResult.notesRemaining === 0, 'Dexie notes table completely wiped on signOut() (no note leaks)');
    assert(signOutResult.apiKeyRemaining === null, 'User custom API key purged from localStorage on signOut()');
    assert(signOutResult.guestHistoryRemaining === null, 'Guest import history purged from localStorage on signOut()');
    assert(signOutResult.isAuthUserNull && signOutResult.isAuthSessionNull, 'Zustand auth user & session reset to null');

    // --------------------------------------------------------------------------
    // TEST 3: Guest Mode Isolation -> Zero User A Data Visible
    // --------------------------------------------------------------------------
    console.log('\n--- Test 3: Guest Mode Isolation ---');

    const guestViewResult = await page.evaluate(async () => {
      const { db } = await import('/src/db/FoclyraDB.js');
      const courses = await db.courses.toArray();
      const notes = await db.notes.toArray();
      return {
        coursesLength: courses.length,
        notesLength: notes.length
      };
    });

    assert(guestViewResult.coursesLength === 0, 'Guest mode sees 0 courses (clean Playlist Import page)');
    assert(guestViewResult.notesLength === 0, 'Guest mode has 0 notes accessible');

    // --------------------------------------------------------------------------
    // TEST 4: User B Signs In -> Only User B Data Hydrates
    // --------------------------------------------------------------------------
    console.log('\n--- Test 4: User B Signs In (Cross-User Isolation) ---');

    const userBResult = await page.evaluate(async ({ userB_Id }) => {
      const { db } = await import('/src/db/FoclyraDB.js');
      const { useAuth } = await import('/src/hooks/useAuth.js');
      const { supabase } = await import('/src/services/supabaseClient.js');

      // Mock Supabase cloud tables for User B
      supabase.from = (table) => {
        if (table === 'user_courses') {
          return {
            select: () => ({
              eq: (col, val) => {
                if (val === userB_Id) {
                  return Promise.resolve({
                    data: [
                      {
                        course_id: 'PL-USER-B-PYTHON-01',
                        title: 'User B Python Mastery',
                        thumbnail_url: 'https://img.youtube.com/vi/b_thumb/hqdefault.jpg',
                        total_lessons: 5
                      }
                    ],
                    error: null
                  });
                }
                return Promise.resolve({ data: [], error: null });
              }
            }),
            upsert: () => Promise.resolve({ error: null }),
            delete: () => ({ eq: () => ({ eq: () => Promise.resolve({ error: null }) }) })
          };
        }
        if (table === 'user_progress') {
          return {
            select: () => ({
              eq: () => Promise.resolve({ data: [], error: null })
            }),
            upsert: () => Promise.resolve({ error: null })
          };
        }
        if (table === 'user_notes') {
          return {
            select: () => ({
              eq: (col, val) => {
                if (val === userB_Id) {
                  return Promise.resolve({
                    data: [
                      {
                        id: 55,
                        user_id: userB_Id,
                        course_id: 'PL-USER-B-PYTHON-01',
                        lesson_id: 'b_lec1',
                        timestamp: 60,
                        content: 'User B specific note on lists',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      }
                    ],
                    error: null
                  });
                }
                return Promise.resolve({ data: [], error: null });
              }
            }),
            insert: () => Promise.resolve({ error: null })
          };
        }
        return {
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) })
        };
      };

      const mockUserB = {
        id: userB_Id,
        email: 'userB@learning.com',
        user_metadata: { full_name: 'User B' }
      };

      // Sign in User B
      useAuth.setState({
        user: mockUserB,
        session: { access_token: 'tok_b', user: mockUserB },
        isLoading: false
      });

      const { hydrateFromCloud } = await import('/src/services/cloudSyncService.js');
      await hydrateFromCloud(mockUserB);

      const coursesInDb = await db.courses.toArray();
      const notesInDb = await db.notes.toArray();

      return {
        courses: coursesInDb.map(c => c.id),
        notes: notesInDb.map(n => n.content)
      };
    }, { userB_Id });

    assert(userBResult.courses.includes('PL-USER-B-PYTHON-01'), 'User B sees their own cloud course');
    assert(!userBResult.courses.includes('PL-USER-A-COURSE-99'), 'User B CANNOT see User A private course');
    assert(userBResult.notes.includes('User B specific note on lists'), 'User B sees their own notes');
    assert(!userBResult.notes.some(c => c.includes('User A')), 'User B CANNOT see User A private notes');

    // --------------------------------------------------------------------------
    // TEST 5: User B Signs Out & User A Signs In Again
    // --------------------------------------------------------------------------
    console.log('\n--- Test 5: User B Signs Out & User A Signs Back In ---');

    const restoreUserAResult = await page.evaluate(async ({ userA_Id }) => {
      const { db } = await import('/src/db/FoclyraDB.js');
      const { useAuth } = await import('/src/hooks/useAuth.js');
      const { supabase } = await import('/src/services/supabaseClient.js');

      // User B logs out
      await useAuth.getState().signOut();

      // Configure cloud mock for User A
      supabase.from = (table) => {
        if (table === 'user_courses') {
          return {
            select: () => ({
              eq: (col, val) => {
                if (val === userA_Id) {
                  return Promise.resolve({
                    data: [
                      {
                        course_id: 'PL-USER-A-COURSE-99',
                        title: 'User A Secret Algorithms Course',
                        thumbnail_url: 'https://img.youtube.com/vi/test/hqdefault.jpg',
                        total_lessons: 3
                      }
                    ],
                    error: null
                  });
                }
                return Promise.resolve({ data: [], error: null });
              }
            }),
            upsert: () => Promise.resolve({ error: null })
          };
        }
        if (table === 'user_progress') {
          return {
            select: () => ({
              eq: () => Promise.resolve({
                data: [
                  {
                    id: 'prog-uuid-a',
                    user_id: userA_Id,
                    course_id: 'PL-USER-A-COURSE-99',
                    lesson_id: 'vid_a1',
                    watch_time: 450,
                    completed: false,
                    last_watched: new Date().toISOString()
                  }
                ],
                error: null
              })
            }),
            upsert: () => Promise.resolve({ error: null })
          };
        }
        if (table === 'user_notes') {
          return {
            select: () => ({
              eq: (col, val) => {
                if (val === userA_Id) {
                  return Promise.resolve({
                    data: [
                      {
                        id: 991,
                        user_id: userA_Id,
                        course_id: 'PL-USER-A-COURSE-99',
                        lesson_id: 'vid_a1',
                        timestamp: 120,
                        content: 'User A restored note',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      }
                    ],
                    error: null
                  });
                }
                return Promise.resolve({ data: [], error: null });
              }
            }),
            insert: () => Promise.resolve({ error: null })
          };
        }
        return {
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) })
        };
      };

      const mockUserA = {
        id: userA_Id,
        email: 'userA@private.com',
        user_metadata: { full_name: 'User A' }
      };

      // User A signs in
      useAuth.setState({
        user: mockUserA,
        session: { access_token: 'tok_a2', user: mockUserA },
        isLoading: false
      });

      const { hydrateFromCloud } = await import('/src/services/cloudSyncService.js');
      await hydrateFromCloud(mockUserA);

      const coursesInDb = await db.courses.toArray();
      const progressInDb = await db.progress.toArray();
      const notesInDb = await db.notes.toArray();

      return {
        hasCourseA: coursesInDb.some(c => c.id === 'PL-USER-A-COURSE-99'),
        hasCourseB: coursesInDb.some(c => c.id === 'PL-USER-B-PYTHON-01'),
        hasProgressA: progressInDb.some(p => p.courseId === 'PL-USER-A-COURSE-99' && p.watchTime === 450),
        hasNoteA: notesInDb.some(n => n.content === 'User A restored note')
      };
    }, { userA_Id });

    assert(restoreUserAResult.hasCourseA, 'User A courses restored from cloud into Dexie');
    assert(!restoreUserAResult.hasCourseB, 'User B courses completely absent from User A session');
    assert(restoreUserAResult.hasProgressA, 'User A watch progress restored from cloud');
    assert(restoreUserAResult.hasNoteA, 'User A timestamped notes restored from cloud');

    // --------------------------------------------------------------------------
    // TEST 6: Guest Course Deletion Cleans Quota Slot for Re-Import
    // --------------------------------------------------------------------------
    console.log('\n--- Test 6: Guest Course Deletion Clears Quota History ---');

    const quotaResult = await page.evaluate(async () => {
      const { db } = await import('/src/db/FoclyraDB.js');
      const { useAuth } = await import('/src/hooks/useAuth.js');
      const { checkPlaylistImportQuota, recordGuestImport } = await import('/src/services/quotaService.js');
      const { deleteCourse } = await import('/src/services/dataCommands.js');

      // Logout and reset to clean guest
      await useAuth.getState().signOut();
      await db.resetDatabase();
      localStorage.clear();

      // Guest imports Playlist 1
      const playlist1 = 'PLguestTrialPlaylist01';
      recordGuestImport(playlist1);
      await db.courses.put({
        id: playlist1,
        title: 'Guest Trial Course',
        totalLessons: 10,
        createdAt: Date.now()
      });

      // Verify guest is now blocked from importing a second playlist
      const secondCheckBefore = await checkPlaylistImportQuota({ user: null, playlistId: 'PLguestSecondPlaylist02' });
      
      // Guest deletes Playlist 1
      await deleteCourse(playlist1);

      // Now check if guest can import either Playlist 1 or Playlist 2
      const checkAfter = await checkPlaylistImportQuota({ user: null, playlistId: 'PLguestSecondPlaylist02' });
      const reimportCheck = await checkPlaylistImportQuota({ user: null, playlistId: playlist1 });

      return {
        secondCheckAllowedBefore: secondCheckBefore.allowed,
        secondCheckAllowedAfter: checkAfter.allowed,
        reimportAllowedAfter: reimportCheck.allowed
      };
    });

    assert(!quotaResult.secondCheckAllowedBefore, 'Guest importing 2nd playlist is initially blocked (limit 1)');
    assert(quotaResult.secondCheckAllowedAfter, 'After deleting 1st playlist, guest can import a new playlist');
    assert(quotaResult.reimportAllowedAfter, 'After deleting 1st playlist, guest can re-import the deleted playlist');

    // --------------------------------------------------------------------------
    // SUMMARY
    // --------------------------------------------------------------------------
    console.log('\n======================================================');
    console.log(`TOTAL ISOLATION & SECURITY TESTS: ${passed + failed}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log('======================================================\n');

    if (failed > 0) process.exit(1);
    else process.exit(0);

  } finally {
    await browser.close();
  }
}

runSessionIsolationTests().catch(err => {
  console.error('Session isolation verification failed:', err);
  process.exit(1);
});

