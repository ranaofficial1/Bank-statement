/**
 * Directly reproduces the exact bug from the user's screenshot: with
 * header labels left-aligned but Debit/Credit/Balance data right-
 * aligned to the SAME right edge as their column, the old left-edge
 * boundary logic shifted every value one column to the right (debit
 * appeared under Credit, credit under Balance, Balance always blank).
 *
 * Run with: node scripts/test-off-by-one-shift.js
 */
const assert = require('assert');
const { parseFromPageItems } = require('../src/extraction/GenericStatementParser');

function item(text, x, y, width) {
  return { text, x, y, width, height: 10 };
}

// Header labels are LEFT-aligned at the start of generously wide
// columns (this is what caused the shift: labels sit far to the
// left of where the right-aligned numbers beneath them actually are).
const header = [
  item('Date', 50, 900, 30),
  item('Remarks', 150, 900, 45),
  item('Debit', 400, 900, 25), // column spans roughly 400-470
  item('Credit', 480, 900, 30), // column spans roughly 480-550
  item('Balance', 560, 900, 35), // column spans roughly 560-630
];

// Every numeric value right-aligns to its column's right edge,
// regardless of the header label's left position.
function rightAlignedIn(colRightEdge, text) {
  const width = text.length * 5;
  return item(text, colRightEdge - width, 880, width);
}

// Row 1: a debit transaction, right-aligned within the Debit column
// (right edge ~470), nothing in Credit, balance right-aligned in
// Balance column (right edge ~630).
const debitRow = [
  item('19-08-2026', 50, 880, 30),
  item('Some payment', 150, 880, 40),
  rightAlignedIn(470, '469.64'),
  rightAlignedIn(630, '77,391.49'),
];

const page = [...header, ...debitRow];
const result = parseFromPageItems([page]);

assert.strictEqual(result.transactions.length, 1);
const [t] = result.transactions;

assert.strictEqual(t.debit, 469.64, 'debit value must stay in Debit, not shift into Credit');
assert.strictEqual(t.credit, null, 'Credit must be empty, not inherit the debit value');
assert.strictEqual(t.balance, 77391.49, 'Balance must be read, not left blank');
assert.strictEqual(t.needsReview, false);

console.log('Off-by-one column shift regression test passed.');
console.log(`  - debit=${t.debit}, credit=${t.credit}, balance=${t.balance}`);
