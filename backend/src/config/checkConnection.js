const { pool, testConnection } = require('./db');
const env = require('./env');

(async () => {
  try {
    await testConnection();
    console.log(
      `✔ Connected to MySQL at ${env.db.host}:${env.db.port}, database "${env.db.database}".`
    );
    process.exitCode = 0;
  } catch (err) {
    console.error('✘ Could not connect to MySQL.');
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
