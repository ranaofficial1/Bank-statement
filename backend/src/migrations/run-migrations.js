const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const env = require('../config/env');

const MIGRATIONS_DIR = __dirname;

/**
 * Ensures the schema_migrations bookkeeping table exists, then applies
 * every .sql file in this directory that has not been applied yet,
 * in filename order (001_, 002_, ...). Safe to run repeatedly.
 */
async function runMigrations() {
  const connection = await pool.getConnection();

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const [appliedRows] = await connection.query(
      'SELECT filename FROM schema_migrations'
    );
    const applied = new Set(appliedRows.map((row) => row.filename));

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('No .sql migration files found.');
      return;
    }

    let appliedCount = 0;

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`- Skipping already-applied migration: ${file}`);
        continue;
      }

      const fullPath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(fullPath, 'utf8');

      console.log(`- Applying migration: ${file}`);
      // mysql2 supports multiple statements only when explicitly enabled;
      // each migration file here is a single CREATE TABLE statement,
      // so a plain query() call is sufficient and keeps intent explicit.
      await connection.query(sql);
      await connection.query(
        'INSERT INTO schema_migrations (filename) VALUES (?)',
        [file]
      );
      appliedCount += 1;
    }

    if (appliedCount === 0) {
      console.log('Database already up to date. No migrations applied.');
    } else {
      console.log(`Applied ${appliedCount} migration(s) successfully.`);
    }
  } finally {
    connection.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log(`Migration run complete against database "${env.db.database}".`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err.message);
      process.exit(1);
    })
    .finally(() => {
      pool.end().catch(() => {});
    });
}

module.exports = { runMigrations };
