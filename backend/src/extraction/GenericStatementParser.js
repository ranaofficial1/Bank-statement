const BaseParser = require('../parsers/BaseParser');
const { extractPagesText } = require('./pdfText');
const { buildRows } = require('./rowBuilder');
const { detectHeader, isLikelyHeaderRow, buildColumns } = require('./headerDetector');
const { parseDate, toSqlDate, parseAmount } = require('./valueParsers');
const { reconcileBalances } = require('./validate');
const { centerX, mergeSymbolsIntoAmounts } = require('./geometry');

/** Above this fraction of flagged rows, the whole conversion is treated as unreliable. */
const MAX_REVIEW_RATIO = 0.3;

const NUMERIC_FIELDS = ['debit', 'credit', 'balance'];

/** Assigns each text item in a row to a (non-numeric) column by its horizontal center. */
function assignRowToColumns(items, columns) {
  const cells = {};
  for (const item of items) {
    const x = centerX(item);
    const col = columns.find((c) => x >= c.xStart && x < c.xEnd);
    if (!col) continue;
    cells[col.field] = cells[col.field] ? `${cells[col.field]} ${item.text}` : item.text;
  }
  return cells;
}

/**
 * Splits debit/credit/balance out of a row using structure, not raw
 * x-boundaries.
 *
 * Why: Debit, Credit and Balance are narrow, closely-spaced,
 * right-aligned numeric columns, while their headers are commonly
 * left-aligned - so a value's x position drifts with its own digit
 * count and can easily cross into the next column's boundary. That
 * produced a uniform "off by one column" failure on a real statement
 * (debit values landing under Credit, credit under Balance, Balance
 * always empty).
 *
 * Instead, this uses what's structurally true for every bank's
 * statement: Balance is always the rightmost value on the row, and
 * Debit/Credit are mutually exclusive (never both populated). Items
 * are first turned into cells via mergeSymbolsIntoAmounts, which only
 * ever merges a stray currency symbol into its adjacent number and
 * never merges two real amounts together (see geometry.js for why
 * that distinction matters); then the rightmost cell is Balance, and
 * whatever's left (0, 1, or 2 cells) is the debit-or-credit amount,
 * using the debit/credit header positions only as a coarse
 * left-vs-right tiebreak when exactly one amount cell remains
 * ambiguous.
 */
function splitNumericZone(items, { numericZoneStartX, debitAnchorX, creditAnchorX, singleClusterIsBalance = false }) {
  const numericItems = items.filter((item) => centerX(item) >= numericZoneStartX);
  const clusters = mergeSymbolsIntoAmounts(numericItems);

  if (clusters.length === 0) {
    return { debitText: null, creditText: null, balanceText: null };
  }

  function classifyAsDebitOrCredit(cell) {
    let isDebit = true;
    if (debitAnchorX != null && creditAnchorX != null) {
      isDebit = Math.abs(cell.x - debitAnchorX) <= Math.abs(cell.x - creditAnchorX);
    } else if (creditAnchorX != null && debitAnchorX == null) {
      isDebit = false;
    }
    return isDebit;
  }

  if (clusters.length === 1) {
    const cell = clusters[0];

    // The caller says which interpretation fits this line. A
    // no-date continuation line recovering a value for the row above
    // it (singleClusterIsBalance: true) is almost always recovering
    // a separated Balance. A normal dated transaction row with only
    // one numeric value, on the other hand, is far more likely to be
    // missing its OTHER value (commonly Balance, which can render at
    // a different baseline than the rest of the row - see
    // rowBuilder.js) than to have found a stray balance with no
    // amount at all - so it's read as the amount here, leaving
    // balance to be backfilled separately if it turns up.
    if (singleClusterIsBalance) {
      return { debitText: null, creditText: null, balanceText: cell.text };
    }
    return classifyAsDebitOrCredit(cell)
      ? { debitText: cell.text, creditText: null, balanceText: null }
      : { debitText: null, creditText: cell.text, balanceText: null };
  }

  // Two or more values: comparing positions against each other is
  // reliable, so the original rule applies - rightmost is Balance.
  const balanceText = clusters[clusters.length - 1].text;
  const rest = clusters.slice(0, -1);

  if (rest.length === 1) {
    const cell = rest[0];
    return classifyAsDebitOrCredit(cell)
      ? { debitText: cell.text, creditText: null, balanceText }
      : { debitText: null, creditText: cell.text, balanceText };
  }

  // Rare: both debit and credit genuinely present on the same line
  // (e.g. a same-day reversal) - leftmost is debit, next is credit,
  // consistent with standard column order.
  return { debitText: rest[0].text, creditText: rest[1].text, balanceText };
}

