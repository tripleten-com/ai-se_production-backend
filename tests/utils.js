import { execSync } from 'child_process';

// ============================================================
// TEST RUNNER
// ============================================================

let pass = 0;
let fail = 0;
let notRun = 0;

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

export function incrementNotRun() {
  notRun++;
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
 * Checks whether a string appears in file content, ignoring whitespace
 * differences. Use for simple token/identifier checks.
 */
export function has(content, str) {
  if (!content) return false;
  return normalize(content).includes(normalize(str));
}

/**
 * Tests a regex against file content. Use this instead of has() for code
 * patterns where students might use different whitespace or line breaks —
 * e.g. /app\.use\(\s*cors\(/ instead of 'app.use(cors('.
 */
export function match(content, regex) {
  if (!content) return false;
  return regex.test(content);
}

/**
 * Checks whether a package name appears in dependencies or devDependencies
 * by parsing package.json as JSON rather than doing string matching.
 */
export function hasDependency(pkgJson, name) {
  if (!pkgJson) return false;
  try {
    const pkg = JSON.parse(pkgJson);
    return name in (pkg.dependencies ?? {}) || name in (pkg.devDependencies ?? {});
  } catch {
    return false;
  }
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
 * Runs a behavioral test file as a subprocess and returns individual test
 * results parsed from its output. If the dev server isn't running, returns
 * { serverDown: true } so the caller can display a "not run" notice instead
 * of counting it as a failure.
 */
export function checkBehavior(testFile) {
  let output = '';
  let ok = false;
  try {
    output = execSync(`node ${testFile}`, { stdio: 'pipe', encoding: 'utf8' });
    ok = true;
  } catch (err) {
    output = err.stdout?.toString() || '';
    ok = false;
  }

  const serverDown = output.includes('Could not reach the server');
  if (serverDown) return { ok: false, tests: [], serverDown: true };

  const tests = output
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      return (
        (t.startsWith('✅') || t.startsWith('❌')) &&
        !t.match(/\d+ passed/) &&
        !t.includes('compiles without')
      );
    })
    .map((line) => {
      const trimmed = line.trim();
      const passed = trimmed.startsWith('✅');
      const name = trimmed.replace(/^[✅❌]\s+/, '').split(' — ')[0];
      return { name, passed };
    });

  return { ok, tests, serverDown: false };
}

/**
 * Prints the pass/fail/not-run totals. Decodes and prints the verification
 * code only when all tests passed and none were skipped. Exits nonzero on
 * any failure.
 */
export function summary(encodedCode) {
  let line = `\n${pass} passed, ${fail} failed`;
  if (notRun > 0) line += grey(`, ${notRun} not run`);
  console.log(line);
  if (fail === 0 && notRun === 0) {
    const code = Buffer.from(encodedCode, 'base64').toString();
    console.log(`\nVerification code: ${code}`);
  } else {
    process.exit(1);
  }
}
