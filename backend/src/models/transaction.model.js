const { pool } = require('../config/db');

/**
 * Bulk-inserts normalized transactions for a conversion in a single
 * query. `transactions` must already be in the canonical shape
 * produced by any parser (see extraction/GenericStatementParser.js).
 */
async function bulkCreate(conversionId, transactions) {
  if (transactions.length === 0) return;

  const values = transactions.map((t) => [
    conversionId,
    t.txnDate,
    t.description,
    t.debit,
    t.credit,
    t.balance,
    t.referenceNumber,
    t.debit != null ? 'debit' : t.credit != null ? 'credit' : 'unknown',
    t.rawRowText,
    t.rowOrder,
    t.needsReview ? 1 : 0,
    t.reviewReason,
  ]);

  await pool.query(
    `INSERT INTO transactions
       (conversion_id, txn_date, description, debit, credit, balance,
        reference_number, txn_type, raw_row_text, row_order,
        needs_review, review_reason)
     VALUES ?`,
    [values]
  );
}

async function findByConversion(conversionId) {
  const [rows] = await pool.query(
    `SELECT id, txn_date, description, debit, credit, balance, reference_number,
            txn_type, needs_review, review_reason, row_order
     FROM transactions
     WHERE conversion_id = ?
     ORDER BY row_order ASC`,
    [conversionId]
  );
  return rows;
}

module.exports = { bulkCreate, findByConversion };
