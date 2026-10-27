import { spawn } from 'node:child_process';
import { createServer } from 'vite';

const TEST_BASE_URL = 'http://127.0.0.1:4173';

export const unitScripts = [
  'scripts/verification/phase1/verify_streak_logic.js',
  'scripts/verification/phase1/verify_youtube_api.js',
  'scripts/verification/phase1/verify_serverless_api_full.js',
  'scripts/verification/phase1/verify_live_smoke_test.js',
];

export const browserScripts = [
  'scripts/verification/phase1/verify_browser_e2e.js',
  'scripts/verification/phase1/verify_dashboard_nonzero_notes.js',
  'scripts/verification/phase1/verify_invalid_backup_preservation.js',
  'scripts/verification/phase2a/verify_data_safety.js',
  'scripts/verification/phase2b/verify_bootstrap_commands.js',
  'scripts/verification/phase2c/verify_scoped_reads.js',
  'scripts/verification/phase4/verify_responsive_shell.js',
  'scripts/verification/phase5/verify_dashboard_course_streak.js',
  'scripts/verification/phase6a/verify_watch_decomposition.js',
  'scripts/verification/phase6b/verify_watch_responsive.js',
  'scripts/verification/phase6c/verify_watch_persistence_captions.js',
  'scripts/verification/phase6d/verify_watch_workspace_interactions.js',
];

export function runNodeScript(script, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], {
      cwd: process.cwd(),
      env: { ...process.env, ...extraEnv },
      stdio: 'inherit'
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`${script} terminated by ${signal}`));
      } else {
        resolve(code ?? 1);
      }
    });
  });
}

async function runScripts(scripts, extraEnv = {}) {
  for (const script of scripts) {
    console.log(`\n[verification] ${script}`);
    const exitCode = await runNodeScript(script, extraEnv);
    if (exitCode !== 0) {
      throw new Error(`${script} failed with exit code ${exitCode}`);
    }
  }
}

async function withTestServer(callback) {
  const server = await createServer({
    logLevel: 'error',
    server: {
      host: '127.0.0.1',
      port: 4173,
      strictPort: true
    }
  });

  try {
    await server.listen();
    console.log(`[verification] Vite test server ready at ${TEST_BASE_URL}`);
    await callback();
  } finally {
    await server.close();
    console.log('[verification] Vite test server stopped');
  }
}

export async function runSuite(suite) {
  if (suite === 'probe-failure') {
    return runNodeScript('scripts/verification/phase3/intentional_failure_fixture.js');
  }
  if (suite === 'unit' || suite === 'all') {
    await runScripts(unitScripts);
  }
  if (suite === 'browser' || suite === 'all') {
    await withTestServer(() =>
      runScripts(browserScripts, { FOCLYRA_TEST_BASE_URL: TEST_BASE_URL })
    );
  }
  if (suite === 'phase4') {
    await withTestServer(() =>
      runScripts(
        ['scripts/verification/phase4/verify_responsive_shell.js'],
        { FOCLYRA_TEST_BASE_URL: TEST_BASE_URL }
      )
    );
  }
  if (suite === 'phase5') {
    await withTestServer(() => runScripts(
      ['scripts/verification/phase5/verify_dashboard_course_streak.js'],
      { FOCLYRA_TEST_BASE_URL: TEST_BASE_URL }
    ));
  }
  if (suite === 'phase6a') {
    await withTestServer(() => runScripts(
      ['scripts/verification/phase6a/verify_watch_decomposition.js'],
      { FOCLYRA_TEST_BASE_URL: TEST_BASE_URL }
    ));
  }
  if (suite === 'phase6b') {
    await withTestServer(() => runScripts(
      ['scripts/verification/phase6a/verify_watch_decomposition.js', 'scripts/verification/phase6b/verify_watch_responsive.js'],
      { FOCLYRA_TEST_BASE_URL: TEST_BASE_URL }
    ));
  }
  if (suite === 'phase6c') {
    await withTestServer(() => runScripts(
      [
        'scripts/verification/phase6a/verify_watch_decomposition.js',
        'scripts/verification/phase6b/verify_watch_responsive.js',
        'scripts/verification/phase6c/verify_watch_persistence_captions.js'
      ],
      { FOCLYRA_TEST_BASE_URL: TEST_BASE_URL }
    ));
  }
  if (suite === 'phase6d') {
    await withTestServer(() => runScripts(
      [
        'scripts/verification/phase6a/verify_watch_decomposition.js',
        'scripts/verification/phase6b/verify_watch_responsive.js',
        'scripts/verification/phase6c/verify_watch_persistence_captions.js',
        'scripts/verification/phase6d/verify_watch_workspace_interactions.js'
      ],
      { FOCLYRA_TEST_BASE_URL: TEST_BASE_URL }
    ));
  }
  if (suite === 'phase7a') {
    await runScripts(['scripts/verification/phase7a/verify_practice_identity.js']);
    await withTestServer(() => runScripts(
      ['scripts/verification/phase7a/verify_practice_identity_browser.js'],
      { FOCLYRA_TEST_BASE_URL: TEST_BASE_URL }
    ));
  }
  if (!['unit', 'browser', 'phase4', 'phase5', 'phase6a', 'phase6b', 'phase6c', 'phase6d', 'phase7a', 'all'].includes(suite)) {
    throw new Error(`Unknown verification suite: ${suite}`);
  }
  return 0;
}

const isDirectRun =
  process.argv[1] &&
  new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1') ===
    process.argv[1].replaceAll('\\', '/');

if (isDirectRun) {
  runSuite(process.argv[2] || 'all')
    .then(exitCode => {
      process.exitCode = exitCode;
    })
    .catch(error => {
      console.error(`[verification] ${error.message}`);
      process.exitCode = 1;
    });
}
