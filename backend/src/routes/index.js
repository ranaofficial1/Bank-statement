const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const bankRoutes = require('./bank.routes');
const uploadsRoutes = require('./uploads.routes');
const conversionsRoutes = require('./conversions.routes');

const router = express.Router();

// Phase 5+ will mount /transactions (edit endpoints) and /exports here.
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/banks', bankRoutes);
router.use('/uploads', uploadsRoutes);
router.use('/conversions', conversionsRoutes);

module.exports = router;
