// Run from the project root: node tests/lesson-03.js

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  test,
  assert,
  has,
  match,
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

console.log('\nLesson 03: Logging\n');

runGates(ROOT);

// ============================================================
// FILE READS
// ============================================================

const indexFile = read('src/index.ts');
const loggerFile = read('src/middleware/logger.ts');
const pkgJson = read('package.json');

// ============================================================
// STRUCTURAL TESTS
// ============================================================

test('morgan is listed as a dependency', () => {
  assert(
    hasDependency(pkgJson, 'morgan'),
    'Install morgan: npm install morgan && npm install --save-dev @types/morgan',
  );
});

test('src/middleware/logger.ts exists', () => {
  assert(
    loggerFile !== null,
    'Create src/middleware/logger.ts to hold the morgan configuration',
  );
});

test('src/middleware/logger.ts imports morgan', () => {
  const imported =
    has(loggerFile, "import morgan from 'morgan'") ||
    has(loggerFile, 'import morgan from "morgan"');
  assert(
    imported,
    "Import morgan in src/middleware/logger.ts: import morgan from 'morgan'",
  );
});

test('src/middleware/logger.ts exports a requestLogger', () => {
  assert(
    match(loggerFile, /export\s+(const\s+requestLogger|{\s*requestLogger)/),
    'Export a requestLogger from src/middleware/logger.ts: export const requestLogger = morgan(...)',
  );
});

test('src/middleware/logger.ts uses different log formats for dev and production', () => {
  const hasCombined =
    has(loggerFile, "'combined'") || has(loggerFile, '"combined"');
  assert(
    hasCombined,
    "Configure morgan to use 'combined' format in production and 'dev' in development",
  );
});

test('src/middleware/logger.ts defines a custom morgan token', () => {
  assert(
    match(loggerFile, /morgan\.token\(/),
    'Add a custom morgan token with morgan.token(...) for the user-id field',
  );
});

test('src/index.ts registers requestLogger', () => {
  assert(
    match(indexFile, /app\.use\(\s*requestLogger/),
    'Register the requestLogger middleware in src/index.ts: app.use(requestLogger)',
  );
});

// ============================================================
// BEHAVIORAL TESTS
// ============================================================

{
  const hints = {
    'dev mode: morgan logs GET /notes to stdout':
      "Register requestLogger with app.use(requestLogger) in src/index.ts and configure morgan with the 'dev' format in development. " +
      'Expected output: GET /notes 200 17.604 ms - 9',
    'production mode: morgan logs GET /notes in combined format':
      "Use morgan('combined') when NODE_ENV === 'production' in src/middleware/logger.ts. " +
      'Expected output: ::1 - - [26/Jun/2026:10:00:00 +0000] "GET /notes HTTP/1.1" 200 ...',
    'dev mode: log line includes the user-id token':
      "Add morgan.token('user-id', ...) in src/middleware/logger.ts and include :user-id in the format string. " +
      'Expected output: GET /notes 200 17.604 ms [user-id: anonymous]',
  };

  const result = checkBehavior('tests/lesson-03.behavior.js');

  if (result.tests.length === 0) {
    console.log(
      'ℹ️  Behavior Tests — could not run (is MongoDB available and the server able to start?)',
    );
    incrementNotRun();
  } else {
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

summary('MjQyNzU2NjQ=');
