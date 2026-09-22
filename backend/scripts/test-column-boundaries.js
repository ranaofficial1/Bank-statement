/**
 * Verifies numeric-zone splitting (splitNumericZone in
 * GenericStatementParser.js) correctly assigns debit/credit/balance
 * regardless of a number's digit count - the mechanism behind
 * "balance only shows for a few rows" on a real statement, where
 * Credit and Balance are narrow, closely-spaced, right-aligned
 * columns and a wider number can drift across a fixed x-boundary.
 *
 * Each scenario is a single-row statement (no second row), so this
 * isolates column assignment from balance reconciliation, which is
 * already covered by other tests.
 *
 * Run with: node scripts/test-column-boundaries.js
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
  item('Credit', 500, 900, 30), // spans 500-530
  item('Balance', 540, 900, 35), // spans 540-575
];

function rightAligned(rightEdge, width) {
  return rightEdge - width;
}

function runSingleRowScenario(balanceText, balanceWidth) {
  const rightEdge = 600;
  const x = rightAligned(rightEdge, balanceWidth);
  const page = [
    ...header,
    item('19-08-2026', 50, 880, 30),
    item('Payment', 150, 880, 40),
    item('100.00', 400, 880, 20),
    item(balanceText, x, 880, balanceWidth),
  ];
  return parseFromPageItems([page]).transactions[0];
}

const narrow = runSingleRowScenario('77,391.49', 45);
assert.strictEqual(narrow.balance, 77391.49, 'narrow balance should read correctly');
assert.strictEqual(narrow.debit, 100);
assert.strictEqual(narrow.credit, null, 'narrow balance must not leak into Credit');
assert.strictEqual(narrow.needsReview, false);

// Deliberately wide (worst-case) value - its left edge would fall
// well before the old, left-edge-based Credit/Balance boundary.
const wide = runSingleRowScenario('1,28,88,883.73', 85);
assert.strictEqual(wide.balance, 12888883.73, 'wide balance must still land in Balance, not Credit or nowhere');
assert.strictEqual(wide.debit, 100);
assert.strictEqual(wide.credit, null, 'wide balance must not leak into Credit');
assert.strictEqual(wide.needsReview, false);

console.log('Column boundary (structural split) regression test passed.');
console.log(`  - narrow balance: ${narrow.balance}`);
console.log(`  - wide balance: ${wide.balance} (correctly stayed out of Credit)`);
