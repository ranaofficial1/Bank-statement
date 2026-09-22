const { pool } = require('../config/db');

const SELECT_FIELDS = `
  id, user_id, uploaded_file_id, bank_id, status, transaction_count,
  error_message, started_at, completed_at, created_at, updated_at
`;

async function create({ userId, uploadedFileId, bankId }) {
  const [result] = await pool.query(
    `INSERT INTO conversions (user_id, uploaded_file_id, bank_id, status, started_at)
     VALUES (?, ?, ?, 'processing', NOW())`,
    [userId, uploadedFileId, bankId || null]
  );
  return findById(result.insertId);
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT ${SELECT_FIELDS} FROM conversions WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function findByIdForUser(id, userId) {
  const conversion = await findById(id);
  if (!conversion || Number(conversion.user_id) !== Number(userId)) {
    return null;
  }
  return conversion;
}

async function findAllForUser(userId) {
  const [rows] = await pool.query(
    `SELECT ${SELECT_FIELDS} FROM conversions WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

async function markCompleted(id, transactionCount) {
  await pool.query(
    `UPDATE conversions
     SET status = 'completed', transaction_count = ?, completed_at = NOW()
     WHERE id = ?`,
    [transactionCount, id]
  );
  return findById(id);
}

async function markFailed(id, errorMessage) {
  await pool.query(
    `UPDATE conversions
     SET status = 'failed', error_message = ?, completed_at = NOW()
     WHERE id = ?`,
    [errorMessage, id]
  );
  return findById(id);
}

module.exports = { create, findById, findByIdForUser, findAllForUser, markCompleted, markFailed };
