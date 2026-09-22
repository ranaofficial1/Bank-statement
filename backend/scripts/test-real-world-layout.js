/**
 * Regression test for two bugs found against a real user-provided
 * Bank of India statement:
 *
 *   1. An unmatched leading "Sr No" column caused its values to be
 *      absorbed into the "Date" column (the nearest matched column's
 *      left boundary defaulted to -Infinity), breaking every date
 *      parse and producing "no transaction rows could be read".
 *   2. The statement lists transactions newest-first (descending
 *      dates), but reconciliation assumed oldest-first, which would
 *      have flagged nearly every row as a mismatch and hard-failed
 *      the whole conversion on confidence grounds.
 *
 * Uses the real statement's actual first 6 rows (dates, narrations,
 * amounts, balances) as fixture data.
 *
 * Run with: node scripts/test-real-world-layout.js
 */
const assert = require('assert');
const { parseFromPageItems } = require('../src/extraction/GenericStatementParser');

function item(text, x, y) {
  return { text, x, y, width: text.length * 5, height: 10 };
}

const SR_NO_X = 40;
const DATE_X = 90;
const REMARKS_X = 160;
const DEBIT_X = 420;
const CREDIT_X = 500;
const BALANCE_X = 580;

const header = [
  item('Sr No', SR_NO_X, 900),
  item('Date', DATE_X, 900),
  item('Remarks', REMARKS_X, 900),
  item('Debit', DEBIT_X, 900),
  item('Credit', CREDIT_X, 900),
  item('Balance', BALANCE_X, 900),
];

// Real data from the user's Bank of India statement, rows 1-6
// (newest first). Row 1 also has a wrapped continuation line, like
// the real PDF's "amazonp" / "ay/Reques" split.
const rows = [
  { y: 880, sr: '1', date: '19-08-2026', remarks: 'UPI/623175182058/DR/Amazon/RATN/amazonp', cont: 'ay/Reques', debit: '469.64', credit: '', balance: '77,391.49' },
  { y: 850, sr: '2', date: '19-08-2026', remarks: 'UPI/659720324816/DR/CREDC/UTIB/cred.club/paymen', cont: null, debit: '369.00', credit: '', balance: '77,861.13' },
  { y: 820, sr: '3', date: '18-08-2026', remarks: 'CWDR//4247/42510503', cont: null, debit: '1500.00', credit: '', balance: '78,230.13' },
  { y: 790, sr: '4', date: '18-08-2026', remarks: 'CWDR//4246/42510503', cont: null, debit: '1500.00', credit: '', balance: '79,730.13' },
  { y: 760, sr: '5', date: '18-08-2026', remarks: 'UPI/623016467660/DR/BITTU/CNRB/bhagatbit/Auto f', cont: null, debit: '400.00', credit: '', balance: '81,230.13' },
  { y: 730, sr: '6', date: '17-08-2026', remarks: 'UPI/213441708458/CR/RANAA/KKBK/735269205/Flipka', cont: null, debit: '', credit: '288.00', balance: '81,630.13' },
];

const page = [...header];
rows.forEach((r) => {
  page.push(item(r.sr, SR_NO_X, r.y));
  page.push(item(r.date, DATE_X, r.y));
  page.push(item(r.remarks, REMARKS_X, r.y));
  if (r.debit) page.push(item(r.debit, DEBIT_X, r.y));
  if (r.credit) page.push(item(r.credit, CREDIT_X, r.y));
  page.push(item(`\u20b9 ${r.balance}`, BALANCE_X, r.y));
  if (r.cont) page.push(item(r.cont, REMARKS_X, r.y - 15));
});

const result = parseFromPageItems([page]);

assert.strictEqual(result.transactions.length, 6, 'expected 6 transactions');

const [t1, t2, t3, t4, t5, t6] = result.transactions;

assert.strictEqual(t1.txnDate, '2026-08-19');
assert.strictEqual(t1.debit, 469.64);
assert.strictEqual(t1.balance, 77391.49);
assert.ok(
  t1.description.includes('amazonp') && t1.description.includes('ay/Reques'),
  'wrapped continuation line should merge into row 1\'s description'
);

assert.strictEqual(t2.debit, 369);
assert.strictEqual(t2.balance, 77861.13);

assert.strictEqual(t6.credit, 288);
assert.strictEqual(t6.balance, 81630.13);

for (const t of result.transactions) {
  assert.strictEqual(
    t.needsReview,
    false,
    `row dated ${t.txnDate} should not be flagged - all 6 rows reconcile exactly in this fixture (reason: ${t.reviewReason})`
  );
}

assert.strictEqual(result.warnings.length, 0, 'no reconciliation warnings expected');

console.log('All real-world-layout regression tests passed.');
console.log(`  - ${result.transactions.length} transactions extracted, 0 flagged`);
console.log('  - Sr No column no longer bleeds into Date');
console.log('  - descending (newest-first) statement order correctly reconciled');
