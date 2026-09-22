/**
 * Exercises GenericStatementParser's core pipeline against hand-built
 * "page items" - the same shape pdfText.js would produce from a real
 * PDF - so the header detection, column assignment, date/amount
 * parsing, continuation-line merging, and balance reconciliation can
 * all be verified without needing pdfjs-dist installed or an actual
 * PDF file.
 *
 * Run with: node scripts/test-extraction.js
 */
const assert = require('assert');
const { parseFromPageItems } = require('../src/extraction/GenericStatementParser');

function item(text, x, y) {
  return { text, x, y, width: text.length * 5, height: 10 };
}

// --- Page 1: header + two clean transactions ---
const page1 = [
  item('Date', 50, 800),
  item('Narration', 150, 800),
  item('Withdrawal', 400, 800),
  item('Deposit', 500, 800),
  item('Balance', 600, 800),

  item('02/01/2024', 50, 780),
  item('Salary credit', 150, 780),
  item('1000.00', 500, 780),
  item('1000.00', 600, 780),

  item('03/01/2024', 50, 760),
  item('ATM withdrawal', 150, 760),
  item('200.00', 400, 760),
  item('800.00', 600, 760),
];

// --- Page 2: repeated header (should be skipped), a transaction with
// a wrapped description line, and a transaction with a deliberately
// wrong balance (should be flagged, not silently accepted) ---
const page2 = [
  item('Date', 50, 800),
  item('Narration', 150, 800),
  item('Withdrawal', 400, 800),
  item('Deposit', 500, 800),
  item('Balance', 600, 800),

  item('04/01/2024', 50, 780),
  item('Grocery store purchase', 150, 780),
  item('150.00', 400, 780),
  item('650.00', 600, 780),

  // Continuation line: no date, should merge into the row above.
  item('via UPI ref 998877', 150, 765),

  item('05/01/2024', 50, 740),
  item('Interest credit', 150, 740),
  item('50.00', 500, 740),
  item('800.00', 600, 740), // should be 700.00 - intentionally wrong
];

const result = parseFromPageItems([page1, page2]);

assert.strictEqual(result.transactions.length, 4, 'expected 4 transactions');

const [t1, t2, t3, t4] = result.transactions;

assert.strictEqual(t1.txnDate, '2024-01-02');
assert.strictEqual(t1.credit, 1000);
assert.strictEqual(t1.debit, null);
assert.strictEqual(t1.needsReview, false);

assert.strictEqual(t2.txnDate, '2024-01-03');
assert.strictEqual(t2.debit, 200);
assert.strictEqual(t2.balance, 800);
assert.strictEqual(t2.needsReview, false);

assert.strictEqual(t3.txnDate, '2024-01-04');
assert.strictEqual(t3.debit, 150);
assert.ok(
  t3.description.includes('Grocery store purchase') && t3.description.includes('via UPI ref 998877'),
  'continuation line should merge into the previous row\'s description'
);
assert.strictEqual(t3.needsReview, false);

assert.strictEqual(t4.txnDate, '2024-01-05');
assert.strictEqual(t4.credit, 50);
assert.strictEqual(t4.balance, 800);
assert.strictEqual(t4.needsReview, true, 'row 4 has a deliberately wrong balance and must be flagged');
assert.ok(/balance did not reconcile/i.test(t4.reviewReason));

assert.strictEqual(result.warnings.length, 1, 'exactly one reconciliation warning expected');
assert.strictEqual(result.reviewCount, 1);

console.log('All extraction engine tests passed.');
console.log(`  - ${result.transactions.length} transactions extracted`);
console.log(`  - ${result.reviewCount} flagged for review (expected: 1)`);
console.log(`  - ${result.warnings.length} warning(s): ${result.warnings.join(' | ')}`);
