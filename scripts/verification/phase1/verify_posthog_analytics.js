import { readFile } from 'node:fs/promises';
import { initAnalytics, trackEvent, identifyUser, resetUser, trackPageView } from '../../../src/services/analytics.js';

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

async function runPostHogVerification() {
  console.log('--- PostHog Analytics Service & Wiring Verification ---');

  // 1. Safe graceful degradation when VITE_POSTHOG_KEY is absent
  try {
    initAnalytics();
    assert(true, 'initAnalytics degrades gracefully without throwing when key is unconfigured');
  } catch (err) {
    assert(false, `initAnalytics threw unexpectedly: ${err.message}`);
  }

  // 2. Safe API no-ops
  try {
    trackEvent('test_event', { foo: 'bar' });
    identifyUser('test-user-id', { email: 'test@example.com' });
    resetUser();
    trackPageView('/test-path');
    assert(true, 'trackEvent, identifyUser, resetUser, and trackPageView execute safely without active key');
  } catch (err) {
    assert(false, `Analytics methods threw unexpectedly: ${err.message}`);
  }

  // 3. Inspect analytics.js source for privacy and best practices
  const [analyticsSource, mainSource, appSource, authSource, dashboardSource, exportSource, pomodoroSource] = 
    await Promise.all([
      readFile('src/services/analytics.js', 'utf8'),
      readFile('src/main.jsx', 'utf8'),
      readFile('src/App.jsx', 'utf8'),
      readFile('src/hooks/useAuth.js', 'utf8'),
      readFile('src/pages/Dashboard.jsx', 'utf8'),
      readFile('src/components/ExportNotesButton.jsx', 'utf8'),
      readFile('src/components/PomodoroTimer.jsx', 'utf8')
    ]);

  assert(
    analyticsSource.includes("autocapture: false"),
    'PostHog configures autocapture: false to safeguard private notes and user inputs'
  );

  assert(
    analyticsSource.includes("person_profiles: 'identified_only'"),
    'PostHog uses identified_only person profiles to prevent anonymous tracking bloat'
  );

  assert(
    mainSource.includes('initAnalytics()'),
    'src/main.jsx boots analytics on application initialization'
  );

  assert(
    appSource.includes('trackPageView(location.pathname)'),
    'src/App.jsx triggers trackPageView on client SPA route changes'
  );

  assert(
    authSource.includes('identifyUser') && authSource.includes('resetUser'),
    'src/hooks/useAuth.js links identity on login and resets on logout/deletion'
  );

  assert(
    dashboardSource.includes("trackEvent('course_imported'") && dashboardSource.includes("trackEvent('course_deleted'"),
    'src/pages/Dashboard.jsx captures course_imported and course_deleted events'
  );

  assert(
    exportSource.includes("trackEvent('notes_exported_word'"),
    'src/components/ExportNotesButton.jsx captures notes_exported_word events'
  );

  assert(
    pomodoroSource.includes("trackEvent('pomodoro_completed'"),
    'src/components/PomodoroTimer.jsx captures pomodoro_completed events'
  );

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runPostHogVerification();