const DEBUG = process.env.DEBUG_EXTRACTION === '1';
let debugRowsLogged = 0;
const DEBUG_ROW_LIMIT = 5;

/**
 * Runs the full header-detect -> column-assign -> normalize ->
 * validate pipeline against already-extracted page items. Kept
 * separate from parse() so it can be exercised in tests with
 * synthetic item arrays, with no PDF file or pdfjs involved.
 */
function parseFromPageItems(pagesOfItems) {
  debugRowsLogged = 0;

  const allRows = [];
  pagesOfItems.forEach((items) => {
    buildRows(items).forEach((row) => allRows.push(row));
  });

  const header = detectHeader(allRows);
  if (!header) {
    throw new Error(
      'Could not detect a transaction table in this statement. The generic parser looks for a header row with a date column and at least one amount column (debit, credit, or balance).'
    );
  }

  const columns = buildColumns(header.row);
  const textColumns = columns.filter((c) => !NUMERIC_FIELDS.includes(c.field));
  const numericColumns = columns.filter((c) => NUMERIC_FIELDS.includes(c.field));

  if (numericColumns.length === 0) {
    throw new Error(
      'A header row was found, but it has no recognizable debit, credit, or balance column.'
    );
  }

  const numericZoneStartX = Math.min(...numericColumns.map((c) => c.xStart));
  const debitHeaderItem = header.row.items.find((i) => {
    const col = columns.find((c) => c.field === 'debit');
    return col && centerX(i) >= col.xStart && centerX(i) < col.xEnd;
  });
  const creditHeaderItem = header.row.items.find((i) => {
    const col = columns.find((c) => c.field === 'credit');
    return col && centerX(i) >= col.xStart && centerX(i) < col.xEnd;
  });
  const debitAnchorX = debitHeaderItem ? centerX(debitHeaderItem) : null;
  const creditAnchorX = creditHeaderItem ? centerX(creditHeaderItem) : null;
  const hasBalanceColumn = columns.some((c) => c.field === 'balance');

  if (DEBUG) {
    console.error('[extraction-debug] columns:', columns);
    console.error('[extraction-debug] numericZoneStartX:', numericZoneStartX, 'debitAnchorX:', debitAnchorX, 'creditAnchorX:', creditAnchorX);
  }

  const bodyRows = allRows.slice(header.rowIndex + 1);
  const transactions = [];
  const warnings = [];

  for (const row of bodyRows) {
    if (isLikelyHeaderRow(row).isHeader) continue; // repeated header on a later page

    const textZoneItems = row.items.filter((item) => centerX(item) < numericZoneStartX);
    const cells = assignRowToColumns(textZoneItems, textColumns);
    const parsedDate = cells.date ? parseDate(cells.date) : null;

    if (DEBUG && debugRowsLogged < DEBUG_ROW_LIMIT) {
      const numericItemsDebug = row.items.filter((item) => centerX(item) >= numericZoneStartX);
      console.error('[extraction-debug] row.items:', row.items);
      console.error('[extraction-debug] parsedDate:', parsedDate, 'cells:', cells);
      console.error('[extraction-debug] numericItems (>= numericZoneStartX):', numericItemsDebug);
      console.error('[extraction-debug] mergeSymbolsIntoAmounts result:', mergeSymbolsIntoAmounts(numericItemsDebug));
      debugRowsLogged += 1;
    }

    if (!parsedDate) {
      // No parseable date on this line - most likely a wrapped
      // continuation of the previous row's description rather than a
      // new transaction, so fold it in instead of inventing a row.
      //
      // Defense in depth: if a numeric value (most plausibly Balance,
      // which can render at a slightly different baseline than the
      // rest of its row - see rowBuilder.js) ends up isolated on its
      // own line like this despite the tolerance handling there, it
      // is still recovered here rather than silently disappearing -
      // it almost certainly belongs to the transaction directly
      // above it, never a brand new one (this line has no date).
      if (transactions.length > 0) {
        const last = transactions[transactions.length - 1];

        if (cells.description) {
          last.description = `${last.description} ${cells.description}`.trim();
        }

        const recovered = splitNumericZone(row.items, {
          numericZoneStartX,
          debitAnchorX,
          creditAnchorX,
          singleClusterIsBalance: true,
        });

        if (last.balance == null && recovered.balanceText) {
          const recoveredBalance = parseAmount(recovered.balanceText);
          if (recoveredBalance != null) last.balance = recoveredBalance;
        }
        if (last.debit == null && last.credit == null) {
          if (recovered.debitText) {
            const recoveredDebit = parseAmount(recovered.debitText);
            if (recoveredDebit != null) last.debit = recoveredDebit;
          } else if (recovered.creditText) {
            const recoveredCredit = parseAmount(recovered.creditText);
            if (recoveredCredit != null) last.credit = recoveredCredit;
          }
        }
      }
      continue;
    }

    const { debitText, creditText, balanceText } = splitNumericZone(row.items, {
      numericZoneStartX,
      debitAnchorX,
      creditAnchorX,
    });

    const debit = debitText ? parseAmount(debitText) : null;
    const credit = creditText ? parseAmount(creditText) : null;
    const balance = balanceText ? parseAmount(balanceText) : null;

    // needsReview/reviewReason are computed in one pass AFTER the
    // whole loop (see below) - not here - because a later no-date
    // continuation line can still backfill this row's debit/credit/
    // balance, and flags set at push time would otherwise go stale.
    transactions.push({
      txnDate: toSqlDate(parsedDate),
      description: cells.description || '',
      debit: debit || null,
      credit: credit || null,
      balance,
      referenceNumber: cells.reference || null,
      rawRowText: row.text,
      rowOrder: transactions.length,
      needsReview: false,
      reviewReason: null,
    });
  }

  if (transactions.length === 0) {
    throw new Error(
      'A statement table header was found, but no transaction rows could be read beneath it.'
    );
  }

  // Single pass, after all continuation-line backfilling is done.
  transactions.forEach((txn) => {
    const reasons = [];
    if (txn.debit === null && txn.credit === null) {
      reasons.push('No debit or credit amount could be read for this row.');
    } else if (txn.debit && txn.credit) {
      reasons.push('Both debit and credit were non-zero for this row.');
    }
    if (hasBalanceColumn && txn.balance === null) {
      reasons.push('Balance column is present in this statement but could not be read for this row.');
    }
    txn.needsReview = reasons.length > 0;
    txn.reviewReason = reasons.length > 0 ? reasons.join(' ') : null;
  });

  const { mismatches } = reconcileBalances(transactions);
  mismatches.forEach(({ index, expected, actual }) => {
    const txn = transactions[index];
    txn.needsReview = true;
    const note = `Balance did not reconcile (expected ~${expected}, statement shows ${actual}).`;
    txn.reviewReason = txn.reviewReason ? `${txn.reviewReason} ${note}` : note;
    warnings.push(`Row ${index + 1}: ${note}`);
  });

  const reviewCount = transactions.filter((t) => t.needsReview).length;
  const reviewRatio = reviewCount / transactions.length;

  if (reviewRatio > MAX_REVIEW_RATIO) {
    throw new Error(
      `Extraction confidence is too low to trust: ${reviewCount} of ${transactions.length} rows failed validation. This statement's layout may not be supported yet.`
    );
  }

  return { transactions, warnings, reviewCount };
}

class GenericStatementParser extends BaseParser {
  async parse(pdfBuffer, options = {}) {
    const pages = await extractPagesText(pdfBuffer, options.password);
    return parseFromPageItems(pages);
  }
}

module.exports = GenericStatementParser;
module.exports.parseFromPageItems = parseFromPageItems;
