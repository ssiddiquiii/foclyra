import { chromium } from 'playwright';

const BASE_URL = process.env.FOCLYRA_TEST_BASE_URL || 'http://127.0.0.1:4173';
import path from 'path';
import fs from 'fs';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

async function runSentinelTest() {
  console.log('--- Step 3: Invalid Backup Sentinel Preservation Test ---');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const sentinelSummary = await page.evaluate(async () => {
      const indexedDB = window.indexedDB;
      return new Promise((resolve, reject) => {
        const req = indexedDB.open('FoclyraDB');
        req.onsuccess = async (e) => {
          const db = e.target.result;
          
          const stores = ['courses', 'lessons', 'progress', 'notes', 'practiceProgress'];
          const tx1 = db.transaction(stores, 'readwrite');
          
          tx1.objectStore('courses').clear();
          tx1.objectStore('lessons').clear();
          tx1.objectStore('progress').clear();
          tx1.objectStore('notes').clear();
          tx1.objectStore('practiceProgress').clear();

          tx1.objectStore('courses').add({
            id: 'sentinel_course_99',
            title: 'Sentinel Course Alpha',
            description: 'Sentinel Description',
            type: 'youtube'
          });

          tx1.objectStore('lessons').add({
            id: 'sentinel_lesson_99',
            courseId: 'sentinel_course_99',
            title: 'Sentinel Lesson Alpha',
            index: 1,
            type: 'youtube'
          });

          tx1.objectStore('progress').add({
            id: 'sentinel_progress_99',
            courseId: 'sentinel_course_99',
            lessonId: 'sentinel_lesson_99',
            watchTime: 1234,
            lastWatched: 1700000000000
          });

          tx1.objectStore('notes').add({
            id: 999999,
            courseId: 'sentinel_course_99',
            lessonId: 'sentinel_lesson_99',
            timestamp: 45,
            content: 'Sentinel Note Unique Value 999',
            createdAt: 1700000000000,
            updatedAt: 1700000000000
          });

          tx1.objectStore('practiceProgress').add({
            id: 'sentinel_practice_99',
            courseId: 'sentinel_course_99',
            lessonId: 'sentinel_lesson_99',
            completed: true,
            completedAt: 1700000000000
          });

          tx1.oncomplete = async () => {
            const tx2 = db.transaction(stores, 'readonly');
            const cCourse = await new Promise(r => { const req = tx2.objectStore('courses').count(); req.onsuccess = () => r(req.result); });
            const cLesson = await new Promise(r => { const req = tx2.objectStore('lessons').count(); req.onsuccess = () => r(req.result); });
            const cProg = await new Promise(r => { const req = tx2.objectStore('progress').count(); req.onsuccess = () => r(req.result); });
            const cNote = await new Promise(r => { const req = tx2.objectStore('notes').count(); req.onsuccess = () => r(req.result); });
            const cPrac = await new Promise(r => { const req = tx2.objectStore('practiceProgress').count(); req.onsuccess = () => r(req.result); });

            const sCourse = await new Promise(r => { const req = tx2.objectStore('courses').get('sentinel_course_99'); req.onsuccess = () => r(req.result); });
            const sNote = await new Promise(r => { const req = tx2.objectStore('notes').get(999999); req.onsuccess = () => r(req.result); });

            resolve({
              counts: { courses: cCourse, lessons: cLesson, progress: cProg, notes: cNote, practiceProgress: cPrac },
              sentinelCourseTitle: sCourse?.title,
              sentinelNoteContent: sNote?.content
            });
          };
        };
      });
    });

    console.log('Baseline Sentinel State:', sentinelSummary);
    assert(sentinelSummary.counts.courses === 1, 'Courses table has 1 sentinel record');
    assert(sentinelSummary.sentinelCourseTitle === 'Sentinel Course Alpha', 'Sentinel course title is "Sentinel Course Alpha"');
    assert(sentinelSummary.sentinelNoteContent === 'Sentinel Note Unique Value 999', 'Sentinel note content is preserved');

    const getCurrentDBState = async () => {
      return await page.evaluate(async () => {
        const indexedDB = window.indexedDB;
        return new Promise((resolve) => {
          const req = indexedDB.open('FoclyraDB');
          req.onsuccess = (e) => {
            const db = e.target.result;
            const stores = ['courses', 'lessons', 'progress', 'notes', 'practiceProgress'];
            const tx = db.transaction(stores, 'readonly');
            
            let res = { counts: {} };
            let completed = 0;
            stores.forEach(s => {
              const countReq = tx.objectStore(s).count();
              countReq.onsuccess = () => {
                res.counts[s] = countReq.result;
                completed++;
                if (completed === stores.length) {
                  const reqCourse = tx.objectStore('courses').get('sentinel_course_99');
                  reqCourse.onsuccess = () => {
                    res.sentinelCourseTitle = reqCourse.result?.title;
                    const reqNote = tx.objectStore('notes').get(999999);
                    reqNote.onsuccess = () => {
                      res.sentinelNoteContent = reqNote.result?.content;
                      resolve(res);
                    };
                  };
                }
              };
            });
          };
        });
      });
    };

    const malformedJsonPath = path.resolve('scripts/verification/phase1/sentinel_malformed.json');
    fs.writeFileSync(malformedJsonPath, '{ malformed json: ', 'utf-8');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(malformedJsonPath);
    await page.waitForSelector('div[class*="text-red-400"]', { timeout: 5000 });

    const stateAfterMalformed = await getCurrentDBState();
    console.log('State after malformed JSON failure:', stateAfterMalformed);

    assert(stateAfterMalformed.counts.courses === 1, 'Courses count unchanged after malformed JSON');
    assert(stateAfterMalformed.counts.lessons === 1, 'Lessons count unchanged after malformed JSON');
    assert(stateAfterMalformed.counts.progress === 1, 'Progress count unchanged after malformed JSON');
    assert(stateAfterMalformed.counts.notes === 1, 'Notes count unchanged after malformed JSON');
    assert(stateAfterMalformed.counts.practiceProgress === 1, 'PracticeProgress count unchanged after malformed JSON');
    assert(stateAfterMalformed.sentinelCourseTitle === 'Sentinel Course Alpha', 'Sentinel course ID/title unchanged');
    assert(stateAfterMalformed.sentinelNoteContent === 'Sentinel Note Unique Value 999', 'Sentinel note content unchanged');

    if (fs.existsSync(malformedJsonPath)) fs.unlinkSync(malformedJsonPath);

    await page.waitForSelector('span:has-text("Import Backup JSON")', { timeout: 5000 });
    await page.waitForTimeout(300);

    const invalidSchemaPath = path.resolve('scripts/verification/phase1/sentinel_invalid_schema.json');
    fs.writeFileSync(invalidSchemaPath, JSON.stringify({ version: 1, courses: "invalid_courses_string" }), 'utf-8');

    await fileInput.setInputFiles(invalidSchemaPath);
    await page.waitForSelector('div[class*="text-red-400"]', { timeout: 5000 });

    const stateAfterSchemaErr = await getCurrentDBState();
    console.log('State after schema error failure:', stateAfterSchemaErr);

    assert(stateAfterSchemaErr.counts.courses === 1, 'Courses count unchanged after invalid schema');
    assert(stateAfterSchemaErr.counts.lessons === 1, 'Lessons count unchanged after invalid schema');
    assert(stateAfterSchemaErr.counts.progress === 1, 'Progress count unchanged after invalid schema');
    assert(stateAfterSchemaErr.counts.notes === 1, 'Notes count unchanged after invalid schema');
    assert(stateAfterSchemaErr.counts.practiceProgress === 1, 'PracticeProgress count unchanged after invalid schema');
    assert(stateAfterSchemaErr.sentinelCourseTitle === 'Sentinel Course Alpha', 'Sentinel course ID/title unchanged after schema failure');
    assert(stateAfterSchemaErr.sentinelNoteContent === 'Sentinel Note Unique Value 999', 'Sentinel note content unchanged after schema failure');

    if (fs.existsSync(invalidSchemaPath)) fs.unlinkSync(invalidSchemaPath);

  } catch (err) {
    console.error('Sentinel Test Error:', err);
    failed++;
  } finally {
    await browser.close();
  }

  console.log(`\nSentinel Test Results: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runSentinelTest();
