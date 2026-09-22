const { testConnection } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/health
 * Confirms the API process is up and, separately, whether it can
 * currently reach MySQL. Used by the frontend to display connection
 * status and by developers to sanity-check a fresh setup.
 */
const getHealth = asyncHandler(async (req, res) => {
  let dbConnected = false;
  let dbError = null;

  try {
    await testConnection();
    dbConnected = true;
  } catch (err) {
    dbError = err.message;
  }

  res.status(200).json({
    success: true,
    api: 'ok',
    database: dbConnected ? 'connected' : 'unavailable',
    databaseError: dbConnected ? undefined : dbError,
    timestamp: new Date().toISOString(),
  });
});

module.exports = { getHealth };
