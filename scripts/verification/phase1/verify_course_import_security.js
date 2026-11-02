/**
 * Foclyra Comprehensive Security Verification Suite:
 * Course Import Strict Validation, Malicious Link Rejection,
 * Guest Quota Preservation, Signed-in Quota Protection & Serverless Proxy Hardening.
 */

import { validateYouTubeUrlOrId, extractPlaylistId, extractVideoId } from '../../../src/services/youtubeApi.js';
import handler from '../../../api/youtube.js';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

console.log('\n======================================================');
console.log('🛡️  FOCLYRA COURSE IMPORT SECURITY & VALIDATION SUITE');
console.log('======================================================\n');

// --------------------------------------------------------------------------
// SUITE 1: Genuine YouTube URLs & Direct IDs (MUST PASS)
// --------------------------------------------------------------------------
console.log('--- SUITE 1: Legitimate YouTube Formats ---');

const legitimateCases = [
  {
    input: 'https://www.youtube.com/playlist?list=PLu71SKxNbfoBuX3f4EOACle2y-tRC5Q37',
    expectedType: 'playlist',
    expectedId: 'PLu71SKxNbfoBuX3f4EOACle2y-tRC5Q37',
    desc: 'Standard playlist URL'
  },
  {
    input: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLu71SKxNbfoBuX3f4EOACle2y-tRC5Q37',
    expectedType: 'playlist',
    expectedId: 'PLu71SKxNbfoBuX3f4EOACle2y-tRC5Q37',
    desc: 'Watch URL with playlist parameter'
  },
  {
    input: 'https://youtu.be/dQw4w9WgXcQ',
    expectedType: 'video',
    expectedId: 'dQw4w9WgXcQ',
    desc: 'Shortened youtu.be URL'
  },
  {
    input: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    expectedType: 'video',
    expectedId: 'dQw4w9WgXcQ',
    desc: 'Standard watch single-video URL'
  },
  {
    input: 'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
    expectedType: 'video',
    expectedId: 'dQw4w9WgXcQ',
    desc: 'Mobile m.youtube.com URL'
  },
  {
    input: 'https://music.youtube.com/watch?v=dQw4w9WgXcQ',
    expectedType: 'video',
    expectedId: 'dQw4w9WgXcQ',
    desc: 'Music YouTube URL'
  },
  {
    input: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    expectedType: 'video',
    expectedId: 'dQw4w9WgXcQ',
    desc: 'YouTube Shorts URL'
  },
  {
    input: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    expectedType: 'video',
    expectedId: 'dQw4w9WgXcQ',
    desc: 'YouTube Embed URL'
  },
  {
    input: 'PLu71SKxNbfoBuX3f4EOACle2y-tRC5Q37',
    expectedType: 'playlist',
    expectedId: 'PLu71SKxNbfoBuX3f4EOACle2y-tRC5Q37',
    desc: 'Raw Direct Playlist ID'
  },
  {
    input: 'dQw4w9WgXcQ',
    expectedType: 'video',
    expectedId: 'dQw4w9WgXcQ',
    desc: 'Raw Direct 11-char Video ID'
  }
];

for (const testCase of legitimateCases) {
  const res = validateYouTubeUrlOrId(testCase.input);
  assert(res.isValid === true && res.type === testCase.expectedType && res.id === testCase.expectedId, `Valid format accepted: ${testCase.desc}`);
}

// --------------------------------------------------------------------------
// SUITE 2: Malicious Injections & Protocol Exploits (STRICTLY REJECT)
// --------------------------------------------------------------------------
console.log('\n--- SUITE 2: Malicious Injections & Exploits (Zero Tolerance) ---');

