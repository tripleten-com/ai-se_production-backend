// Run from the project root: node tests/lesson-01.js

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

console.log('\nLesson 01: Production vs. Development Environments\n');

runGates(ROOT);

// ============================================================
// FILE READS
// ============================================================

const indexFile = read('src/index.ts');

// ============================================================
// STRUCTURAL TESTS
// ============================================================

test('src/index.ts reads NODE_ENV', () => {
  assert(
    has(indexFile, 'NODE_ENV'),
    'Read process.env.NODE_ENV in src/index.ts to detect the current environment',
  );
});

test('src/index.ts defines an isProduction flag or equivalent', () => {
  const hasFlag =
    has(indexFile, 'isProduction') ||
    has(indexFile, "NODE_ENV === 'production'") ||
    has(indexFile, 'NODE_ENV === "production"');
  assert(
    hasFlag,
    "Define a flag like `const isProduction = process.env.NODE_ENV === 'production'` in src/index.ts",
  );
});

test('src/index.ts uses the environment flag to change behavior', () => {
  const hasTernary =
    has(indexFile, 'isProduction ?') ||
    has(indexFile, 'isProduction\n') ||
    has(indexFile, 'isProduction &&') ||
    has(indexFile, "NODE_ENV === 'production' ?") ||
    has(indexFile, 'NODE_ENV === "production" ?');
  const hasConditional =
    hasTernary ||
    has(indexFile, 'if (isProduction)') ||
    has(indexFile, 'if (process.env.NODE_ENV');
  assert(
    hasConditional,
    'Use the isProduction flag or NODE_ENV to change at least one behavior, such as a startup log message',
  );
});

// ============================================================
// SUMMARY
// ============================================================

summary('OTkxMTk4MTI=');
