/**
 * Checks that each row's balance follows from an adjacent row's
 * balance plus the debit/credit that separates them. This is the
 * strongest available signal that columns were mapped correctly - a
 * systematically wrong column assignment (e.g. debit and credit
 * swapped) will fail this on nearly every row, while a handful of
 * misreads will only flag a few.
 *
 * Statements are NOT always listed oldest-first: many real bank
 * statements (confirmed against an actual user-provided statement)
 * list the newest transaction first. The two orderings need opposite
 * formulas:
 *   - ascending (oldest first):  curr.balance = prev.balance - curr.debit + curr.credit
 *   - descending (newest first): curr.balance = prev.balance + prev.debit - prev.credit
 * Guessing the wrong direction would flag nearly every row as a
 * mismatch and fail the whole conversion, so direction is detected
 * from the transactions' own parsed dates (ground truth) rather than
 * assumed.
 */

/** Uses each row's parsed date to decide whether the statement runs oldest-first or newest-first. */
function detectDirection(transactions) {
  let ascendingVotes = 0;
  let descendingVotes = 0;

  for (let i = 1; i < transactions.length; i += 1) {
    const prevDate = transactions[i - 1].txnDate;
    const currDate = transactions[i].txnDate;
    if (!prevDate || !currDate || prevDate === currDate) continue;

    if (prevDate < currDate) ascendingVotes += 1;
    else descendingVotes += 1;
  }

  return descendingVotes > ascendingVotes ? 'descending' : 'ascending';
}

function reconcileBalances(transactions, { tolerance = 0.01 } = {}) {
  const direction = detectDirection(transactions);
  const mismatches = [];

  for (let i = 1; i < transactions.length; i += 1) {
    const prev = transactions[i - 1];
    const curr = transactions[i];
    if (prev.balance == null || curr.balance == null) continue;

    const expected =
      direction === 'descending'
        ? prev.balance + (prev.debit || 0) - (prev.credit || 0)
        : prev.balance - (curr.debit || 0) + (curr.credit || 0);

    if (Math.abs(expected - curr.balance) > tolerance) {
      mismatches.push({
        index: i,
        expected: Number(expected.toFixed(2)),
        actual: curr.balance,
      });
    }
  }

  return { mismatches, direction };
}

module.exports = { reconcileBalances };
