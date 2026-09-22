const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { uploadSingle } = require('../middleware/uploadHandler');
const {
  uploadFile,
  verifyPassword,
  getUpload,
  deleteUpload,
} = require('../controllers/uploads.controller');

const router = express.Router();

router.post('/', protect, uploadSingle('file'), uploadFile);
router.get('/:id', protect, getUpload);
router.post('/:id/verify-password', protect, verifyPassword);
router.delete('/:id', protect, deleteUpload);

module.exports = router;
