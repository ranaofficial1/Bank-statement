const express = require('express');
const { listBanks } = require('../controllers/bank.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', protect, listBanks);

module.exports = router;
