// Run from the project root: node tests/lesson-03.js

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { test, assert, has, match, hasDependency, runGates, summary } from './utils.js';

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
// SUMMARY
// ============================================================

summary('MjQyNzU2NjQ=');
