// Run from the project root: node tests/lesson-04.js

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { test, assert, normalize, runGates, summary } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function read(relPath) {
  try {
    return readFileSync(resolve(ROOT, relPath), 'utf8');
  } catch {
    return null;
  }
}

function has(content, str) {
  if (!content) return false;
  return normalize(content).includes(normalize(str));
}

// ============================================================
// GATES
// ============================================================

console.log('\nLesson 04: Rate Limiting\n');

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
    has(pkgJson, '"express-rate-limit"'),
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
// SUMMARY
// ============================================================

// Decodes to: s9l4-rate
summary('czlsNC1yYXRl');
