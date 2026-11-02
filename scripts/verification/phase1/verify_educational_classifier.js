import { classifyEducationalContent } from '../../../src/services/contentClassifier.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('--- TEST SUITE: Foclyra Educational Content Classification Engine ---\n');

// Test 1: Legitimate Programming Course
console.log('1. Legitimate Programming Course (Python):');
const pythonResult = classifyEducationalContent({
  course: {
    title: 'Python for Beginners - Full Course [2025]',
    description: 'Learn Python programming from scratch with hands-on software engineering projects.',
    channelName: 'freeCodeCamp.org'
  },
  lessons: [
    { title: '1. Introduction to Python and Setup', description: 'Installing python and VS Code' },
    { title: '2. Variables and Data Types', description: 'Strings, ints, floats and booleans' },
    { title: '3. Functions and Loops', description: 'Writing reusable logic' }
  ]
});
assert(pythonResult.decision === 'ALLOW', 'Allows valid Python programming course');
assert(pythonResult.is_educational === true, 'is_educational is true');
assert(pythonResult.violations.length === 0, 'No violations reported');
assert(pythonResult.categories.includes('Programming & Technology'), 'Identified as Programming & Technology');
assert(pythonResult.approved_videos === 3, 'All 3 videos approved');

// Test 2: Legitimate Academic Mathematics Course
console.log('\n2. Legitimate Academic Mathematics Course (Calculus):');
const mathResult = classifyEducationalContent({
  course: {
    title: 'Calculus 1 - Full College Course',
    description: 'Complete university lectures on differential calculus, limits, and derivatives.',
    channelName: 'MIT OpenCourseWare'
  },
  lessons: [
    { title: 'Lecture 1: The Geometry of Linear Equations', description: 'Matrix operations and vectors' },
    { title: 'Lecture 2: Derivatives and Limits', description: 'Formal limit definition and derivative proof' }
  ]
});
assert(mathResult.decision === 'ALLOW', 'Allows legitimate college calculus course');
assert(mathResult.is_educational === true, 'Calculus marked as educational');
assert(mathResult.categories.includes('Academic & Science'), 'Identified as Academic & Science');

// Test 3: Rule 4 - Recipe / Cooking Tutorial
console.log('\n3. Rule 4: Cooking Tutorial / Recipe:');
const cookingResult = classifyEducationalContent({
  course: {
    title: 'Masterclass: How to Bake Artisan Sourdough Bread',
    description: 'Step-by-step recipe, sourdough fermentation techniques, and baking tutorials.',
    channelName: 'Culinary Institute'
  },
  lessons: [
    { title: 'Lesson 1: Creating a Sourdough Starter Recipe', description: 'Hydration and feeding schedules' },
    { title: 'Lesson 2: Dough Kneading and Shaping Techniques', description: 'Culinary skills for bread' }
  ]
});
assert(cookingResult.decision === 'ALLOW', 'Rule 4: Cooking and recipe tutorials qualify as educational');
assert(cookingResult.categories.includes('Cooking & Recipes'), 'Identified category Cooking & Recipes');

// Test 4: Prohibited - Music / Official Music Video / Album
console.log('\n4. Prohibited: Music Video / VEVO:');
const musicResult = classifyEducationalContent({
  course: {
    title: 'Top Hits 2024 - Official Music Videos',
    description: 'Listen to top audio tracks and full album streams.',
    channelName: 'Pop VEVO'
  },
  lessons: [
    { title: 'Track 1: Hit Single (Official Music Video)', description: 'Lyric video and remix' },
    { title: 'Track 2: Summer Song (Audio Track)', description: 'Slowed and reverb' }
  ]
});
assert(musicResult.decision === 'REJECT', 'Rejects music playlists strictly');
assert(musicResult.is_educational === false, 'is_educational is false for music');
assert(musicResult.violations.length > 0, 'Violations explicitly listed');

// Test 5: Rule 6 - Documentaries MUST always be rejected even with educational subject
console.log('\n5. Rule 6: Historical Documentary:');
const docResult = classifyEducationalContent({
  course: {
    title: 'WWII The Complete Story - Full Documentary',
    description: 'An investigative documentary and docuseries examining historical events.',
    channelName: 'Discovery Channel'
  },
  lessons: [
    { title: 'Part 1: The Origins of Conflict - BBC Documentary', description: 'Archive footage film' },
    { title: 'Part 2: The Turning Point - Full Documentary', description: 'Historical documentary' }
  ]
});
assert(docResult.decision === 'REJECT', 'Rule 6: Documentaries strictly rejected even on educational subjects');
assert(docResult.is_educational === false, 'is_educational is false for documentaries');