const maliciousVectors = [
  { input: '<script>alert("XSS")</script>', desc: 'Direct script tag XSS' },
  { input: '<img src=x onerror=alert(1)>', desc: 'Img onerror payload' },
  { input: 'javascript:alert(document.cookie)', desc: 'Javascript pseudo-protocol' },
  { input: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==', desc: 'Data URI payload' },
  { input: 'vbscript:msgbox("xss")', desc: 'VBScript protocol' },
  { input: 'file:///etc/passwd', desc: 'Local file protocol traversal' },
  { input: 'file:///C:/Windows/System32/drivers/etc/hosts', desc: 'Windows local file protocol' },
  { input: 'blob:https://youtube.com/b89793cb-3ea6', desc: 'Blob protocol exploit' },
  { input: "PL123' OR '1'='1", desc: 'SQL injection single-quote bypass' },
  { input: 'PL123" UNION SELECT * FROM users--', desc: 'SQL injection double-quote UNION' },
  { input: 'PL123\0alert', desc: 'Null byte injection' },
  { input: '../../../../etc/passwd', desc: 'Directory traversal payload' },
  { input: 'https://www.youtube.com/watch?v=<script>alert(1)</script>', desc: 'URL with embedded XSS in v param' },
  { input: 'https://www.youtube.com/playlist?list=<script>alert(1)</script>', desc: 'URL with embedded XSS in list param' }
];

for (const vector of maliciousVectors) {
  const res = validateYouTubeUrlOrId(vector.input);
  assert(res.isValid === false, `Strictly rejected injection vector: ${vector.desc}`);
  assert(extractPlaylistId(vector.input) === null, `extractPlaylistId returns null for: ${vector.desc}`);
  assert(extractVideoId(vector.input) === null, `extractVideoId returns null for: ${vector.desc}`);
}

// --------------------------------------------------------------------------
// SUITE 3: Phishing, Spoofing & Non-YouTube Domains (STRICTLY REJECT)
// --------------------------------------------------------------------------
console.log('\n--- SUITE 3: Phishing, Spoofing & Unauthorized Domains ---');

const phishingVectors = [
  { input: 'https://youtube.com.attacker.com/watch?v=dQw4w9WgXcQ', desc: 'Subdomain spoofing (youtube.com.attacker.com)' },
  { input: 'https://attacker.com/youtube.com/watch?v=dQw4w9WgXcQ', desc: 'Path spoofing (attacker.com/youtube.com)' },
  { input: 'https://vimeo.com/123456789', desc: 'Third-party platform (Vimeo)' },
  { input: 'https://www.dailymotion.com/video/x7tg46a', desc: 'Third-party platform (Dailymotion)' },
  { input: 'https://google.com/search?q=youtube', desc: 'Google search link' },
  { input: 'https://www.youtubee.com/watch?v=dQw4w9WgXcQ', desc: 'Typo-squatting domain (youtubee.com)' },
  { input: 'http://localhost:8080/admin', desc: 'Localhost SSRF attempt' },
  { input: 'http://127.0.0.1:3000/api/keys', desc: 'Loopback IP SSRF attempt' },
  { input: 'http://169.254.169.254/latest/meta-data/', desc: 'AWS metadata cloud SSRF attempt' },
  { input: 'http://192.168.1.1/router/config', desc: 'Private network IP attempt' }
];

for (const vector of phishingVectors) {
  const res = validateYouTubeUrlOrId(vector.input);
  assert(res.isValid === false, `Strictly rejected unauthorized domain: ${vector.desc}`);
  assert(extractPlaylistId(vector.input) === null, `extractPlaylistId returns null for: ${vector.desc}`);
}

// --------------------------------------------------------------------------
// SUITE 4: Malformed, Empty & Bogus Links (STRICTLY REJECT)
// --------------------------------------------------------------------------
console.log('\n--- SUITE 4: Malformed & Bogus Strings ---');

const bogusCases = [
  { input: '', desc: 'Empty string' },
  { input: '   ', desc: 'Whitespace string' },
  { input: 'https://youtube.com/watch', desc: 'YouTube watch URL without v param' },
  { input: 'https://youtube.com/playlist', desc: 'YouTube playlist URL without list param' },
  { input: 'not_a_valid_youtube_link', desc: 'Random text' },
  { input: '12345', desc: 'Short invalid number' },
  { input: 'A'.repeat(550), desc: 'Oversized string (> 500 chars)' }
];

for (const testCase of bogusCases) {
  const res = validateYouTubeUrlOrId(testCase.input);
  assert(res.isValid === false, `Strictly rejected malformed input: ${testCase.desc}`);
}

// --------------------------------------------------------------------------
// SUITE 5: Guest Quota Preservation Simulation
// --------------------------------------------------------------------------
console.log('\n--- SUITE 5: Guest Mode Quota Preservation ---');

// Mock localStorage for guest user
const mockStorage = new Map();
const originalLocalStorage = global.localStorage;
global.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear()
};

const GUEST_KEY = 'foclyra_guest_imported_playlists';
mockStorage.set(GUEST_KEY, JSON.stringify([]));

