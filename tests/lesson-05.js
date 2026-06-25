// Run from the project root: node tests/lesson-05.js

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  test,
  assert,
  has,
  hasDependency,
  checkBehavior,
  incrementPass,
  incrementFail,
  incrementNotRun,
  runGates,
  summary,
} from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function read(relPath) {
  try {
    return readFileSync(resolve(ROOT, relPath), 'utf8');
  } catch {
    return null;
  }
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

{
  const hints = {
    'login endpoint returns 401 for bad credentials (not blocked yet)':
      'Make sure the login route is reachable and returns 401 for wrong credentials',
    'login endpoint returns 429 after exceeding the request limit':
      'Apply loginLimiter to POST /auth/login in src/routes/auth.ts',
  };

  const result = checkBehavior('tests/lesson-05.behavior.js');

  if (result.serverDown) {
    console.log(
      'ℹ️  Behavior Tests — start the dev server to run these (npm run dev)',
    );
    incrementNotRun();
  } else if (result.tests.length > 0) {
    const icon = result.ok ? '✅' : '❌';
    console.log(`${icon} Behavior Tests`);
    result.tests.forEach((t) => {
      const testIcon = t.passed ? '✅' : '❌';
      const hint = t.passed ? '' : ` — ${hints[t.name] ?? ''}`;
      console.log(`  ${testIcon} ${t.name}${hint}`);
      if (t.passed) incrementPass();
      else incrementFail();
    });
  }
}

// ============================================================
// SUMMARY
// ============================================================

summary('NDcyMzU1NDk=');
