// Behavioral tests for Lesson 02 — CORS
// Can also be run standalone: node tests/lesson-02.behavior.js

import http from 'http';
import 'dotenv/config';

const PORT = process.env.PORT ?? 3000;
const ALLOWED_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5500';

let pass = 0;
let fail = 0;

async function test(label, fn) {
  try {
    await fn();
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

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const body = options.body ?? null;
    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path,
        method: options.method ?? 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers ?? {}),
        },
      },
      (res) => {
        res.resume();
        resolve({ status: res.statusCode, headers: res.headers });
      },
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// ============================================================
// SERVER CHECK
// ============================================================

try {
  await request('/');
} catch {
  console.error(
    '\n❌ Could not reach the server. Start it with `npm run dev` before running behavioral tests.\n',
  );
  process.exit(1);
}

console.log('\nLesson 02: CORS (behavioral)\n');

// ============================================================
// TESTS
// ============================================================

await test('allows requests from CLIENT_ORIGIN', async () => {
  const { headers } = await request('/auth/login', {
    method: 'POST',
    headers: { Origin: ALLOWED_ORIGIN },
    body: JSON.stringify({ email: 'test@test.com', password: 'test' }),
  });
  const header = headers['access-control-allow-origin'];
  assert(
    header === ALLOWED_ORIGIN,
    `Expected Access-Control-Allow-Origin: ${ALLOWED_ORIGIN}, got: ${header ?? '(none)'}`,
  );
});

await test('does not allow requests from unlisted origins', async () => {
  const { headers } = await request('/auth/login', {
    method: 'POST',
    headers: { Origin: 'http://evil.example.com' },
    body: JSON.stringify({ email: 'test@test.com', password: 'test' }),
  });
  const header = headers['access-control-allow-origin'];
  assert(
    header !== 'http://evil.example.com',
    'CORS is allowing unlisted origins — make sure origin is set to CLIENT_ORIGIN, not a wildcard',
  );
});

// ============================================================
// SUMMARY
// ============================================================

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
