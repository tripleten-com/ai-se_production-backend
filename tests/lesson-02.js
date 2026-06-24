// Run from the project root: node tests/lesson-02.js

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

console.log('\nLesson 02: CORS\n');

runGates(ROOT);

// ============================================================
// FILE READS
// ============================================================

const indexFile = read('src/index.ts');
const pkgJson = read('package.json');
const envExample = read('.env.example');

// ============================================================
// STRUCTURAL TESTS
// ============================================================

test('cors is listed as a dependency', () => {
  assert(
    has(pkgJson, '"cors"'),
    'Install cors: npm install cors && npm install --save-dev @types/cors',
  );
});

test('src/index.ts imports cors', () => {
  const imported =
    has(indexFile, "import cors from 'cors'") ||
    has(indexFile, 'import cors from "cors"');
  assert(imported, "Import cors at the top of src/index.ts: import cors from 'cors'");
});

test('src/index.ts mounts cors middleware', () => {
  assert(
    has(indexFile, 'app.use(cors('),
    'Mount cors middleware in src/index.ts: app.use(cors({ ... }))',
  );
});

test('cors origin reads from CLIENT_ORIGIN env var', () => {
  assert(
    has(indexFile, 'CLIENT_ORIGIN'),
    'Set the allowed origin from process.env.CLIENT_ORIGIN instead of a hardcoded string',
  );
});

test('.env.example documents CLIENT_ORIGIN', () => {
  assert(
    has(envExample, 'CLIENT_ORIGIN'),
    'Add CLIENT_ORIGIN to .env.example so other developers know it is required',
  );
});

// ============================================================
// SUMMARY
// ============================================================

// Decodes to: s9l2-cors
summary('czlsMi1jb3Jz');
