// Run via tsx from the project root — used by lesson-07.js behavioral test.
import { getCacheValue, setCacheValue } from '../src/utils/cache.js';

// A 1ms TTL should expire after a brief delay.
setCacheValue('ttl-test', 'hello', 1);
await new Promise((r) => setTimeout(r, 10));
if (getCacheValue('ttl-test') !== null) {
  process.stderr.write('value with 1ms TTL should have expired but was still returned\n');
  process.exit(1);
}

// A long TTL should still be available immediately after being set.
setCacheValue('default-test', 'hello');
if (getCacheValue('default-test') !== 'hello') {
  process.stderr.write('value should be available immediately after setCacheValue\n');
  process.exit(1);
}

process.exit(0);
