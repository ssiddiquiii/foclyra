import { parseDurationToSeconds, MIN_SINGLE_VIDEO_DURATION_SECONDS } from '../../../src/services/youtubeApi.js';
import { useUIStore } from '../../../src/hooks/useUIStore.js';

console.log('\n======================================================');
console.log('🛡️  FOCLYRA QUOTA MODAL & 20-MIN DURATION VERIFICATION');
console.log('======================================================\n');

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

// --- SUITE 1: Duration Parsing & Minimum 20 Minutes Rule ---
console.log('--- SUITE 1: Duration Parsing & Minimum 20 Minutes Rule ---');

const testCases = [
  { duration: 'PT5M30S', expectedSecs: 330, shouldAllow: false, label: '5m 30s ISO duration' },
  { duration: 'PT19M59S', expectedSecs: 1199, shouldAllow: false, label: '19m 59s ISO duration (boundary)' },
  { duration: 'PT20M00S', expectedSecs: 1200, shouldAllow: true, label: '20m 00s ISO duration (exact threshold)' },
  { duration: 'PT48M10S', expectedSecs: 2890, shouldAllow: true, label: '48m 10s ISO duration (long lecture)' },
  { duration: 'PT1H15M30S', expectedSecs: 4530, shouldAllow: true, label: '1h 15m 30s ISO duration (crash course)' },
  { duration: '0:45', expectedSecs: 45, shouldAllow: false, label: '45 seconds digital string (Short clip)' },
  { duration: '14:22', expectedSecs: 862, shouldAllow: false, label: '14m 22s digital string (< 20 mins)' },
  { duration: '19:59', expectedSecs: 1199, shouldAllow: false, label: '19m 59s digital string (boundary)' },
  { duration: '20:00', expectedSecs: 1200, shouldAllow: true, label: '20m 00s digital string (exact threshold)' },
  { duration: '48:10', expectedSecs: 2890, shouldAllow: true, label: '48m 10s digital string' },
  { duration: '1:04:12', expectedSecs: 3852, shouldAllow: true, label: '1h 04m 12s digital string' }
];

for (const tc of testCases) {
  const secs = parseDurationToSeconds(tc.duration);
  assert(secs === tc.expectedSecs, `${tc.label} parsed to ${secs}s (expected ${tc.expectedSecs}s)`);
  const isAllowed = secs >= MIN_SINGLE_VIDEO_DURATION_SECONDS;
  assert(isAllowed === tc.shouldAllow, `${tc.label} allowed: ${isAllowed} (expected ${tc.shouldAllow})`);
}

// --- SUITE 2: Quota Modal State Management ---
console.log('\n--- SUITE 2: Quota Modal State Management ---');

// Initially closed
assert(useUIStore.getState().quotaModalOpen === false, 'Quota modal initially closed');

// Open quota modal
useUIStore.getState().openQuotaModal({ current: 5, max: 5 });
assert(useUIStore.getState().quotaModalOpen === true, 'Quota modal opens via openQuotaModal()');
assert(useUIStore.getState().quotaModalData.current === 5, 'Quota modal holds current count 5');
assert(useUIStore.getState().quotaModalData.max === 5, 'Quota modal holds max limit 5');

// AuthModal should NOT be open
assert(useUIStore.getState().authModalOpen === false, 'Auth modal remains CLOSED when quota modal opens');

// Close quota modal
useUIStore.getState().closeQuotaModal();
assert(useUIStore.getState().quotaModalOpen === false, 'Quota modal closes cleanly via closeQuotaModal()');

console.log('\n======================================================');
console.log(`TOTAL TESTS: ${passed + failed}`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log('======================================================\n');

if (failed > 0) process.exit(1);

