const { pool } = require('../config/db');

async function log(conversionId, level, message) {
  await pool.query(
    'INSERT INTO conversion_logs (conversion_id, level, message) VALUES (?, ?, ?)',
    [conversionId, level, message.slice(0, 1000)]
  );
}

async function findByConversion(conversionId) {
  const [rows] = await pool.query(
    'SELECT id, level, message, created_at FROM conversion_logs WHERE conversion_id = ? ORDER BY id ASC',
    [conversionId]
  );
  return rows;
}

module.exports = { log, findByConversion };
