// Behavioral tests for Lesson 05 — Rate Limiting
// Can also be run standalone: node tests/lesson-05.behavior.js

import http from 'http';
import 'dotenv/config';

const PORT = process.env.PORT ?? 3000;

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
        resolve({ status: res.statusCode });
      },
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function postLogin() {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'ratelimit-test@test.com', password: 'wrong' }),
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

console.log('\nLesson 05: Rate Limiting (behavioral)\n');

// ============================================================
// TESTS
// ============================================================

await test('login endpoint returns 401 for bad credentials (not blocked yet)', async () => {
  const { status } = await postLogin();
  assert(
    status === 401,
    `Expected 401 for invalid credentials, got ${status}`,
  );
});

await test('login endpoint returns 429 after exceeding the request limit', async () => {
  // Fire enough requests to exceed the limit (loginLimiter allows 10 per 15 min)
  const responses = await Promise.all(
    Array.from({ length: 11 }, () => postLogin()),
  );
  const statuses = responses.map((r) => r.status);
  assert(
    statuses.includes(429),
    `Expected at least one 429 Too Many Requests after 11 rapid attempts. Got: ${statuses.join(', ')}`,
  );
});

// ============================================================
// SUMMARY
// ============================================================

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
