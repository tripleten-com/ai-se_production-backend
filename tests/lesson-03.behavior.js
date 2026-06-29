// Behavioral tests for Lesson 03 — Request Logger
// Can also be run standalone: node tests/lesson-03.behavior.js

import http from 'http';
import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const TSX = resolve(ROOT, 'node_modules/.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');
// Use a dedicated port so these tests can run while the dev server (port 3000)
// is still up. Students can override with TEST_PORT if needed.
const TEST_PORT = process.env.TEST_PORT ?? 3999;

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

// Starts the server with the given NODE_ENV, waits for first stdout output
// (the startup log), makes a GET request to path, then collects any subsequent
// log output. Returns all stdout/stderr collected.
// Running two calls in parallel would cause an EADDRINUSE conflict, so always
// await them sequentially.
function serverRequestLog(nodeEnv, path = '/') {
  return new Promise((resolve) => {
    const proc = spawn(TSX, ['src/index.ts'], {
      env: { ...process.env, NODE_ENV: nodeEnv, PORT: String(TEST_PORT) },
      cwd: ROOT,
    });

    let output = '';
    let requested = false;
    let killScheduled = false;

    // Schedule a SIGTERM. Do NOT resolve here — wait for the close event so
    // Node has a chance to flush any buffered stdout (e.g. morgan log lines)
    // before we read output.
    const scheduleKill = () => {
      if (killScheduled) return;
      killScheduled = true;
      clearTimeout(fallback);
      proc.kill();
    };

    const fallback = setTimeout(scheduleKill, 8000);

    proc.stdout.on('data', (chunk) => {
      output += chunk.toString();
      if (!requested) {
        requested = true;
        // Give the server a brief moment to bind, then send a request.
        setTimeout(() => {
          const req = http.get(
            { hostname: 'localhost', port: TEST_PORT, path },
            () => {},
          );
          req.on('error', () => {});
          // Allow time for morgan to write the log line, then kill.
          setTimeout(scheduleKill, 500);
        }, 200);
      }
    });

    proc.stderr.on('data', (chunk) => {
      output += chunk.toString();
    });

    // Prevent unhandled 'error' events (e.g. ENOENT on Windows) from crashing
    // the process. The 'close' event fires after 'error', so output is still
    // collected there.
    proc.on('error', () => {});

    // Resolve only after the process exits and all stdio streams are closed,
    // so we never read output before the final buffers are flushed.
    proc.on('close', () => {
      clearTimeout(fallback);
      resolve(output);
    });
  });
}

console.log('\nLesson 03: Request Logger (behavioral)\n');

// GET /notes requires no auth and returns 200, making it a stable target for
// log-format assertions.
const devLog = await serverRequestLog('development', '/notes');
const prodLog = await serverRequestLog('production', '/notes');

test('dev mode: morgan logs GET /notes to stdout', () => {
  // Morgan dev format: "GET /notes 200 17.604 ms - 9"
  assert(
    /GET \/notes \d{3} [\d.]+ ms/.test(devLog),
    'No morgan log line found for GET /notes in development mode. ' +
      'Expected a line like: GET /notes 200 17.604 ms - 9\n' +
      'Ensure requestLogger is registered with app.use(requestLogger) in src/index.ts ' +
      "and that morgan is configured with the 'dev' format when NODE_ENV !== 'production'",
  );
});

test('production mode: morgan logs GET /notes in combined format', () => {
  // Morgan combined format: ::1 - - [26/Jun/2026:10:00:00 +0000] "GET /notes HTTP/1.1" 200 ...
  assert(
    /\[\d{2}\/\w+\/\d{4}:\d{2}:\d{2}:\d{2}[^\]]*\] "GET \/notes HTTP/.test(prodLog),
    'No combined-format log line found for GET /notes in production mode. ' +
      'Expected a line like: ::1 - - [26/Jun/2026:10:00:00 +0000] "GET /notes HTTP/1.1" 200 ...\n' +
      "Ensure morgan is configured with the 'combined' format when NODE_ENV === 'production'",
  );
});

test('dev mode: log line includes the user-id token', () => {
  // Unauthenticated requests should show the anonymous placeholder, e.g.:
  // GET /notes 200 17.604 ms [user-id: anonymous]
  assert(
    /user-id:/.test(devLog),
    'The user-id token was not found in the development log output. ' +
      'Expected the log line to include the token, e.g.: GET /notes 200 17.604 ms [user-id: anonymous]\n' +
      "Define a custom token with morgan.token('user-id', ...) and include :user-id in the format string",
  );
});


console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
