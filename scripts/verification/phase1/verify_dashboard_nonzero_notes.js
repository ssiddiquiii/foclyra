import { chromium } from 'playwright';

const BASE_URL = process.env.FOCLYRA_TEST_BASE_URL || 'http://127.0.0.1:4173';

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

async function runNonZeroNotesTest() {
  console.log('--- Step 2: Dashboard Non-Zero Notes Written Test ---');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const count1 = await page.evaluate(async () => {
      const indexedDB = window.indexedDB;
      return new Promise((resolve, reject) => {
        const req = indexedDB.open('FoclyraDB');
        req.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction('notes', 'readwrite');
          const store = tx.objectStore('notes');
          store.add({
            courseId: 'test_c1',
            lessonId: 'test_l1',
            timestamp: 45,
            content: 'First Test Note',
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
          tx.oncomplete = () => {
            const tx2 = db.transaction('notes', 'readonly');
            const store2 = tx2.objectStore('notes');
            const countReq = store2.count();
            countReq.onsuccess = () => resolve(countReq.result);
          };
          tx.onerror = (err) => reject(err);
        };
      });
    });

    console.log(`IndexedDB notes count after inserting note 1: ${count1}`);
    assert(count1 === 1, 'IndexedDB contains exactly 1 note');

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const text1 = await page.locator('span:has-text("Notes Written") + span').innerText();
    console.log(`Dashboard UI text after 1 note: "${text1}"`);
    assert(text1.trim() === '1', `Dashboard displays 1 (actual: "${text1}")`);

    const count2 = await page.evaluate(async () => {
      const indexedDB = window.indexedDB;
      return new Promise((resolve, reject) => {
        const req = indexedDB.open('FoclyraDB');
        req.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction('notes', 'readwrite');
          const store = tx.objectStore('notes');
          store.add({
            courseId: 'test_c1',
            lessonId: 'test_l2',
            timestamp: 90,
            content: 'Second Test Note',
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
          tx.oncomplete = () => {
            const tx2 = db.transaction('notes', 'readonly');
            const store2 = tx2.objectStore('notes');
            const countReq = store2.count();
            countReq.onsuccess = () => resolve(countReq.result);
          };
        };
      });
    });

    console.log(`IndexedDB notes count after inserting note 2: ${count2}`);
    assert(count2 === 2, 'IndexedDB contains exactly 2 notes');

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const text2 = await page.locator('span:has-text("Notes Written") + span').innerText();
    console.log(`Dashboard UI text after 2 notes: "${text2}"`);
    assert(text2.trim() === '2', `Dashboard displays 2 (actual: "${text2}")`);

    await page.evaluate(async () => {
      const indexedDB = window.indexedDB;
      return new Promise((resolve) => {
        const req = indexedDB.open('FoclyraDB');
        req.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction('notes', 'readwrite');
          tx.objectStore('notes').clear();
          tx.oncomplete = () => resolve();
        };
      });
    });

  } catch (err) {
    console.error('Non-zero notes test error:', err);
    failed++;
  } finally {
    await browser.close();
  }

  console.log(`\nNon-zero notes test results: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runNonZeroNotesTest();
