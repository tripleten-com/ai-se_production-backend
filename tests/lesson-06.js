// Run from the project root: node tests/lesson-06.js

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

console.log('\nLesson 06: In-Memory Caching\n');

runGates(ROOT);

// ============================================================
// FILE READS
// ============================================================

const cacheFile = read('src/utils/cache.ts');
const notesController = read('src/controllers/notes.ts');

// ============================================================
// STRUCTURAL TESTS
// ============================================================

test('src/utils/cache.ts exists', () => {
  assert(
    cacheFile !== null,
    'Create src/utils/cache.ts with a Map-based cache helper',
  );
});

test('cache.ts exports getCacheValue', () => {
  assert(
    has(cacheFile, 'getCacheValue'),
    'Export a getCacheValue function from src/utils/cache.ts',
  );
});

test('cache.ts exports setCacheValue', () => {
  assert(
    has(cacheFile, 'setCacheValue'),
    'Export a setCacheValue function from src/utils/cache.ts',
  );
});

test('cache.ts exports deleteCacheValue', () => {
  assert(
    has(cacheFile, 'deleteCacheValue'),
    'Export a deleteCacheValue function from src/utils/cache.ts for use in write controllers',
  );
});

test('getCacheValue or setCacheValue accepts a ttlMs parameter', () => {
  assert(
    has(cacheFile, 'ttlMs'),
    'Update getCacheValue or setCacheValue to accept an optional ttlMs parameter so callers can set per-route TTLs',
  );
});

test('src/controllers/notes.ts imports from the cache helper', () => {
  const importsCache =
    has(notesController, "from '../utils/cache") ||
    has(notesController, 'from "../utils/cache');
  assert(
    importsCache,
    "Import getCacheValue, setCacheValue, and deleteCacheValue from '../utils/cache.js' in src/controllers/notes.ts",
  );
});

test('getNotes checks the cache before querying the database', () => {
  assert(
    has(notesController, 'getCacheValue'),
    'Call getCacheValue before Note.find() in the getNotes controller',
  );
});

test('createNote invalidates the cache after a successful write', () => {
  assert(
    has(notesController, 'deleteCacheValue'),
    'Call deleteCacheValue after Note.create() succeeds in the createNote controller',
  );
});

// ============================================================
// SUMMARY
// ============================================================

summary('MzQwNjU5MDY=');
