// scripts/fixEvaluatedPredictions.js
// Run this script to update existing evaluated predictions with actualResult field

const mongoose = require('mongoose');
const Prediction = require('../src/models/Prediction');
const User = require('../src/models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/candle', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');
  await fixEvaluatedPredictions();
  mongoose.connection.close();
});

async function fixEvaluatedPredictions() {
  try {
    // Find all evaluated predictions without actualResult
    const predictions = await Prediction.find({
      status: 'evaluated',
      $or: [
        { actualResult: { $exists: false } },
        { actualResult: null }
      ]
    });

    console.log(`Found ${predictions.length} evaluated predictions to fix`);

    let fixed = 0;
    let errors = 0;

    for (const prediction of predictions) {
      try {
        let actualResult;
        
        // Determine actualResult based on prediction type and existing data
        if (prediction.predictionType === 'EVENT') {
          // For EVENT predictions, determine based on whether prediction was correct
          const userPrediction = prediction.eventPrediction || prediction.eventOutcome;
          
          // If we have earnings data, we can be more precise
          if (prediction.actualEPS && prediction.expectedEPS) {
            const earningsOutcome = calculateEarningsOutcome(
              prediction.actualEPS, 
              prediction.expectedEPS, 
              prediction.tolerance || 2
            );
            
            if (userPrediction === earningsOutcome) {
              actualResult = 'Beat';
            } else if (
              (userPrediction === 'Beat' && earningsOutcome === 'Meet') ||
              (userPrediction === 'Meet' && earningsOutcome === 'Beat') ||
              (userPrediction === 'Meet' && earningsOutcome === 'Miss') ||
              (userPrediction === 'Miss' && earningsOutcome === 'Meet')
            ) {
              actualResult = 'Meet';
            } else {
              actualResult = 'Miss';
            }
          } else {
            // Fallback: use isCorrect field
            if (prediction.isCorrect === true) {
              actualResult = 'Beat';
            } else if (prediction.isCorrect === false) {
              actualResult = 'Miss';
            } else {
              actualResult = 'Meet'; // Default if unclear
            }
          }
        } 
        else if (prediction.predictionType === 'TIME_WINDOW') {
          // For TIME_WINDOW, determine based on price movement
          if (prediction.entryPrice && prediction.exitPrice) {
            const direction = prediction.priceDirection || prediction.direction;
            const priceChange = ((prediction.exitPrice - prediction.entryPrice) / prediction.entryPrice) * 100;
            actualResult = calculateTimeWindowOutcome(direction, priceChange);
          } else {
            // Fallback: use isCorrect field
            if (prediction.isCorrect === true) {
              actualResult = 'Beat';
            } else if (prediction.isCorrect === false) {
              actualResult = 'Miss';
            } else {
              actualResult = 'Meet';
            }
          }
        } 
        else if (prediction.predictionType === 'TARGET') {
          // For TARGET, determine based on whether target was hit
          if (prediction.hitTargetAt) {
            // Calculate how well they beat the target
            const entryPrice = prediction.entryPrice || prediction.startPrice;
            const highestPrice = prediction.highestPrice;
            const percentAboveTarget = ((highestPrice - prediction.targetPrice) / prediction.targetPrice) * 100;
            
            if (percentAboveTarget > 5) {
              actualResult = 'Beat';
            } else {
              actualResult = 'Meet';
            }
          } else {
            // Target not hit
            const percentFromTarget = prediction.highestPrice 
              ? Math.abs((prediction.targetPrice - prediction.highestPrice) / prediction.targetPrice) * 100
              : 100;
            
            if (percentFromTarget <= 2) {
              actualResult = 'Meet'; // Very close
            } else {
              actualResult = 'Miss';
            }
          }
        }

        // Update the prediction
        if (actualResult) {
          prediction.actualResult = actualResult;
          
          // Recalculate points based on actualResult
          const points = calculatePoints(prediction.predictionType, actualResult, prediction.confidence);
          
          // Only update points if they're different (to preserve manually set points)
          const oldPoints = prediction.points || 0;
          prediction.points = points;
          
          await prediction.save();
          
          console.log(`✅ Fixed ${prediction.ticker} (${prediction.predictionType}): ${actualResult} (${oldPoints} → ${points} pts)`);
          fixed++;
        } else {
          console.warn(`⚠️ Could not determine actualResult for prediction ${prediction._id}`);
        }
      } catch (error) {
        console.error(`Error fixing prediction ${prediction._id}:`, error);
        errors++;
      }
    }

    console.log(`\n✅ Migration complete: ${fixed} fixed, ${errors} errors`);
    
    // Recalculate user stats
    await recalculateAllUserStats();
    
  } catch (error) {
    console.error('Error in migration:', error);
  }
}

