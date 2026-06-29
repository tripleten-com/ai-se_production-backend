// Behavioral tests for Lesson 04 — Application Logging with Winston
// Can also be run standalone: node tests/lesson-04.behavior.js

import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const TSX = resolve(ROOT, 'node_modules/.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');
// Dedicated port so these tests can run alongside the dev server.
const TEST_PORT = process.env.TEST_PORT ?? 3998;

let pass = 0;
let fail = 0;

function test(label, fn) {
  try {
    fn();
    console.log(`✅ ${label}`);
    pass++;
  } catch (err) {
    console.log(`❌ ${label} — ${err.message}`);
    fail++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Starts the server with the given NODE_ENV, collects output until the first
// stdout line appears (startup log), then kills the process and returns the
// captured output.
function startupLog(nodeEnv) {
  return new Promise((resolve) => {
    const proc = spawn(TSX, ['src/index.ts'], {
      env: { ...process.env, NODE_ENV: nodeEnv, PORT: String(TEST_PORT) },
      cwd: ROOT,
    });

    let output = '';
    let killScheduled = false;

    const scheduleKill = () => {
      if (killScheduled) return;
      killScheduled = true;
      clearTimeout(fallback);
      proc.kill();
    };

    const fallback = setTimeout(scheduleKill, 8000);

    proc.stdout.on('data', (chunk) => {
      output += chunk.toString();
      // Brief window for any remaining startup lines, then stop.
      setTimeout(scheduleKill, 300);
    });

    proc.stderr.on('data', (chunk) => {
      output += chunk.toString();
    });

    proc.on('error', () => {});

    proc.on('close', () => {
      clearTimeout(fallback);
      resolve(output);
    });
  });
}

console.log('\nLesson 04: Application Logging with Winston (behavioral)\n');

// Run sequentially to avoid EADDRINUSE on TEST_PORT.
const devLog = await startupLog('development');
const prodLog = await startupLog('production');

test('dev startup log uses simple (human-readable) format', () => {
  // winston simple() + colorize() produces:  info: Server started {...}
  // The line containing 'Server started' should NOT be a JSON object.
  const line = devLog.split('\n').find((l) => l.includes('Server started'));
  assert(
    line !== undefined && !line.trimStart().startsWith('{'),
    'Expected the development startup log to use winston simple format, e.g.: ' +
      'info: Server started {"port":"3000","env":"development"}\n' +
      "Check that combine(colorize(), simple()) is used when NODE_ENV !== 'production'",
  );
});

test('production startup log uses JSON format', () => {
  // winston combine(timestamp(), json()) produces a JSON object per line.
  const jsonLine = prodLog.split('\n').find((l) => {
    try {
      const parsed = JSON.parse(l.trim());
      return parsed.level && parsed.message;
    } catch {
      return false;
    }
  });
  assert(
    jsonLine !== undefined,
    'Expected the production startup log to be a JSON object, e.g.: ' +
      '{"level":"info","message":"Server started","port":"3000","env":"production","timestamp":"..."}\n' +
      "Check that combine(timestamp(), json()) is used when NODE_ENV === 'production'",
  );
});

test('production startup log includes a timestamp', () => {
  // timestamp() adds a "timestamp" field — its presence confirms the format is correct.
  const jsonLine = prodLog.split('\n').find((l) => {
    try {
      return JSON.parse(l.trim()).timestamp !== undefined;
    } catch {
      return false;
    }
  });
  assert(
    jsonLine !== undefined,
    'Expected the production JSON log to include a "timestamp" field.\n' +
      "Add timestamp() to the production format: combine(timestamp(), json())",
  );
});

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