// Simulate Dashboard handleDirectImport rejection logic
function simulateImportGateway(inputUrl, userContext = null) {
  const validation = validateYouTubeUrlOrId(inputUrl);
  if (!validation.isValid) {
    // Immediate rejection toast: NO quota checked, NO storage touched, NO network call
    return { status: 'REJECTED_BEFORE_QUOTA', error: validation.error };
  }

  // If valid, would proceed to quota check and import
  if (!userContext) {
    // Guest flow
    const history = JSON.parse(mockStorage.get(GUEST_KEY) || '[]');
    if (history.length >= 1) {
      return { status: 'GUEST_LIMIT_REACHED' };
    }
    history.push(validation.id);
    mockStorage.set(GUEST_KEY, JSON.stringify(history));
    return { status: 'IMPORTED_GUEST', id: validation.id };
  } else {
    // Signed-in flow
    return { status: 'PROCEED_REGISTERED_IMPORT', id: validation.id };
  }
}

// Test 5.1: Malicious links in guest mode
for (const vector of maliciousVectors.slice(0, 5)) {
  const result = simulateImportGateway(vector.input, null);
  assert(result.status === 'REJECTED_BEFORE_QUOTA', `Guest import rejected upfront: ${vector.desc}`);
}

const guestHistoryAfterAttacks = JSON.parse(mockStorage.get(GUEST_KEY) || '[]');
assert(guestHistoryAfterAttacks.length === 0, 'Guest quota history remains completely pristine (0/1 consumed)');

// Test 5.2: Legitimate link in guest mode consumes slot
const validGuestImport = simulateImportGateway('https://www.youtube.com/playlist?list=PLu71SKxNbfoBuX3f4EOACle2y-tRC5Q37', null);
assert(validGuestImport.status === 'IMPORTED_GUEST', 'Legitimate playlist accepted in guest mode');
assert(JSON.parse(mockStorage.get(GUEST_KEY) || '[]').length === 1, 'Guest quota now records 1/1');

// --------------------------------------------------------------------------
// SUITE 6: Signed-in User Quota Preservation
// --------------------------------------------------------------------------
console.log('\n--- SUITE 6: Signed-in User Quota Preservation ---');

const mockUser = { id: 'usr-secure-test-99', email: 'student@example.com' };
let mockRegisteredDbCalls = 0;

function simulateRegisteredImport(inputUrl) {
  const validation = validateYouTubeUrlOrId(inputUrl);
  if (!validation.isValid) {
    // Immediate rejection: DB is NEVER touched
    return { status: 'REJECTED_BEFORE_DB', error: validation.error };
  }
  // Would query and insert into user_courses
  mockRegisteredDbCalls++;
  return { status: 'DB_ACCESSED' };
}

for (const vector of maliciousVectors.slice(0, 5)) {
  const res = simulateRegisteredImport(vector.input);
  assert(res.status === 'REJECTED_BEFORE_DB', `Signed-in import rejected upfront: ${vector.desc}`);
}

assert(mockRegisteredDbCalls === 0, 'Zero database queries executed during malicious input attempts for signed-in user');

// --------------------------------------------------------------------------
// SUITE 7: Serverless Backend Proxy (/api/youtube) Defense
// --------------------------------------------------------------------------
console.log('\n--- SUITE 7: Serverless API Proxy Edge Guard ---');

async function testServerlessProxy(query) {
  let statusCode = 200;
  let jsonResponse = null;
  const mockHeaders = {};

  const req = {
    method: 'GET',
    query,
    headers: { 'x-forwarded-for': '127.0.0.1' },
    socket: {}
  };

  const res = {
    setHeader: (k, v) => { mockHeaders[k] = v; },
    status: (code) => {
      statusCode = code;
      return {
        json: (data) => { jsonResponse = data; return res; },
        end: () => res
      };
    }
  };

  await handler(req, res);
  return { status: statusCode, body: jsonResponse };
}

// Test proxy rejections
const badProxyInputs = [
  { query: { playlistId: '<script>alert(1)</script>' }, desc: 'XSS in playlistId' },
  { query: { playlistId: 'short' }, desc: 'Under minimum length playlistId' },
  { query: { videoId: '../../etc/passwd' }, desc: 'Path traversal in videoId' },
  { query: { videoId: 'invalid-vid-len' }, desc: 'Non-11-character videoId' },
  { query: {}, desc: 'Empty parameters' }
];

for (const item of badProxyInputs) {
  const result = await testServerlessProxy(item.query);
  assert(result.status === 400, `Serverless proxy returned 400 for: ${item.desc}`);
  assert(result.body && typeof result.body.error === 'string', `Informative error returned for: ${item.desc}`);
}

// --------------------------------------------------------------------------
// SUMMARY
// --------------------------------------------------------------------------
console.log('\n======================================================');
console.log(`TOTAL SECURITY TESTS: ${passed + failed}`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL COURSE IMPORT SECURITY AND QUOTA TESTS PASSED PERFECTLY!\n');
  process.exit(0);
}
