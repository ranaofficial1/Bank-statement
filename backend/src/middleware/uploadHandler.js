const multer = require('multer');
const { upload } = require('../config/multer');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

/**
 * multer's own errors (file too large, too many files, etc.) surface
 * as MulterError with a machine-readable .code rather than an
 * ApiError, so they need translating here into the same JSON error
 * shape the rest of the API uses.
 */
function uploadSingle(fieldName) {
  const handler = upload.single(fieldName);

  return (req, res, next) => {
    handler(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new ApiError(400, `File exceeds the maximum allowed size of ${env.upload.maxSizeMb} MB.`)
          );
        }
        return next(new ApiError(400, `Upload error: ${err.message}`));
      }
      if (err) {
        return next(err);
      }
      next();
    });
  };
}

module.exports = { uploadSingle };
