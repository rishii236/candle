// scripts/evaluateEarnings.js
// Run this script manually when earnings are announced
// Usage: node scripts/evaluateEarnings.js AAPL 2026-01-28 5.25 5.00

const mongoose = require('mongoose');
require('dotenv').config();

const Prediction = require('../src/models/Prediction');
const { manualEvaluateEvent } = require('../src/services/predictionEvaluator');

const evaluateEarningsForTicker = async (ticker, eventDate, actualEPS, expectedEPS, actualRevenue = null, expectedRevenue = null) => {
  try {
    console.log(`\n🔍 Finding predictions for ${ticker} on ${eventDate}...`);
    
    // Find all pending/locked earnings predictions for this ticker and date
    const predictions = await Prediction.find({
      ticker,
      predictionType: 'EVENT',
      eventType: 'earnings',
      eventDate: new Date(eventDate),
      status: { $in: ['pending', 'locked'] }
    });

    if (predictions.length === 0) {
      console.log('❌ No pending earnings predictions found for this ticker and date');
      return;
    }

    console.log(`📊 Found ${predictions.length} predictions to evaluate`);

    const earningsData = {
      actualEPS,
      expectedEPS,
      actualRevenue,
      expectedRevenue
    };

    let evaluated = 0;
    let failed = 0;

    for (const prediction of predictions) {
      try {
        console.log(`\n⏳ Evaluating prediction ${prediction._id}...`);
        const result = await manualEvaluateEvent(prediction._id.toString(), earningsData);
        
        if (result) {
          evaluated++;
          console.log(`✅ User predicted: ${result.eventPrediction}, Actual: ${result.actualResult}`);
          console.log(`   Result: ${result.isCorrect ? 'CORRECT ✓' : 'WRONG ✗'} (${result.points} points)`);
        } else {
          failed++;
          console.log(`❌ Failed to evaluate prediction ${prediction._id}`);
        }
      } catch (error) {
        failed++;
        console.error(`❌ Error evaluating prediction ${prediction._id}:`, error.message);
      }
    }

    console.log(`\n📈 Summary: ${evaluated} evaluated, ${failed} failed out of ${predictions.length} total`);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Main execution
const main = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get command line arguments
    const args = process.argv.slice(2);
    
    if (args.length < 4) {
      console.log(`
Usage: node scripts/evaluateEarnings.js <TICKER> <DATE> <ACTUAL_EPS> <EXPECTED_EPS> [ACTUAL_REVENUE] [EXPECTED_REVENUE]

Examples:
  node scripts/evaluateEarnings.js AAPL 2026-01-28 5.25 5.00
  node scripts/evaluateEarnings.js NVDA 2026-02-15 8.50 8.00 30000000000 28000000000

Arguments:
  TICKER          - Stock ticker symbol (e.g., AAPL, GOOGL)
  DATE            - Earnings date in YYYY-MM-DD format
  ACTUAL_EPS      - Actual reported EPS (e.g., 5.25)
  EXPECTED_EPS    - Expected/consensus EPS (e.g., 5.00)
  ACTUAL_REVENUE  - (Optional) Actual revenue
  EXPECTED_REVENUE- (Optional) Expected revenue
      `);
      process.exit(1);
    }

    const [ticker, date, actualEPS, expectedEPS, actualRevenue, expectedRevenue] = args;

    await evaluateEarningsForTicker(
      ticker.toUpperCase(),
      date,
      parseFloat(actualEPS),
      parseFloat(expectedEPS),
      actualRevenue ? parseFloat(actualRevenue) : null,
      expectedRevenue ? parseFloat(expectedRevenue) : null
    );

    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
};

main();