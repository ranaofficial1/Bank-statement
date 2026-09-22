/**
 * Regression test for the round-5 bug, diagnosed from the user's own
 * instrumented output: every row showed debit=null, credit=null,
 * balance=<the actual debit amount> - meaning the real Balance value
 * was never present in that row's items at all. The leading
 * hypothesis: Balance (right-aligned, "tabular figure" numerals)
 * renders at a slightly different vertical baseline than the rest of
 * its row, and the old fixed yTolerance=3 in rowBuilder.js split it
 * into its own row - which then had no date, so it silently vanished
 * into the *description* of the previous row via the continuation-
 * line rule, never reaching the numeric zone.
 *
 * Two independent, complementary fixes are exercised here:
 *   1. rowBuilder's tolerance is now relative to font size, so a
 *      small baseline offset no longer splits the row at all.
 *   2. Even if a numeric value still ends up isolated on its own
 *      no-date line for any other reason, GenericStatementParser now
 *      recovers it into the previous transaction instead of losing
 *      it silently.
 *
 * Run with: node scripts/test-balance-baseline-offset.js
 */
const assert = require('assert');
const { parseFromPageItems } = require('../src/extraction/GenericStatementParser');

function item(text, x, y, width, height) {
  return { text, x, y, width, height: height ?? 10 };
}

const header = [
  item('Sr No', 40, 900, 25),
  item('Date', 90, 900, 30),
  item('Remarks', 160, 900, 45),
  item('Debit', 420, 900, 25),
  item('Credit', 500, 900, 30),
  item('Balance', 580, 900, 35),
];

// Scenario 1: Balance sits 4 units off the main row's baseline (880
// vs 884) - small enough that it must still be treated as the same
// row by the improved tolerance (item height 10 -> tolerance = 5).
const scenario1 = [
  ...header,
  item('1', 40, 880, 10),
  item('19-08-2026', 90, 880, 30),
  item('UPI/623175182058/DR/Amazon', 160, 880, 60),
  item('469.64', 420, 880, 25),
  item('\u20b9 77,391.49', 580, 884, 45), // 4-unit baseline offset
];

const result1 = parseFromPageItems([scenario1]);
assert.strictEqual(result1.transactions.length, 1);
assert.strictEqual(result1.transactions[0].debit, 469.64);
assert.strictEqual(
  result1.transactions[0].balance,
  77391.49,
  'a small baseline offset must not cause Balance to be lost'
);
assert.strictEqual(result1.transactions[0].needsReview, false);

// Scenario 2: Balance ends up on a genuinely separate row anyway
// (offset larger than any reasonable tolerance would bridge) -
// proves the backfill safety net recovers it rather than losing it
// into the previous row's description.
const scenario2 = [
  ...header,
  item('1', 40, 860, 10),
  item('19-08-2026', 90, 860, 30),
  item('UPI/623175182058/DR/Amazon', 160, 860, 60),
  item('469.64', 420, 860, 25),
  // A full separate line, well beyond any tolerance - would previously
  // have vanished into the previous row's description silently.
  item('\u20b9 77,391.49', 580, 845, 45),
];

const result2 = parseFromPageItems([scenario2]);
assert.strictEqual(result2.transactions.length, 1);
assert.strictEqual(result2.transactions[0].debit, 469.64);
assert.strictEqual(
  result2.transactions[0].balance,
  77391.49,
  'balance isolated on its own line must be recovered, not lost'
);
assert.strictEqual(result2.transactions[0].needsReview, false, 'a successfully recovered balance must not still be flagged');

console.log('Balance baseline-offset regression test passed.');
console.log(`  - scenario 1 (small offset, absorbed by tolerance): balance=${result1.transactions[0].balance}`);
console.log(`  - scenario 2 (large offset, recovered by backfill): balance=${result2.transactions[0].balance}`);
