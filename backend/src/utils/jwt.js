const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * JWT helpers. Phase 1 only establishes this utility so the auth
 * system built in Phase 2 has a single, tested place to sign and
 * verify tokens. No routes use this yet.
 */

function signToken(payload) {
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
}

function verifyToken(token) {
  return jwt.verify(token, env.jwt.secret);
}

module.exports = { signToken, verifyToken };