// Helper functions (same as in predictionEvaluator.js)
function calculateEarningsOutcome(actualEPS, expectedEPS, tolerance = 2) {
  const difference = actualEPS - expectedEPS;
  const percentDifference = (difference / Math.abs(expectedEPS)) * 100;
  
  if (percentDifference > tolerance) {
    return 'Beat';
  } else if (percentDifference < -tolerance) {
    return 'Miss';
  } else {
    return 'Meet';
  }
}

function calculateTimeWindowOutcome(priceDirection, percentChange) {
  const STRONG_THRESHOLD = 5;
  const MODERATE_THRESHOLD = 1;
  const FLAT_TOLERANCE = 2;
  
  if (priceDirection === 'UP') {
    if (percentChange > STRONG_THRESHOLD) return 'Beat';
    if (percentChange > MODERATE_THRESHOLD) return 'Meet';
    return 'Miss';
  } else if (priceDirection === 'DOWN') {
    if (percentChange < -STRONG_THRESHOLD) return 'Beat';
    if (percentChange < -MODERATE_THRESHOLD) return 'Meet';
    return 'Miss';
  } else if (priceDirection === 'FLAT') {
    if (Math.abs(percentChange) <= FLAT_TOLERANCE) return 'Beat';
    if (Math.abs(percentChange) <= FLAT_TOLERANCE * 2) return 'Meet';
    return 'Miss';
  }
  
  return 'Miss';
}

function calculatePoints(predictionType, outcome, confidence) {
  const basePoints = {
    EVENT: 100,
    TIME_WINDOW: 50,
    TARGET: 75
  };
  
  const base = basePoints[predictionType] || 50;
  const multiplier = confidence / 3;
  
  if (outcome === 'Beat') {
    return Math.round(base * multiplier);
  } else if (outcome === 'Meet') {
    return Math.round(base * multiplier * 0.5);
  } else if (outcome === 'Miss') {
    return Math.round(-base * 0.5);
  }
  
  return 0;
}

async function recalculateAllUserStats() {
  console.log('\n🔄 Recalculating user stats...');
  
  const users = await User.find({});
  
  for (const user of users) {
    try {
      // Get all evaluated predictions for this user
      const evaluatedPredictions = await Prediction.find({
        userId: user._id,
        status: 'evaluated'
      });
      
      // Recalculate total points
      const totalPoints = evaluatedPredictions.reduce((sum, pred) => sum + (pred.points || 0), 0);
      
      // Count correct predictions (Beat or Meet)
      const correctPredictions = evaluatedPredictions.filter(
        pred => pred.actualResult === 'Beat' || pred.actualResult === 'Meet'
      ).length;
      
      // Calculate accuracy rate
      const accuracyRate = evaluatedPredictions.length > 0 
        ? (correctPredictions / evaluatedPredictions.length) * 100 
        : 0;
      
      // Update user stats
      user.stats.totalPoints = totalPoints;
      user.stats.correctPredictions = correctPredictions;
      user.stats.accuracyRate = accuracyRate;
      
      await user.save();
      
      console.log(`✅ Updated stats for ${user.username}: ${totalPoints} pts, ${accuracyRate.toFixed(1)}% accuracy`);
    } catch (error) {
      console.error(`Error updating stats for user ${user._id}:`, error);
    }
  }
  
  console.log('✅ User stats recalculation complete');
}