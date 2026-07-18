const Prediction = require('../models/Prediction');
const User = require('../models/User');

/**
 * Get comprehensive analytics overview for the authenticated user
 * @route GET /api/analytics/overview
 * @access Private
 */
exports.getAnalyticsOverview = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch all predictions for the user
    const predictions = await Prediction.find({ userId }).lean();

    if (predictions.length === 0) {
      return res.json({
        success: true,
        hasData: false,
        message: 'No predictions found. Start making predictions to see analytics!'
      });
    }

    // ============================================
    // 1. SUMMARY STATS
    // ============================================
    const totalPredictions = predictions.length;
    const evaluatedPredictions = predictions.filter(p => p.status === 'evaluated');
    const pendingPredictions = predictions.filter(p => p.status === 'pending');
    const lockedPredictions = predictions.filter(p => p.status === 'locked');

    // For EVENT predictions: check actualResult
    // For TIME_WINDOW and TARGET: check isCorrect
    const correctPredictions = evaluatedPredictions.filter(p => {
      if (p.predictionType === 'EVENT') {
        // EVENT: Check if actualResult matches prediction
        return p.actualResult && p.eventPrediction && p.actualResult === p.eventPrediction;
      } else {
        // TIME_WINDOW and TARGET: Use isCorrect field
        return p.isCorrect === true;
      }
    }).length;

    const wrongPredictions = evaluatedPredictions.length - correctPredictions;
    const accuracy = evaluatedPredictions.length > 0 
      ? ((correctPredictions / evaluatedPredictions.length) * 100).toFixed(1)
      : 0;

    // ============================================
    // 2. PREDICTION TYPE BREAKDOWN (Beat/Meet/Miss)
    // ============================================
    const byPredictionType = {
      Beat: { total: 0, correct: 0, wrong: 0, pending: 0 },
      Meet: { total: 0, correct: 0, wrong: 0, pending: 0 },
      Miss: { total: 0, correct: 0, wrong: 0, pending: 0 }
    };

    predictions.forEach(p => {
      if (p.status === 'evaluated' && p.actualResult) {
        // All evaluated predictions have actualResult (Beat/Meet/Miss)
        byPredictionType[p.actualResult].total++;

        const isCorrect = p.predictionType === 'EVENT'
          ? p.actualResult === p.eventPrediction
          : p.isCorrect === true;

        if (isCorrect) {
          byPredictionType[p.actualResult].correct++;
        } else {
          byPredictionType[p.actualResult].wrong++;
        }
      } else if (p.status !== 'evaluated' && p.predictionType === 'EVENT' && p.eventPrediction) {
        // Pending/locked EVENT predictions: count under their chosen prediction
        byPredictionType[p.eventPrediction].total++;
        byPredictionType[p.eventPrediction].pending++;
      }
    });

    // ============================================
    // 3. CONFIDENCE LEVEL BREAKDOWN
    // ============================================
    const byConfidence = {};
    for (let i = 1; i <= 5; i++) {
      byConfidence[i] = { total: 0, correct: 0, wrong: 0, accuracy: 0 };
    }

    predictions.forEach(p => {
      const conf = p.confidence || 3;
      byConfidence[conf].total++;

      if (p.status === 'evaluated') {
        let isCorrect = false;
        if (p.predictionType === 'EVENT') {
          isCorrect = p.actualResult === p.eventPrediction;
        } else {
          isCorrect = p.isCorrect === true;
        }

        if (isCorrect) {
          byConfidence[conf].correct++;
        } else {
          byConfidence[conf].wrong++;
        }
      }
    });

    // Calculate accuracy for each confidence level
    Object.keys(byConfidence).forEach(conf => {
      const evaluated = byConfidence[conf].correct + byConfidence[conf].wrong;
      if (evaluated > 0) {
        byConfidence[conf].accuracy = ((byConfidence[conf].correct / evaluated) * 100).toFixed(1);
      }
    });

    // ============================================
    // 4. POINTS ANALYTICS
    // ============================================
    const allPoints = predictions.map(p => p.points || 0);
    const earnedPoints = allPoints.filter(p => p > 0);
    const lostPoints = allPoints.filter(p => p < 0);

    const totalEarned = earnedPoints.reduce((sum, p) => sum + p, 0);
    const totalLost = Math.abs(lostPoints.reduce((sum, p) => sum + p, 0));
    const netPoints = totalEarned - totalLost;
    const averagePoints = evaluatedPredictions.length > 0
      ? (netPoints / evaluatedPredictions.length).toFixed(1)
      : 0;

    // Best and worst predictions
    const sortedByPoints = [...predictions].sort((a, b) => (b.points || 0) - (a.points || 0));
    const bestPrediction = sortedByPoints[0] || null;
    const worstPrediction = sortedByPoints[sortedByPoints.length - 1] || null;

    // ============================================
    // 5. STREAK ANALYTICS
    // ============================================
    const user = await User.findById(userId).select('stats').lean();
    const currentStreak = user?.stats?.currentStreak || 0;

    // Calculate longest streak from prediction history
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedPredictions = [...predictions]
      .filter(p => p.status === 'evaluated')
      .sort((a, b) => new Date(a.evaluatedAt) - new Date(b.evaluatedAt));

    sortedPredictions.forEach(p => {
      let isCorrect = false;
      if (p.predictionType === 'EVENT') {
        isCorrect = p.actualResult === p.eventPrediction;
      } else {
        isCorrect = p.isCorrect === true;
      }

      if (isCorrect) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    });

    // ============================================
    // 6. PREDICTION TYPE DISTRIBUTION
    // ============================================
    const byType = {
      EVENT: predictions.filter(p => p.predictionType === 'EVENT').length,
      TIME_WINDOW: predictions.filter(p => p.predictionType === 'TIME_WINDOW').length,
      TARGET: predictions.filter(p => p.predictionType === 'TARGET').length
    };

    // ============================================
    // 7. TIME-BASED ANALYTICS (Monthly)
    // ============================================
    const monthlyData = {};
    
    predictions.forEach(p => {
      const date = new Date(p.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          total: 0,
          correct: 0,
          wrong: 0,
          points: 0,
          accuracy: 0
        };
      }

      monthlyData[monthKey].total++;
      monthlyData[monthKey].points += (p.points || 0);

      if (p.status === 'evaluated') {
        let isCorrect = false;
        if (p.predictionType === 'EVENT') {
          isCorrect = p.actualResult === p.eventPrediction;
        } else {
          isCorrect = p.isCorrect === true;
        }

        if (isCorrect) {
          monthlyData[monthKey].correct++;
        } else {
          monthlyData[monthKey].wrong++;
        }
      }
    });

    // Calculate accuracy for each month
    const monthly = Object.values(monthlyData).map(month => {
      const evaluated = month.correct + month.wrong;
      month.accuracy = evaluated > 0 
        ? parseFloat(((month.correct / evaluated) * 100).toFixed(1))
        : 0;
      return month;
    }).sort((a, b) => a.month.localeCompare(b.month));

    // ============================================
    // 8. BEST PERFORMING STOCKS
    // ============================================
    const stockPerformance = {};
    
    predictions.forEach(p => {
      if (!stockPerformance[p.ticker]) {
        stockPerformance[p.ticker] = {
          ticker: p.ticker,
          company: p.company,
          total: 0,
          correct: 0,
          points: 0
        };
      }

      stockPerformance[p.ticker].total++;
      stockPerformance[p.ticker].points += (p.points || 0);

      if (p.status === 'evaluated') {
        let isCorrect = false;
        if (p.predictionType === 'EVENT') {
          isCorrect = p.actualResult === p.eventPrediction;
        } else {
          isCorrect = p.isCorrect === true;
        }

        if (isCorrect) {
          stockPerformance[p.ticker].correct++;
        }
      }
    });

    const topStocks = Object.values(stockPerformance)
      .map(stock => ({
        ...stock,
        accuracy: stock.total > 0 ? ((stock.correct / stock.total) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);

    // ============================================
    // FINAL RESPONSE
    // ============================================
    res.json({
      success: true,
      hasData: true,
      summary: {
        totalPredictions,
        correct: correctPredictions,
        wrong: wrongPredictions,
        pending: pendingPredictions.length,
        locked: lockedPredictions.length,
        evaluated: evaluatedPredictions.length,
        accuracy: parseFloat(accuracy)
      },
      byPredictionType,
      byConfidence,
      byType,
      points: {
        earned: totalEarned,
        lost: totalLost,
        net: netPoints,
        average: parseFloat(averagePoints),
        best: bestPrediction ? {
          ticker: bestPrediction.ticker,
          company: bestPrediction.company,
          points: bestPrediction.points,
          type: bestPrediction.predictionType,
          date: bestPrediction.createdAt
        } : null,
        worst: worstPrediction ? {
          ticker: worstPrediction.ticker,
          company: worstPrediction.company,
          points: worstPrediction.points,
          type: worstPrediction.predictionType,
          date: worstPrediction.createdAt
        } : null
      },
      streaks: {
        current: currentStreak,
        longest: longestStreak
      },
      monthly,
      topStocks,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
};