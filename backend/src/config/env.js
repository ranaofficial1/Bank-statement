require('dotenv').config();

/**
 * Centralized, validated access to environment variables.
 * Every other module should read config from here instead of
 * touching process.env directly, so defaults and validation
 * live in exactly one place.
 */

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === null || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalNumber(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const num = Number(raw);
  if (Number.isNaN(num)) {
    throw new Error(`Environment variable ${name} must be a number, got "${raw}"`);
  }
  return num;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: optionalNumber('PORT', 5001),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  db: {
    host: required('DB_HOST', '127.0.0.1'),
    port: optionalNumber('DB_PORT', 3306),
    user: required('DB_USER', 'root'),
    password: process.env.DB_PASSWORD ?? '',
    database: required('DB_NAME', 'bank_statement_converter'),
    connectionLimit: optionalNumber('DB_CONNECTION_LIMIT', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev_only_insecure_secret_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  cookie: {
    name: 'token',
    maxAgeMs: optionalNumber('COOKIE_MAX_AGE_DAYS', 7) * 24 * 60 * 60 * 1000,
  },

  upload: {
    tempDir: process.env.UPLOAD_TEMP_DIR || './tmp/uploads',
    maxSizeMb: optionalNumber('MAX_UPLOAD_SIZE_MB', 15),
  },

  isProduction: (process.env.NODE_ENV || 'development') === 'production',
};

if (env.isProduction && env.jwt.secret === 'dev_only_insecure_secret_change_me') {
  throw new Error('JWT_SECRET must be set to a strong secret in production.');
}

module.exports = env;
