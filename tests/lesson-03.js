// Run from the project root: node tests/lesson-03.js

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

console.log('\nLesson 03: Logging\n');

runGates(ROOT);

// ============================================================
// FILE READS
// ============================================================

const indexFile = read('src/index.ts');
const pkgJson = read('package.json');

// ============================================================
// STRUCTURAL TESTS
// ============================================================

test('morgan is listed as a dependency', () => {
  assert(
    has(pkgJson, '"morgan"'),
    'Install morgan: npm install morgan && npm install --save-dev @types/morgan',
  );
});

test('src/index.ts imports morgan', () => {
  const imported =
    has(indexFile, "import morgan from 'morgan'") ||
    has(indexFile, 'import morgan from "morgan"');
  assert(imported, "Import morgan at the top of src/index.ts: import morgan from 'morgan'");
});

test('src/index.ts mounts morgan middleware', () => {
  assert(
    has(indexFile, 'app.use(morgan('),
    'Mount morgan in src/index.ts: app.use(morgan(...))',
  );
});

test('src/index.ts uses different log formats for dev and production', () => {
  const hasCombined =
    has(indexFile, "'combined'") || has(indexFile, '"combined"');
  assert(
    hasCombined,
    "Configure morgan to use 'combined' format in production and 'dev' in development",
  );
});

test('src/index.ts defines a custom morgan token', () => {
  assert(
    has(indexFile, 'morgan.token('),
    'Add a custom morgan token with morgan.token(...) for the auth-status field',
  );
});

// ============================================================
// SUMMARY
// ============================================================

// Decodes to: s9l3-log
summary('czlsMy1sb2c=');
