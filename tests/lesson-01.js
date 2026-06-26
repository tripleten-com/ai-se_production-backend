// Run from the project root: node tests/lesson-01.js

import { readFileSync } from 'fs';
import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { test, assert, has, runGates, summary } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const TSX = resolve(ROOT, 'node_modules/.bin/tsx');

function read(relPath) {
  try {
    return readFileSync(resolve(ROOT, relPath), 'utf8');
  } catch {
    return null;
  }
}

// Starts the server with the given NODE_ENV and resolves shortly after the
// first stdout output appears. Falls back to 8s if the server never logs.
// Running two calls in parallel would cause an EADDRINUSE conflict, so always
// await them sequentially.
function startupOutput(nodeEnv) {
  return new Promise((resolve) => {
    const proc = spawn(TSX, ['src/index.ts'], {
      env: { ...process.env, NODE_ENV: nodeEnv },
      cwd: ROOT,
    });

    let output = '';
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(fallback);
      proc.kill();
      resolve(output);
    };

    const fallback = setTimeout(finish, 8000);

    proc.stdout.on('data', (chunk) => {
      output += chunk.toString();
      // Brief window for any remaining startup lines, then stop.
      setTimeout(finish, 300);
    });

    proc.on('close', finish);
  });
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
    has(indexFile, 'process.env.NODE_ENV'),
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

// ============================================================
// BEHAVIORAL TESTS
// ============================================================

const devOutput = await startupOutput('development');
const prodOutput = await startupOutput('production');

test('development startup log contains [dev] and server URL', () => {
  assert(
    devOutput.includes('[dev]') && devOutput.includes('http://localhost:'),
    "In development mode, log a message like '[dev] Server running at http://localhost:PORT' inside app.listen()",
  );
});

test('production startup log is JSON', () => {
  const jsonLine = prodOutput
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.startsWith('{'));
  let parsed = null;
  try {
    if (jsonLine) parsed = JSON.parse(jsonLine);
  } catch {}
  assert(
    parsed !== null,
    'In production mode, log JSON.stringify({ event, port, env }) inside app.listen()',
  );
});

test('production JSON log includes event, port, and env fields', () => {
  const jsonLine = prodOutput
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.startsWith('{'));
  let parsed = null;
  try {
    if (jsonLine) parsed = JSON.parse(jsonLine);
  } catch {}
  assert(
    parsed !== null &&
      'event' in parsed &&
      'port' in parsed &&
      parsed.env === 'production',
    "Production JSON log must include 'event', 'port', and 'env' fields — e.g. JSON.stringify({ event: 'server_start', port: PORT, env: process.env.NODE_ENV })",
  );
});

// ============================================================
// SUMMARY
// ============================================================

summary('OTkxMTk4MTI=');
