// Run from the project root: node tests/lesson-04.js

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  test,
  assert,
  has,
  match,
  hasDependency,
  checkBehavior,
  incrementPass,
  incrementFail,
  incrementNotRun,
  runGates,
  summary,
} from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function read(relPath) {
  try {
    return readFileSync(resolve(ROOT, relPath), 'utf8');
  } catch {
    return null;
  }
}

// ============================================================
// GATES
// ============================================================

console.log('\nLesson 04: Application Logging with Winston\n');

runGates(ROOT);

// ============================================================
// FILE READS
// ============================================================

const loggerFile = read('src/utils/logger.ts');
const errorHandlerFile = read('src/middleware/error.ts');
const pkgJson = read('package.json');

// ============================================================
// STRUCTURAL TESTS
// ============================================================

test('winston is listed as a dependency', () => {
  assert(
    hasDependency(pkgJson, 'winston'),
    'Install winston: npm install winston',
  );
});

test('src/utils/logger.ts exists', () => {
  assert(
    loggerFile !== null,
    'Create src/utils/logger.ts and export a configured logger instance',
  );
});

test('src/utils/logger.ts imports winston', () => {
  const imported =
    has(loggerFile, "import winston from 'winston'") ||
    has(loggerFile, 'import winston from "winston"');
  assert(
    imported,
    "Import winston at the top of src/utils/logger.ts: import winston from 'winston'",
  );
});

test('src/utils/logger.ts exports a logger', () => {
  assert(
    match(loggerFile, /export\s+(const\s+logger|{\s*logger)/),
    'Export a logger from src/utils/logger.ts: export const logger = winston.createLogger(...)',
  );
});

test('src/utils/logger.ts uses environment-aware log levels', () => {
  const hasEnvCheck =
    has(loggerFile, 'isProduction') || has(loggerFile, 'NODE_ENV');
  assert(
    hasEnvCheck,
    "Set level based on the environment — use 'debug' in development and 'info' or 'warn' in production",
  );
});

test('src/utils/logger.ts uses JSON format for production', () => {
  assert(
    has(loggerFile, 'json()') || has(loggerFile, 'json'),
    "Use winston.format.json() in the production format: combine(timestamp(), json())",
  );
});

test('src/utils/logger.ts uses a Console transport', () => {
  assert(
    match(loggerFile, /transports\.Console/),
    'Add a Console transport: new winston.transports.Console()',
  );
});

test('src/middleware/error.ts imports the logger', () => {
  const importsLogger =
    has(errorHandlerFile, "from '../utils/logger") ||
    has(errorHandlerFile, 'from "../utils/logger');
  assert(
    importsLogger,
    "Import logger in src/middleware/error.ts: import { logger } from '../utils/logger.js'",
  );
});

test('src/middleware/error.ts calls logger.error', () => {
  assert(
    has(errorHandlerFile, 'logger.error'),
    'Call logger.error() at the start of the error handler to log the error message and context',
  );
});

// ============================================================
// BEHAVIORAL TESTS
// ============================================================

{
  const hints = {
    'dev startup log uses simple (human-readable) format':
      "Use combine(colorize(), simple()) when NODE_ENV !== 'production' in src/utils/logger.ts. " +
      'Expected output: info: Server started {"port":"3000","env":"development"}',
    'production startup log uses JSON format':
      "Use combine(timestamp(), json()) when NODE_ENV === 'production' in src/utils/logger.ts. " +
      'Expected output: {"level":"info","message":"Server started",...}',
    'production startup log includes a timestamp':
      'Add timestamp() to the production format: combine(timestamp(), json()). ' +
      'Expected the JSON log object to have a "timestamp" field.',
  };

  const result = checkBehavior('tests/lesson-04.behavior.js');

  if (result.tests.length === 0) {
    console.log(
      'ℹ️  Behavior Tests — could not run (is MongoDB available and the server able to start?)',
    );
    incrementNotRun();
  } else {
    const icon = result.ok ? '✅' : '❌';
    console.log(`${icon} Behavior Tests`);
    result.tests.forEach((t) => {
      const testIcon = t.passed ? '✅' : '❌';
      const hint = t.passed ? '' : ` — ${hints[t.name] ?? ''}`;
      console.log(`  ${testIcon} ${t.name}${hint}`);
      if (t.passed) incrementPass();
      else incrementFail();
    });
  }
}

// ============================================================
// SUMMARY
// ============================================================

summary('MjkxMDQ3MzM=');
