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

async function runE2ETests() {
  console.log('--- Phase 1 Playwright Browser & IndexedDB Integration Verification ---');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    console.log(`Opened ${BASE_URL}/`);

    await page.waitForTimeout(1500);

    const noteCountBefore = await page.evaluate(async () => {
      const indexedDB = window.indexedDB;
      return new Promise((resolve) => {
        const req = indexedDB.open('FoclyraDB');
        req.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction('notes', 'readonly');
          const store = tx.objectStore('notes');
          const countReq = store.count();
          countReq.onsuccess = () => resolve(countReq.result);
        };
      });
    });

    console.log(`Current IndexedDB notes count: ${noteCountBefore}`);

    const dashboardNotesText = await page.locator('span:has-text("Notes Written") + span').innerText();
    console.log(`Dashboard UI Notes Written text: "${dashboardNotesText}"`);
    assert(parseInt(dashboardNotesText, 10) === noteCountBefore, `Dashboard Notes Written (${dashboardNotesText}) matches IndexedDB count (${noteCountBefore})`);

    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle' });
    
    const invalidJsonPath = path.resolve('scripts/verification/phase1/invalid_test.json');
    fs.writeFileSync(invalidJsonPath, '{ invalid json payload: ', 'utf-8');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(invalidJsonPath);
    await page.waitForSelector('div[class*="text-red-400"]', { timeout: 5000 });

    const errorText = await page.locator('div[class*="text-red-400"]').first().innerText();
    assert(errorText.includes('Invalid JSON file format'), 'Settings import rejected invalid JSON syntax with clear toast');

    if (fs.existsSync(invalidJsonPath)) fs.unlinkSync(invalidJsonPath);

    await page.waitForSelector('span:has-text("Import Backup JSON")', { timeout: 5000 });
    await page.waitForTimeout(300);

    const invalidSchemaPath = path.resolve('scripts/verification/phase1/invalid_schema.json');
    fs.writeFileSync(invalidSchemaPath, JSON.stringify({ version: 1, courses: "not an array" }), 'utf-8');

    await fileInput.setInputFiles(invalidSchemaPath);
    await page.waitForTimeout(600);

    const schemaErrorText = await page.locator('div[class*="text-red-400"]').first().innerText();
    assert(schemaErrorText.includes('Schema validation failed'), 'Settings import rejected invalid schema structure');

    if (fs.existsSync(invalidSchemaPath)) fs.unlinkSync(invalidSchemaPath);

    await page.waitForSelector('span:has-text("Import Backup JSON")', { timeout: 5000 });
    await page.waitForTimeout(300);

    const validBackupPath = path.resolve('scripts/verification/phase1/valid_backup.json');
    const sampleBackup = {
      version: 1,
      exportedAt: Date.now(),
      courses: [{
        id: 'e2e_course_1',
        title: 'E2E Test Course',
        description: 'Test course for backup restoration',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        channelName: 'Test Channel',
        type: 'youtube',
        udemyUrl: ''
      }],
      lessons: [{
        id: 'e2e_lesson_1',
        courseId: 'e2e_course_1',
        title: 'E2E Lesson 1',
        description: 'Test lesson',
        thumbnailUrl: '',
        duration: '10:00',
        index: 1,
        type: 'youtube'
      }],
      progress: [{
        id: 'e2e_course_1_e2e_lesson_1',
        courseId: 'e2e_course_1',
        lessonId: 'e2e_lesson_1',
        currentTime: 650,
        watchTime: 650,
        completed: true,
        lastWatched: Date.now()
      }],
      notes: [{
        id: 1,
        courseId: 'e2e_course_1',
        lessonId: 'e2e_lesson_1',
        timestamp: 120,
        content: 'E2E Test Note',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }],
      practiceProgress: [{
        id: 'e2e_lesson_1_0',
        courseId: 'e2e_course_1',
        lessonId: 'e2e_lesson_1',
        practiceUrl: '',
        completed: true,
        completedAt: Date.now()
      }]
    };

    fs.writeFileSync(validBackupPath, JSON.stringify(sampleBackup), 'utf-8');

    await fileInput.setInputFiles(validBackupPath);
    await page.waitForSelector('div[class*="text-emerald-400"]', { timeout: 5000 });

    const successText = await page.locator('div[class*="text-emerald-400"]').first().innerText();
    assert(successText.includes('Backup restored successfully'), 'Valid backup imported cleanly with legacy empty practiceUrl');

    if (fs.existsSync(validBackupPath)) fs.unlinkSync(validBackupPath);

    const restoredCounts = await page.evaluate(async () => {
      const indexedDB = window.indexedDB;
      return new Promise((resolve) => {
        const req = indexedDB.open('FoclyraDB');
        req.onsuccess = (e) => {
          const db = e.target.result;
          const res = {};
          const stores = ['courses', 'lessons', 'progress', 'notes', 'practiceProgress'];
          let completed = 0;
          stores.forEach((storeName) => {
            const tx = db.transaction(storeName, 'readonly');
            const countReq = tx.objectStore(storeName).count();
            countReq.onsuccess = () => {
              res[storeName] = countReq.result;
              completed++;
              if (completed === stores.length) resolve(res);
            };
          });
        };
      });
    });

    console.log('Restored IndexedDB store record counts:', restoredCounts);
    assert(restoredCounts.courses === 1, 'Restored courses count is 1');
    assert(restoredCounts.lessons === 1, 'Restored lessons count is 1');
    assert(restoredCounts.progress === 1, 'Restored progress count is 1');
    assert(restoredCounts.notes === 1, 'Restored notes count is 1');
    assert(restoredCounts.practiceProgress === 1, 'Restored practiceProgress count is 1');

  } catch (err) {
    console.error('E2E Verification Error:', err);
    failed++;
  } finally {
    await browser.close();
  }

  console.log(`\nE2E Results: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runE2ETests();
