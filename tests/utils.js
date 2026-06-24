import { execSync } from 'child_process';

// ============================================================
// TEST RUNNER
// ============================================================

let pass = 0;
let fail = 0;

const GREY = '\x1b[90m';
const RESET = '\x1b[0m';

function grey(text) {
  if (!process.stdout.isTTY) return text;
  return `${GREY}${text}${RESET}`;
}

export function test(label, fn) {
  try {
    fn();
    console.log(`✅ ${label}`);
    pass++;
  } catch (err) {
    console.log(`❌ ${label} — ${err.message}`);
    fail++;
  }
}

export function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function incrementPass() {
  pass++;
}

export function incrementFail() {
  fail++;
}

/**
 * Collapses all whitespace sequences to a single space and trims the result.
 * Always call this before doing string checks to avoid whitespace mismatches.
 */
export function normalize(content) {
  if (content === null) return null;
  return content.replace(/\s+/g, ' ').trim();
}

/**
 * Type-checks the project. `root` is the path to the directory
 * containing tsconfig.json.
 */
export function checkCompiles(root) {
  try {
    execSync(
      'node node_modules/typescript/bin/tsc --noEmit --noUnusedLocals false --noUnusedParameters false',
      { cwd: root, stdio: 'pipe' },
    );
    return { ok: true, output: '' };
  } catch (err) {
    const output =
      err.stderr?.toString() || err.stdout?.toString() || '(no output)';
    return { ok: false, output };
  }
}

/**
 * Runs the TypeScript compile gate. Does not block remaining tests on failure
 * so students get full feedback even when there are type errors.
 */
export function runGates(root) {
  const compiled = checkCompiles(root);
  if (compiled.ok) {
    console.log('✅ Project compiles without type errors\n');
    pass++;
  } else {
    console.log('❌ Project compiles without type errors — fix TypeScript errors\n');
    const indented = compiled.output
      .split('\n')
      .map((line) => (line ? '  ' + line : line))
      .join('\n');
    console.log(indented);
    fail++;
  }
}

/**
 * Prints the pass/fail totals. Decodes and prints the verification code
 * only when all tests passed. Exits nonzero on any failure.
 */
export function summary(encodedCode) {
  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail === 0) {
    const code = Buffer.from(encodedCode, 'base64').toString();
    console.log(`\nVerification code: ${code}`);
  } else {
    process.exit(1);
  }
}
