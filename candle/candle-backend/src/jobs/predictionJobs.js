const cron = require('node-cron');
const Prediction = require('../models/Prediction');
const User = require('../models/User');

// Lock predictions that have reached their lock time
const lockPendingPredictions = async () => {
  try {
    const now = new Date();
    const result = await Prediction.updateMany(
      { 
        status: 'pending', 
        lockAt: { $lte: now } 
      },
      { 
        $set: { status: 'locked' } 
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`🔒 Locked ${result.modifiedCount} predictions`);
    }
  } catch (error) {
    console.error('Error locking predictions:', error);
  }
};

// Evaluate predictions that have reached their evaluation time
const evaluatePredictions = async () => {
  try {
    const now = new Date();
    const predictionsToEvaluate = await Prediction.find({
      status: 'locked',
      evaluateAt: { $lte: now }
    });
    
    if (predictionsToEvaluate.length === 0) return;
    
    console.log(`📊 Evaluating ${predictionsToEvaluate.length} predictions...`);
    
    for (const prediction of predictionsToEvaluate) {
      // TODO: Fetch real stock data here
      // For now, this is a placeholder - you'll integrate with stock API later
      
      let points = 0;
      let isCorrect = false;
      
      if (prediction.predictionType === 'EVENT') {
        // Placeholder: In production, you'd fetch actual earnings results
        // For now, randomly evaluate (you'll replace this with real data)
        if (prediction.actualEventOutcome && 
            prediction.eventOutcome === prediction.actualEventOutcome) {
          isCorrect = true;
          points = 10 * prediction.confidence;
        }
      } else if (prediction.predictionType === 'TIME_WINDOW') {
        // Placeholder: Check if endPrice matches prediction
        if (prediction.endPrice) {
          const percentChange = ((prediction.endPrice - prediction.startPrice) / prediction.startPrice) * 100;
          
          if (prediction.priceDirection === 'UP' && percentChange > 2) isCorrect = true;
          else if (prediction.priceDirection === 'DOWN' && percentChange < -2) isCorrect = true;
          else if (prediction.priceDirection === 'FLAT' && Math.abs(percentChange) <= 2) isCorrect = true;
          
          if (isCorrect) {
            points = 10 * prediction.confidence;
          }
        }
      } else if (prediction.predictionType === 'TARGET') {
        // Check if target was reached
        if (prediction.targetReached) {
          isCorrect = true;
          points = 15 * prediction.confidence;
        }
      }
      
      // Update prediction
      prediction.status = 'evaluated';
      prediction.pointsAwarded = points;
      await prediction.save();
      
      // Update user stats
      const user = await User.findById(prediction.userId);
      if (user) {
        user.stats.totalPoints += points;
        if (isCorrect) {
          user.stats.correctPredictions += 1;
        }
        await user.save();
      }
      
      console.log(`✅ Evaluated ${prediction.ticker} - Points: ${points}`);
    }
  } catch (error) {
    console.error('Error evaluating predictions:', error);
  }
};

// Start all cron jobs
const startCronJobs = () => {
  // Run every 5 minutes to lock predictions
  cron.schedule('*/5 * * * *', async () => {
    console.log('⏰ Running prediction lock check...');
    await lockPendingPredictions();
  });
  
  // Run every 10 minutes to evaluate predictions
  cron.schedule('*/10 * * * *', async () => {
    console.log('⏰ Running prediction evaluation check...');
    await evaluatePredictions();
  });
  
  console.log('✅ Cron jobs started successfully');
};

module.exports = { 
  startCronJobs, 
  lockPendingPredictions, 
  evaluatePredictions 
};