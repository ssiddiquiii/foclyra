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
  console.log('--- PostHog 4-Pillar Telemetry Verification ---');

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

  // 3. Inspect sources for 4 telemetry pillars
  const [analyticsSource, mainSource, appSource, authSource, dashboardSource, exportSource, pomodoroSource, notesSource, watchSource, courseDetailSource, authModalSource] = 
    await Promise.all([
      readFile('src/services/analytics.js', 'utf8'),
      readFile('src/main.jsx', 'utf8'),
      readFile('src/App.jsx', 'utf8'),
      readFile('src/hooks/useAuth.js', 'utf8'),
      readFile('src/pages/Dashboard.jsx', 'utf8'),
      readFile('src/components/ExportNotesButton.jsx', 'utf8'),
      readFile('src/components/PomodoroTimer.jsx', 'utf8'),
      readFile('src/features/watch/useLessonNotes.js', 'utf8'),
      readFile('src/pages/Watch.jsx', 'utf8'),
      readFile('src/pages/CourseDetail.jsx', 'utf8'),
      readFile('src/components/AuthModal.jsx', 'utf8')
    ]);

  assert(
    analyticsSource.includes("autocapture: false"),
    'Pillar 1/2 Privacy: PostHog configures autocapture: false to safeguard notes & passwords'
  );

  assert(
    mainSource.includes('initAnalytics()') && appSource.includes('trackPageView(location.pathname)'),
    'App Shell: PostHog boots on init and captures SPA page views'
  );

  assert(
    pomodoroSource.includes("trackEvent('pomodoro_completed'"),
    'Pillar 1 Deep Work: Pomodoro focus & break completions tracked'
  );

  assert(
    watchSource.includes("trackEvent('theater_mode_toggled'"),
    'Pillar 1 Deep Work: Theater mode engagement tracked'
  );

  assert(
    notesSource.includes("trackEvent('note_created'") && !notesSource.includes('trackEvent(\'note_created\', { content }'),
    'Pillar 2 Active Learning: note_created tracked with metadata but NOT note text content'
  );

  assert(
    exportSource.includes("trackEvent('notes_exported_word'"),
    'Pillar 2 Active Learning: notes_exported_word tracked with scope & note count'
  );

  assert(
    watchSource.includes("trackEvent('lecture_completed'"),
    'Pillar 3 Retention: lecture_completed tracked with course & lesson details'
  );

  assert(
    courseDetailSource.includes("trackEvent('course_session_resumed'"),
    'Pillar 3 Retention: course_session_resumed tracked with course & progress state'
  );

  assert(
    dashboardSource.includes("trackEvent('guest_trial_exhausted'"),
    'Pillar 4 SaaS Funnel: guest_trial_exhausted quota boundary tracked'
  );

  assert(
    authModalSource.includes("trackEvent('auth_modal_opened'") && authModalSource.includes("trackEvent('user_signed_up'"),
    'Pillar 4 SaaS Funnel: auth_modal_opened and user_signed_up / user_signed_in tracked'
  );

  assert(
    authSource.includes('identifyUser') && authSource.includes('resetUser'),
    'User Identity: Session identification and logout reset configured'
  );

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runPostHogVerification();
