// jobs/evaluationJob.js
const cron = require('node-cron');
const { evaluateAllDuePredictions } = require('../services/predictionEvaluator');
const Prediction = require('../models/Prediction');

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
    return result.modifiedCount;
  } catch (error) {
    console.error('❌ Error locking predictions:', error);
    return 0;
  }
};

// Main evaluation job that runs periodically
const startEvaluationJob = () => {
  // Run every 5 minutes to lock and evaluate predictions
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('🔄 Running automated prediction check...');
      
      // Step 1: Lock any pending predictions that should be locked
      await lockPendingPredictions();
      
      // Step 2: Evaluate all due predictions
      const result = await evaluateAllDuePredictions();
      
      if (result.evaluated > 0 || result.failed > 0) {
        console.log(`✅ Job completed: ${result.evaluated} evaluated, ${result.failed} failed out of ${result.total} total`);
      }
    } catch (error) {
      console.error('❌ Evaluation job error:', error);
    }
  });
  
  console.log('✅ Automated evaluation job started (runs every 5 minutes)');
  console.log('⏰ Next check in 5 minutes...');
};

// Manual evaluation trigger (useful for testing)
const runManualEvaluation = async () => {
  try {
    console.log('🔄 Running manual evaluation...');
    await lockPendingPredictions();
    const result = await evaluateAllDuePredictions();
    console.log('✅ Manual evaluation complete:', result);
    return result;
  } catch (error) {
    console.error('❌ Manual evaluation error:', error);
    throw error;
  }
};

module.exports = { 
  startEvaluationJob,
  lockPendingPredictions,
  runManualEvaluation
};