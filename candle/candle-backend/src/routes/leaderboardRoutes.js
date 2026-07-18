const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const authenticateToken = require('../middleware/auth');

/**
 * @route   GET /api/leaderboard
 * @desc    Get top users leaderboard
 * @access  Public (no auth required)
 */
router.get('/', leaderboardController.getLeaderboard);

/**
 * @route   GET /api/leaderboard/my-rank
 * @desc    Get current user's rank and position
 * @access  Private (requires authentication)
 */
router.get('/my-rank', authenticateToken, leaderboardController.getUserRank);

module.exports = router;