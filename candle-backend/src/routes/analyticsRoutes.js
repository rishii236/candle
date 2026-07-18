const express = require('express');
const router = express.Router();
const { getAnalyticsOverview } = require('../controllers/analyticsController');
const authenticateToken = require('../middleware/auth');

/**
 * @route   GET /api/analytics/overview
 * @desc    Get comprehensive analytics for authenticated user
 * @access  Private (requires authentication)
 */
router.get('/overview', authenticateToken, getAnalyticsOverview);

module.exports = router;