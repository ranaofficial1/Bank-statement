const mysql = require('mysql2/promise');
const env = require('./env');

/**
 * Shared MySQL connection pool. Import `pool` anywhere a query is
 * needed instead of creating new connections ad-hoc.
 */
const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: env.db.connectionLimit,
  queueLimit: 0,
  dateStrings: true,
});

/**
 * Verifies the pool can actually reach MySQL. Used at server startup
 * and by the standalone db:check script.
 */
async function testConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.query('SELECT 1');
    return true;
  } finally {
    connection.release();
  }
}

module.exports = { pool, testConnection };
