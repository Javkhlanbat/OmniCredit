const express = require('express');
const router = express.Router();
const {
  saveEvents,
  getFunnelAnalysis,
  getDeviceBreakdown,
  getCommonErrors,
  getAnalyticsSummary
} = require('../controllers/analyticsController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

// POST /api/analytics/events - Event хадгалах (нээлттэй)
router.post('/events', saveEvents);

// GET /api/analytics/funnel - Funnel analysis (Admin)
router.get('/funnel', authenticateToken, requireAdmin, getFunnelAnalysis);

// GET /api/analytics/devices - Device breakdown (Admin)
router.get('/devices', authenticateToken, requireAdmin, getDeviceBreakdown);

// GET /api/analytics/errors - Common errors (Admin)
router.get('/errors', authenticateToken, requireAdmin, getCommonErrors);

// GET /api/analytics/summary - Analytics summary (Admin)
router.get('/summary', authenticateToken, requireAdmin, getAnalyticsSummary);

module.exports = router;