// Test 6: Prohibited - Gaming Walkthrough / Gameplay
console.log('\n6. Prohibited: Gaming Walkthrough:');
const gamingResult = classifyEducationalContent({
  course: {
    title: 'Minecraft Hardcore Survival Gameplay Walkthrough',
    description: 'Let\'s play Minecraft with epic twitch highlights and funny moments.',
    channelName: 'ProGamer'
  },
  lessons: [
    { title: 'Episode 1: Day 1 in Minecraft Survival', description: 'Gameplay moments' }
  ]
});
assert(gamingResult.decision === 'REJECT', 'Rejects gaming entertainment content');
assert(gamingResult.is_educational === false, 'Gaming is non-educational');

// Test 7: Prohibited - Lifestyle Vlogs
console.log('\n7. Prohibited: Lifestyle Vlog:');
const vlogResult = classifyEducationalContent({
  course: {
    title: 'My Daily Vlog Series in Tokyo',
    description: 'Room tour, what I eat in a day, and morning routine vlogs.',
    channelName: 'Travel Vlogger'
  },
  lessons: [
    { title: 'Vlog #1: Moving to Tokyo & House Tour', description: 'Day in the life vlog' }
  ]
});
assert(vlogResult.decision === 'REJECT', 'Rejects lifestyle vlogs');

// Test 8: Rule 9 - Mixed Playlist: Any prohibited video rejects the ENTIRE playlist
console.log('\n8. Rule 9: Mixed Playlist with 1 Prohibited Video:');
const mixedResult = classifyEducationalContent({
  course: {
    title: 'Full Stack Web Development Bootcamp',
    description: 'Comprehensive web development course with React and Node.js.',
    channelName: 'Tech Academy'
  },
  lessons: [
    { index: 1, title: 'Lesson 1: Introduction to Web Dev', description: 'HTML & CSS basics' },
    { index: 2, title: 'Lesson 2: JavaScript Fundamentals', description: 'Variables and syntax' },
    { index: 3, title: 'Party Song 2024 (Official Music Video)', description: 'Break time music video' },
    { index: 4, title: 'Lesson 4: React Components', description: 'Building UI components' }
  ]
});
assert(mixedResult.decision === 'REJECT', 'Rule 9: 1 prohibited video rejects the ENTIRE playlist');
assert(mixedResult.rejected_videos === 1, 'Correctly flags 1 rejected video');
assert(mixedResult.approved_videos === 3, 'Correctly tallies 3 approved videos');
assert(mixedResult.violations.some(v => v.includes('Lesson 3')), 'Violation references Lesson 3 directly');

// Test 9: Rule 10 - Ambiguous or Insufficient Metadata Returns REVIEW
console.log('\n9. Rule 10: Ambiguous or Insufficient Metadata:');
const ambiguousResult = classifyEducationalContent({
  course: {
    title: 'Random Clips 2024',
    description: 'Just some clips.',
    channelName: 'Anonymous'
  },
  lessons: [
    { title: 'Video 1', description: '' },
    { title: 'Video 2', description: '' }
  ]
});
assert(ambiguousResult.decision === 'REVIEW', 'Rule 10: Ambiguous metadata returns REVIEW, never assumed educational');
assert(ambiguousResult.is_educational === false, 'is_educational is false on REVIEW');
assert(ambiguousResult.confidence < 0.5, 'Low confidence on uncertain metadata');

// Test 10: Strict Output Schema Verification
console.log('\n10. Output Schema Strict Contract Verification:');
const schemaKeys = [
  'decision',
  'is_educational',
  'confidence',
  'playlist_purpose',
  'total_videos',
  'approved_videos',
  'rejected_videos',
  'categories',
  'violations',
  'reason'
];
const hasAllKeys = schemaKeys.every(k => k in pythonResult && k in musicResult && k in ambiguousResult);
assert(hasAllKeys, 'All results strictly conform to required JSON output schema');
assert(['ALLOW', 'REJECT', 'REVIEW'].includes(pythonResult.decision), 'Valid enum for decision');

console.log(`\n========================================`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
}
