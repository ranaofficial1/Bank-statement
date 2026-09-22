/**
 * Verifies the password cache's set/get/clear/TTL behavior in
 * isolation - this is the piece that closes the gap between
 * "password verified" and "extraction can actually use it".
 *
 * Run with: node scripts/test-password-cache.js
 */
const assert = require('assert');
const passwordCache = require('../src/utils/passwordCache');

// Fresh id per assertion group to avoid cross-test interference.
passwordCache.set(101, 'correct-horse');
assert.strictEqual(passwordCache.get(101), 'correct-horse', 'should return the cached password');

passwordCache.clear(101);
assert.strictEqual(passwordCache.get(101), null, 'should be gone after clear()');

assert.strictEqual(passwordCache.get(999), null, 'unknown id should return null, not throw');

// TTL expiry: fake an entry that already expired by monkey-patching
// Date.now for this one check, then restoring it.
passwordCache.set(202, 'temp-pass');
const realNow = Date.now;
Date.now = () => realNow() + 31 * 60 * 1000; // 31 minutes later
assert.strictEqual(passwordCache.get(202), null, 'entry should expire after the 30 minute TTL');
Date.now = realNow;

console.log('All password cache tests passed.');
