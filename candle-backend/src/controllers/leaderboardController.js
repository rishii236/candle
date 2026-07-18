const User = require('../models/User');

/**
 * Get leaderboard rankings
 * Ranking logic:
 * 1. Primary: stats.totalPoints (DESC)
 * 2. Secondary: stats.accuracyRate (DESC)
 * 3. Tertiary: stats.totalPredictions (DESC)
 */
exports.getLeaderboard = async (req, res) => {
  try {
    // Fetch active users with at least 1 prediction
    // Sort by: totalPoints DESC, accuracyRate DESC, totalPredictions DESC
    const users = await User.find({
      isActive: true,
      'stats.totalPredictions': { $gt: 0 }
    })
    .select('username fullName avatar stats')
    .sort({
      'stats.totalPoints': -1,
      'stats.accuracyRate': -1,
      'stats.totalPredictions': -1
    })
    .limit(100) // Limit to top 100 for performance
    .lean();

    // Add rank numbers
    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      fullName: user.fullName,
      avatar: user.avatar || '',
      stats: {
        totalPoints: user.stats.totalPoints || 0,
        accuracyRate: user.stats.accuracyRate || 0,
        currentStreak: user.stats.currentStreak || 0,
        totalPredictions: user.stats.totalPredictions || 0,
        correctPredictions: user.stats.correctPredictions || 0
      }
    }));

    res.json({
      success: true,
      leaderboard,
      total: leaderboard.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error.message
    });
  }
};

/**
 * Get user's rank and position
 */
exports.getUserRank = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current user
    const currentUser = await User.findById(userId)
      .select('username fullName avatar stats')
      .lean();

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Count users with better stats (higher rank)
    const betterUsers = await User.countDocuments({
      isActive: true,
      'stats.totalPredictions': { $gt: 0 },
      $or: [
        { 'stats.totalPoints': { $gt: currentUser.stats.totalPoints } },
        {
          'stats.totalPoints': currentUser.stats.totalPoints,
          'stats.accuracyRate': { $gt: currentUser.stats.accuracyRate }
        },
        {
          'stats.totalPoints': currentUser.stats.totalPoints,
          'stats.accuracyRate': currentUser.stats.accuracyRate,
          'stats.totalPredictions': { $gt: currentUser.stats.totalPredictions }
        }
      ]
    });

    const rank = betterUsers + 1;

    res.json({
      success: true,
      rank,
      user: {
        username: currentUser.username,
        fullName: currentUser.fullName,
        avatar: currentUser.avatar || '',
        stats: currentUser.stats
      }
    });
  } catch (error) {
    console.error('User rank fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user rank',
      error: error.message
    });
  }
};