const app = require('./app');
const env = require('./config/env');
const { testConnection } = require('./config/db');

async function start() {
  try {
    await testConnection();
    console.log(`✔ MySQL connection verified (database: "${env.db.database}").`);
  } catch (err) {
    console.warn('⚠ Could not connect to MySQL at startup:', err.message);
    console.warn('  The server will still start, but /api/health will report the database as unavailable.');
    console.warn('  Run "npm run migrate" after MySQL is reachable to create the schema.');
  }

  app.listen(env.port, () => {
    console.log(`✔ API server listening on http://localhost:${env.port}`);
    console.log(`  Environment: ${env.nodeEnv}`);
  });
}

start();
