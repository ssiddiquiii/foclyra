import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

async function runPenetrationSuite() {
  console.log('=== Step 4: Security & RLS Policies Penetration Audit ===\n');

  // Load environment variables
  const envContent = fs.readFileSync('.env', 'utf8');
  const url = envContent.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
  const key = (envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/) || envContent.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/))?.[1]?.trim();

  assert(Boolean(url && key), 'Supabase URL and Anon/Publishable Key loaded from environment');

  const supabase = createClient(url, key);

  console.log('\n--- Section 1: Anonymous / Unauthenticated Penetration Tests ---');
  const targetVictimId = '00000000-0000-0000-0000-000000000099';

  // 1. Profiles Table
  const { data: profRead, error: profReadErr } = await supabase.from('profiles').select('*');
  assert(profRead?.length === 0, 'profiles: Anonymous client cannot read any user profiles (returned 0 rows)');

  const { error: profInsertErr } = await supabase.from('profiles').insert({
    id: targetVictimId,
    email: 'hacker@victim.com',
    full_name: 'Impersonated User'
  });
  assert(profInsertErr?.code === '42501', `profiles: Anonymous insert rejected by RLS (code: ${profInsertErr?.code})`);

  const { data: profUpdate, error: profUpdateErr } = await supabase
    .from('profiles')
    .update({ full_name: 'Hacked Name' })
    .eq('id', targetVictimId)
    .select();
  assert(profUpdate?.length === 0 || profUpdateErr !== null, 'profiles: Anonymous update cannot modify any profile');

  const { data: profDelete, error: profDeleteErr } = await supabase
    .from('profiles')
    .delete()
    .eq('id', targetVictimId)
    .select();
  assert(profDelete?.length === 0 || profDeleteErr !== null, 'profiles: Anonymous delete cannot delete any profile');

  // 2. User Courses Table
  const { data: courseRead } = await supabase.from('user_courses').select('*');
  assert(courseRead?.length === 0, 'user_courses: Anonymous client cannot read user courses (returned 0 rows)');

  const { error: courseInsertErr } = await supabase.from('user_courses').insert({
    user_id: targetVictimId,
    course_id: 'malicious_course_injection',
    title: 'Injected Course'
  });
  assert(courseInsertErr?.code === '42501', `user_courses: Anonymous insert rejected by RLS (code: ${courseInsertErr?.code})`);

  const { data: courseUpdate, error: courseUpdateErr } = await supabase
    .from('user_courses')
    .update({ title: 'Hacked Course' })
    .eq('user_id', targetVictimId)
    .select();
  assert(courseUpdate?.length === 0 || courseUpdateErr !== null, 'user_courses: Anonymous update cannot modify courses');

  const { data: courseDelete, error: courseDeleteErr } = await supabase
    .from('user_courses')
    .delete()
    .eq('user_id', targetVictimId)
    .select();
  assert(courseDelete?.length === 0 || courseDeleteErr !== null, 'user_courses: Anonymous delete cannot delete courses');

  // 3. User Notes Table
  const { data: noteRead } = await supabase.from('user_notes').select('*');
  assert(noteRead?.length === 0, 'user_notes: Anonymous client cannot read private notes (returned 0 rows)');

  const { error: noteInsertErr } = await supabase.from('user_notes').insert({
    user_id: targetVictimId,
    course_id: 'course_1',
    lesson_id: 'lesson_1',
    content: 'Stolen or injected note'
  });
  assert(noteInsertErr?.code === '42501', `user_notes: Anonymous insert rejected by RLS (code: ${noteInsertErr?.code})`);

  const { data: noteUpdate, error: noteUpdateErr } = await supabase
    .from('user_notes')
    .update({ content: 'Modified Note' })
    .eq('user_id', targetVictimId)
    .select();
  assert(noteUpdate?.length === 0 || noteUpdateErr !== null, 'user_notes: Anonymous update cannot modify user notes');

  const { data: noteDelete, error: noteDeleteErr } = await supabase
    .from('user_notes')
    .delete()
    .eq('user_id', targetVictimId)
    .select();
  assert(noteDelete?.length === 0 || noteDeleteErr !== null, 'user_notes: Anonymous delete cannot delete user notes');

  // 4. User Progress Table
  const { data: progRead } = await supabase.from('user_progress').select('*');
  assert(progRead?.length === 0, 'user_progress: Anonymous client cannot read user progress (returned 0 rows)');

  const { error: progInsertErr } = await supabase.from('user_progress').insert({
    id: '00000000-0000-0000-0000-000000000099',
    user_id: targetVictimId,
    course_id: 'course_1',
    lesson_id: 'lesson_1',
    watch_time: 9999,
    completed: true,
    last_watched: new Date().toISOString()
  });
  assert(progInsertErr?.code === '42501', `user_progress: Anonymous insert rejected by RLS (code: ${progInsertErr?.code})`);

  const { data: progUpdate, error: progUpdateErr } = await supabase
    .from('user_progress')
    .update({ completed: false })
    .eq('user_id', targetVictimId)
    .select();
  assert(progUpdate?.length === 0 || progUpdateErr !== null, 'user_progress: Anonymous update cannot tamper with progress');

  const { data: progDelete, error: progDeleteErr } = await supabase
    .from('user_progress')
    .delete()
    .eq('user_id', targetVictimId)
    .select();
  assert(progDelete?.length === 0 || progDeleteErr !== null, 'user_progress: Anonymous delete cannot delete progress');

  console.log('\n--- Section 2: Secret & Privilege Leakage Audit ---');

  // Check .env for leaked service role key
  const hasServiceRoleKey = /service_role/i.test(envContent) || /SUPABASE_SERVICE_ROLE/i.test(envContent);
  assert(!hasServiceRoleKey, '.env file does not contain service_role admin secret');

  // Audit production bundle
  const distAssetsDir = path.resolve('dist/assets');
  if (fs.existsSync(distAssetsDir)) {
    const files = fs.readdirSync(distAssetsDir).filter(f => f.endsWith('.js'));
    let leakFound = false;

    for (const file of files) {
      const content = fs.readFileSync(path.join(distAssetsDir, file), 'utf8');
      if (content.includes('service_role') || content.includes('SUPABASE_SERVICE_ROLE_KEY')) {
        leakFound = true;
        console.error(`[FAIL] Leaked service_role key found in ${file}`);
      }
      if (/postgres:\/\/[^:]+:[^@]+@/i.test(content)) {
        leakFound = true;
        console.error(`[FAIL] Leaked PostgreSQL database credentials found in ${file}`);
      }
    }

    assert(!leakFound, `Audited ${files.length} production bundle assets: Zero service_role or DB credentials leaked`);
  } else {
    console.warn('[WARN] dist/assets not found, skipping bundle scan (run npm run build first)');
  }

  console.log('\n--- Section 3: Injection & Parameter Sanitization Checks ---');
  const handler = (await import('../../../api/youtube.js')).default;

  function createMockReqRes(query) {
    let statusCode = 200;
    let body = null;
    return {
      req: { method: 'GET', query },
      res: {
        setHeader: () => {},
        status: (code) => { statusCode = code; return { json: (d) => { body = d; } }; },
        json: (d) => { body = d; },
        getStatusCode: () => statusCode,
        getBody: () => body
      }
    };
  }

  // Attack 1: SQL Injection in playlistId
  const { req: sqliReq, res: sqliRes } = createMockReqRes({ playlistId: "PLu71SKx'; DROP TABLE user_courses; --" });
  await handler(sqliReq, sqliRes);
  assert(sqliRes.getStatusCode() === 400, 'SQL injection attempt in playlistId rejected with HTTP 400 Bad Request');

  // Attack 2: XSS in playlistId
  const { req: xssReq, res: xssRes } = createMockReqRes({ playlistId: '<script>alert(1)</script>' });
  await handler(xssReq, xssRes);
  assert(xssRes.getStatusCode() === 400, 'XSS attempt in playlistId rejected with HTTP 400 Bad Request');

  // Attack 3: Path Traversal
  const { req: pathReq, res: pathRes } = createMockReqRes({ playlistId: '../../etc/passwd' });
  await handler(pathReq, pathRes);
  assert(pathRes.getStatusCode() === 400, 'Path traversal in playlistId rejected with HTTP 400 Bad Request');

  console.log(`\nFinal Audit Results: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runPenetrationSuite().catch(err => {
  console.error(err);
  process.exit(1);
});
