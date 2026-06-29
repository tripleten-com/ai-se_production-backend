// Run from the project root: node tests/lesson-05.js

import { readFileSync } from 'fs';
import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  test,
  assert,
  has,
  hasDependency,
  runGates,
  summary,
} from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const TSX = resolve(
  ROOT,
  'node_modules/.bin',
  process.platform === 'win32' ? 'tsx.cmd' : 'tsx',
);

const TEST_PORT = 19874;

function read(relPath) {
  try {
    return readFileSync(resolve(ROOT, relPath), 'utf8');
  } catch {
    return null;
  }
}

// Starts the server, waits until the startup log appears, runs fn() with the
// server live, then kills it. Sequential requests inside fn() give predictable
// rate-limit counter behavior.
function withServer(fn) {
  return new Promise((resolve, reject) => {
    const proc = spawn(TSX, ['src/index.ts'], {
      env: { ...process.env, NODE_ENV: 'development', PORT: String(TEST_PORT) },
      cwd: ROOT,
    });

    let output = '';
    let started = false;
    let finished = false;

    const done = (value, isError) => {
      if (finished) return;
      finished = true;
      clearTimeout(fallback);
      proc.kill();
      if (isError) reject(value);
      else resolve(value);
    };

    const fallback = setTimeout(
      () => done(new Error('Server did not start within 10 seconds'), true),
      10000,
    );

    proc.stdout.on('data', (chunk) => {
      output += chunk.toString();
      // Accept any of the possible startup signals across lesson states:
      // - '[dev]' / 'server_start' — original startup log (lesson 01)
      // - 'Server started' — winston startup log (lesson 04+)
      // - 'MongoDB connected' — always present; app.listen fires right after
      const ready =
        output.includes('[dev]') ||
        output.includes('server_start') ||
        output.includes('Server started') ||
        output.includes('MongoDB connected');
      if (!started && ready) {
        started = true;
        // Brief pause so app.listen has fired before we hit the server.
        setTimeout(
          () =>
            fn()
              .then((r) => done(r, false))
              .catch((e) => done(e, true)),
          150,
        );
      }
    });

    proc.on('error', (err) => done(err, true));
    proc.on('close', () => done(new Error('Server exited unexpectedly'), true));
  });
}

async function post(path, body = {}) {
  const res = await fetch(`http://localhost:${TEST_PORT}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.status;
}

// ============================================================
// GATES
// ============================================================

console.log('\nLesson 05: Rate Limiting\n');

runGates(ROOT);

// ============================================================
// FILE READS
// ============================================================

const rateLimitFile = read('src/middleware/rate-limit.ts');
const authRoutesFile = read('src/routes/auth.ts');
const pkgJson = read('package.json');

// ============================================================
// STRUCTURAL TESTS
// ============================================================

test('express-rate-limit is listed as a dependency', () => {
  assert(
    hasDependency(pkgJson, 'express-rate-limit'),
    'Install express-rate-limit: npm install express-rate-limit',
  );
});

test('src/middleware/rate-limit.ts exists', () => {
  assert(
    rateLimitFile !== null,
    'Create src/middleware/rate-limit.ts and define rate limiters there',
  );
});

test('rate-limit.ts exports loginLimiter', () => {
  assert(
    has(rateLimitFile, 'loginLimiter'),
    'Export a loginLimiter from src/middleware/rate-limit.ts',
  );
});

test('rate-limit.ts exports registerLimiter', () => {
  assert(
    has(rateLimitFile, 'registerLimiter'),
    'Export a registerLimiter from src/middleware/rate-limit.ts with a stricter policy than loginLimiter',
  );
});

test('auth routes apply loginLimiter to POST /auth/login', () => {
  assert(
    has(authRoutesFile, 'loginLimiter'),
    'Import loginLimiter and add it to the POST /auth/login route in src/routes/auth.ts',
  );
});

test('auth routes apply registerLimiter to POST /auth/register', () => {
  assert(
    has(authRoutesFile, 'registerLimiter'),
    'Import registerLimiter and add it to the POST /auth/register route in src/routes/auth.ts',
  );
});

// ============================================================
// BEHAVIORAL TESTS
// ============================================================

// All requests are sent sequentially so rate-limit counters increment
// predictably. registerLimiter allows 5 per window; loginLimiter allows 10.
const { registerStatuses, loginFirst6, loginAll11 } = await withServer(
  async () => {
    const registerStatuses = [];
    for (let i = 0; i < 6; i++) {
      registerStatuses.push(await post('/auth/register', {}));
    }

    const loginFirst6 = [];
    for (let i = 0; i < 6; i++) {
      loginFirst6.push(
        await post('/auth/login', {
          email: 'ratelimit@test.com',
          password: 'wrong',
        }),
      );
    }

    const loginExtra = [];
    for (let i = 0; i < 5; i++) {
      loginExtra.push(
        await post('/auth/login', {
          email: 'ratelimit@test.com',
          password: 'wrong',
        }),
      );
    }

    return {
      registerStatuses,
      loginFirst6,
      loginAll11: [...loginFirst6, ...loginExtra],
    };
  },
);

test('POST /auth/register returns 429 after exceeding registerLimiter', () => {
  assert(
    registerStatuses.includes(429),
    `Expected POST /auth/register to return 429 on or before the 6th request in a window — ` +
      `registerLimiter.max should be 5 or less. Got: ${registerStatuses.join(', ')}`,
  );
});

test('POST /auth/login does not return 429 within 6 requests (loginLimiter allows more than registerLimiter)', () => {
  assert(
    !loginFirst6.includes(429),
    `Expected POST /auth/login to stay below its limit for 6 requests, but got 429. ` +
      `loginLimiter.max should be higher than registerLimiter.max. Got: ${loginFirst6.join(', ')}`,
  );
});

test('POST /auth/login returns 429 after exceeding loginLimiter (11 requests)', () => {
  assert(
    loginAll11.includes(429),
    `Expected POST /auth/login to return 429 after 11 requests — ` +
      `loginLimiter.max should be 10 or less. Got: ${loginAll11.join(', ')}`,
  );
});

// ============================================================
// SUMMARY
// ============================================================

summary('NDcyMzU1NDk=');
