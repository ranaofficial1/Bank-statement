/**
 * Regression test for a bug found while re-testing against a real
 * statement: an earlier fix merged numeric-zone text items using a
 * fixed gap threshold, which correctly reconstructed a symbol+number
 * split into two PDF runs, but ALSO incorrectly merged two genuinely
 * separate values (Debit and Balance) whenever a real table happened
 * to space them only a few units apart - producing an unparseable
 * blob like "469.64 77,391.49" and destroying both values. Since real
 * statements plausibly space columns this tightly throughout, this
 * caused every single row to fail ("N of N rows failed validation").
 *
 * The fix only ever merges a digit-less symbol into its adjacent
 * number - never two numbers together, however close they are.
 *
 * Run with: node scripts/test-tight-spacing.js
 */
const assert = require('assert');
const { parseFromPageItems } = require('../src/extraction/GenericStatementParser');

function item(text, x, y, width) {
  return { text, x, y, width, height: 10 };
}

const header = [
  item('Date', 50, 900, 30),
  item('Remarks', 150, 900, 45),
  item('Debit', 400, 900, 25),
  item('Credit', 440, 900, 30),
  item('Balance', 480, 900, 35),
];

// Debit's right edge is 425; Balance starts at 430 - only a 5-unit
// gap, well inside what the old fixed-threshold merge would have
// treated as "the same cell".
const page = [
  ...header,
  item('19-08-2026', 50, 880, 30),
  item('Payment', 150, 880, 40),
  item('469.64', 400, 880, 25),
  item('77,391.49', 430, 880, 45),
];

const result = parseFromPageItems([page]);
assert.strictEqual(result.transactions.length, 1);
const [t] = result.transactions;

assert.strictEqual(t.debit, 469.64, 'debit must stay a separate, correctly-parsed value');
assert.strictEqual(t.balance, 77391.49, 'balance must stay a separate, correctly-parsed value');
assert.strictEqual(t.credit, null);
assert.strictEqual(t.needsReview, false, `row should not be flagged (reason: ${t.reviewReason})`);

// Separately: a currency symbol AS ITS OWN PDF text item, right next
// to its number, must still merge correctly (the one case merging
// should still handle).
const page2 = [
  ...header,
  item('19-08-2026', 50, 880, 30),
  item('Payment', 150, 880, 40),
  item('469.64', 400, 880, 25),
  item('\u20b9', 428, 880, 8),
  item('77,391.49', 438, 880, 45),
];
const result2 = parseFromPageItems([page2]);
assert.strictEqual(result2.transactions[0].balance, 77391.49, 'symbol + number must still merge into one value');

console.log('Tight-spacing regression test passed.');
console.log(`  - debit=${t.debit}, balance=${t.balance} (kept separate despite a 5-unit gap)`);
console.log(`  - symbol+number still merges: balance=${result2.transactions[0].balance}`);
