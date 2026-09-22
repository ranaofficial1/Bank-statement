const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const {
  startConversion,
  listConversions,
  getConversion,
} = require('../controllers/conversions.controller');

const router = express.Router();

router.post('/', protect, startConversion);
router.get('/', protect, listConversions);
router.get('/:id', protect, getConversion);

module.exports = router;
