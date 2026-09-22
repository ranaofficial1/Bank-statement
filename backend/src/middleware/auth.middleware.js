const { verifyToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

/**
 * Protects a route: requires a valid JWT, either from the httpOnly
 * cookie set at login/register, or from an "Authorization: Bearer"
 * header (kept as a fallback so the API is also easy to test with
 * curl/Postman without cookie handling).
 */
function protect(req, res, next) {
  let token = req.cookies?.[env.cookie.name];

  if (!token) {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice('Bearer '.length);
    }
  }

  if (!token) {
    return next(new ApiError(401, 'Authentication required.'));
  }

  try {
    const decoded = verifyToken(token);
    req.userId = decoded.id;
    next();
  } catch (err) {
    next(new ApiError(401, 'Invalid or expired session. Please log in again.'));
  }
}

module.exports = { protect };
