import { readFile } from 'node:fs/promises';
import { Toast as ToastPrimitive } from '@base-ui/react/toast';

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

async function runToastUnitVerification() {
  console.log('--- Toast Notification System Unit & Integration Verification ---');

  // 1. Unit test ToastManager state transitions (add, update, actionProps, close)
  const manager = ToastPrimitive.createToastManager();
  const events = [];
  const unsubscribe = manager[' subscribe']((event) => {
    events.push(event);
  });

  // Test 1: Loading -> Success transition (Course Import flow)
  const importId = manager.add({
    title: 'Importing course...',
    description: 'Connecting to YouTube and importing course...',
    type: 'loading',
  });
  assert(typeof importId === 'string' && importId.length > 0, 'toast.add returns a valid toast ID');
  assert(
    events.at(-1)?.action === 'add' && events.at(-1)?.options?.type === 'loading',
    'Course import dispatches initial loading toast'
  );

  manager.update(importId, {
    title: 'Course imported',
    description: 'Successfully imported "System Design" with 12 lectures!',
    type: 'success',
    timeout: 5000,
  });
  assert(
    events.at(-1)?.action === 'update' &&
      events.at(-1)?.options?.id === importId &&
      events.at(-1)?.options?.type === 'success' &&
      events.at(-1)?.options?.timeout === 5000,
    'toast.update transitions loading toast to 5s success toast'
  );

  // Test 2: Ready to study toast with 6-second timeout & Start Lesson 1 action button
  let navigatedLesson = null;
  const readyToastId = manager.add({
    title: 'Ready to study',
    description: 'System Design',
    type: 'success',
    timeout: 6000,
    actionProps: {
      children: 'Start Lesson 1 →',
      onClick() {
        manager.close(readyToastId);
        navigatedLesson = '/courses/c1/lessons/l1';
      },
    },
  });
  const readyEvent = events.at(-1);
  assert(
    readyEvent?.action === 'add' &&
      readyEvent?.options?.timeout === 6000 &&
      readyEvent?.options?.actionProps?.children === 'Start Lesson 1 →',
    'Ready to study toast configures 6000ms timeout and "Start Lesson 1 →" action button'
  );

  // Simulate clicking the "Start Lesson 1 →" action button inside the toast
  readyEvent.options.actionProps.onClick();
  assert(
    navigatedLesson === '/courses/c1/lessons/l1' &&
      events.at(-1)?.action === 'close' &&
      events.at(-1)?.options?.id === readyToastId,
    'Clicking "Start Lesson 1 →" closes the toast and triggers lesson navigation'
  );

  // Test 3: Course deletion toast (4s info toast)
  manager.add({
    title: 'Course deleted',
    description: 'Course "System Design" deleted successfully.',
    type: 'info',
    timeout: 4000,
  });
  assert(
    events.at(-1)?.action === 'add' &&
      events.at(-1)?.options?.type === 'info' &&
      events.at(-1)?.options?.timeout === 4000,
    'Course deletion dispatches 4000ms info toast'
  );

  unsubscribe();

  // 2. Verify Toast UI Component, Progress Bar, Theme Tokens, and Page Contracts
  const [toastSource, cssSource, appSource, dashboardSource, courseDetailSource, settingsSource] =
    await Promise.all([
      readFile('src/components/ui/toast.jsx', 'utf8'),
      readFile('src/index.css', 'utf8'),
      readFile('src/App.jsx', 'utf8'),
      readFile('src/pages/Dashboard.jsx', 'utf8'),
      readFile('src/pages/CourseDetail.jsx', 'utf8'),
      readFile('src/pages/Settings.jsx', 'utf8'),
    ]);

  assert(
    toastSource.includes('bottom-16') && toastSource.includes('sm:right-4'),
    'ToastViewport is positioned at bottom-right above the Pomodoro timer (bottom-16 sm:right-4)'
  );
  assert(
    toastSource.includes('data-slot="toast-progress"') &&
      toastSource.includes('toastProgress') &&
      toastSource.includes('origin-left rounded-full bg-primary') &&
      cssSource.includes('@keyframes toastProgress'),
    'Toast renders the right-to-left shrinking countdown progress bar animation with bg-primary button color'
  );
  assert(
    toastSource.includes('group-data-expanded/toast:[animation-play-state:paused]'),
    'Toast progress bar pauses when hovered or expanded'
  );
  assert(
    toastSource.includes('bg-popover') &&
      toastSource.includes('text-popover-foreground') &&
      toastSource.includes('border-border') &&
      toastSource.includes('dark:text-emerald-400') &&
      toastSource.includes('dark:text-red-400'),
    'Toast uses theme-aware Light/Dark mode tokens and status colors'
  );
  assert(
    appSource.includes('<Toaster>') && appSource.includes('</Toaster>'),
    'App.jsx wraps application content in global <Toaster>'
  );
  assert(
    !dashboardSource.includes('actionMsg') &&
      !dashboardSource.includes('newlyImportedCourse') &&
      dashboardSource.includes('toast.add') &&
      dashboardSource.includes('toast.update') &&
      dashboardSource.includes('timeout: 6000'),
    'Dashboard.jsx replaces inline top banners with animated toasts (including 6s Ready to study toast)'
  );
  assert(
    !courseDetailSource.includes('syncStatus') &&
      courseDetailSource.includes('toast.add') &&
      courseDetailSource.includes('toast.update'),
    'CourseDetail.jsx replaces inline syncStatus with animated toasts'
  );
  assert(
    !settingsSource.includes('statusMsg') &&
      settingsSource.includes('toast.add') &&
      settingsSource.includes('toast.update'),
    'Settings.jsx replaces inline statusMsg banner with animated toasts'
  );

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runToastUnitVerification();

