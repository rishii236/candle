// services/predictionEvaluator.js
// Multi-API version with FMP, Alpha Vantage, Finnhub, and Yahoo Finance fallbacks
const Prediction = require('../models/Prediction');
const User = require('../models/User');

// ============================================================================
// POINTS CALCULATION - Now uses Beat/Meet/Miss for all types
// ============================================================================
const calculatePoints = (predictionType, outcome, confidence) => {
  const basePoints = {
    EVENT: 100,
    TIME_WINDOW: 50,
    TARGET: 75
  };
  
  const base = basePoints[predictionType] || 50;
  const multiplier = confidence / 3; // 1 = 0.33x, 3 = 1x, 5 = 1.67x
  
  // Beat/Meet/Miss point distribution
  if (outcome === 'Beat') {
    return Math.round(base * multiplier);
  } else if (outcome === 'Meet') {
    return Math.round(base * multiplier * 0.5);
  } else if (outcome === 'Miss') {
    return Math.round(-base * 0.5);
  }
  
  return 0;
};

// ============================================================================
// OUTCOME CALCULATION FUNCTIONS
// ============================================================================

const calculateEarningsOutcome = (actualEPS, expectedEPS, tolerance = 2) => {
  if (!actualEPS || !expectedEPS) {
    throw new Error('Both actualEPS and expectedEPS are required');
  }
  
  const difference = actualEPS - expectedEPS;
  const percentDifference = (difference / Math.abs(expectedEPS)) * 100;
  
  if (percentDifference > tolerance) {
    return 'Beat';
  } else if (percentDifference < -tolerance) {
    return 'Miss';
  } else {
    return 'Meet';
  }
};

const calculateTimeWindowOutcome = (priceDirection, percentChange) => {
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
};

const calculateTargetOutcome = (entryPrice, targetPrice, highestPrice, hitTargetAt, targetDate) => {
  const now = new Date();
  const deadline = new Date(targetDate);
  
  if (!hitTargetAt) {
    const percentFromTarget = Math.abs((highestPrice - targetPrice) / targetPrice) * 100;
    if (percentFromTarget <= 2) return 'Meet';
    return 'Miss';
  }
  
  const hitDate = new Date(hitTargetAt);
  const totalDuration = deadline - new Date();
  const timeToHit = hitDate - new Date();
  const percentTimeUsed = (timeToHit / totalDuration) * 100;
  const percentAboveTarget = ((highestPrice - targetPrice) / targetPrice) * 100;
  
  if (percentTimeUsed < 50 || percentAboveTarget > 5) {
    return 'Beat';
  }
  
  return 'Meet';
};

// ============================================================================
// MULTI-API HELPERS - Fetch from multiple sources
// ============================================================================

// Fetch current stock price (tries multiple APIs)
const fetchCurrentPrice = async (ticker) => {
  // Try Finnhub first (you already have the key)
  const finnhubPrice = await fetchPriceFromFinnhub(ticker);
  if (finnhubPrice) return finnhubPrice;
  
  // Try Alpha Vantage if available
  const alphaPrice = await fetchPriceFromAlphaVantage(ticker);
  if (alphaPrice) return alphaPrice;
  
  // Try FMP if available
  const fmpPrice = await fetchPriceFromFMP(ticker);
  if (fmpPrice) return fmpPrice;
  
  console.error(`Failed to fetch price for ${ticker} from all sources`);
  return null;
};

// Finnhub price fetcher
const fetchPriceFromFinnhub = async (ticker) => {
  const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
  if (!FINNHUB_API_KEY) return null;
  
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`
    );
    
    if (!response.ok) return null;
    const data = await response.json();
    if (data.error || !data.c) return null;
    
    console.log(`✅ Fetched price from Finnhub: ${ticker} = $${data.c}`);
    return data.c;
  } catch (error) {
    console.error(`Finnhub price error:`, error.message);
    return null;
  }
};

// Alpha Vantage price fetcher
const fetchPriceFromAlphaVantage = async (ticker) => {
  const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY;
  if (!ALPHA_VANTAGE_KEY) return null;
  
  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${ALPHA_VANTAGE_KEY}`
    );
    
    if (!response.ok) return null;
    const data = await response.json();
    
    if (data['Global Quote'] && data['Global Quote']['05. price']) {
      const price = parseFloat(data['Global Quote']['05. price']);
      console.log(`✅ Fetched price from Alpha Vantage: ${ticker} = $${price}`);
      return price;
    }
    
    return null;
  } catch (error) {
    console.error(`Alpha Vantage price error:`, error.message);
    return null;
  }
};

// FMP price fetcher
const fetchPriceFromFMP = async (ticker) => {
  const FMP_API_KEY = process.env.FMP_API_KEY;
  if (!FMP_API_KEY) return null;
  
  try {
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/quote/${ticker}?apikey=${FMP_API_KEY}`
    );
    
    if (!response.ok) return null;
    const data = await response.json();
    
    if (data && data[0] && data[0].price) {
      const price = data[0].price;
      console.log(`✅ Fetched price from FMP: ${ticker} = $${price}`);
      return price;
    }
    
    return null;
  } catch (error) {
    console.error(`FMP price error:`, error.message);
    return null;
  }
};

// ============================================================================
// MULTI-API EARNINGS FETCHERS
// ============================================================================

// 1. Financial Modeling Prep (FMP) - Best for earnings
const fetchEarningsFromFMP = async (ticker, eventDate) => {
  const FMP_API_KEY = process.env.FMP_API_KEY;
  if (!FMP_API_KEY) return null;
  
  try {
    const targetDate = new Date(eventDate);
    const fromDate = new Date(targetDate);
    fromDate.setDate(fromDate.getDate() - 7);
    const toDate = new Date(targetDate);
    toDate.setDate(toDate.getDate() + 7);
    
    const formatDate = (date) => date.toISOString().split('T')[0];
    
    // Try earnings calendar first (best for recent/upcoming)
    const calendarUrl = `https://financialmodelingprep.com/api/v3/earning_calendar?from=${formatDate(fromDate)}&to=${formatDate(toDate)}&apikey=${FMP_API_KEY}`;
    const calendarResponse = await fetch(calendarUrl);
    
    if (calendarResponse.ok) {
      const calendar = await calendarResponse.json();
      
      if (Array.isArray(calendar)) {
        const earning = calendar.find(e => e.symbol === ticker);
        
        if (earning && earning.eps !== null && earning.epsEstimated !== null) {
          console.log(`✅ Found earnings from FMP calendar: ${ticker}`);
          return {
            actualEPS: earning.eps,
            expectedEPS: earning.epsEstimated,
            actualRevenue: earning.revenue || null,
            expectedRevenue: earning.revenueEstimated || null,
            period: earning.date,
            source: 'FMP Calendar'
          };
        }
      }
    }
    
    // Try historical earnings
    const historicalUrl = `https://financialmodelingprep.com/api/v3/historical/earning_calendar/${ticker}?apikey=${FMP_API_KEY}`;
    const historicalResponse = await fetch(historicalUrl);
    
    if (historicalResponse.ok) {
      const historical = await historicalResponse.json();
      
      if (Array.isArray(historical)) {
        // Find closest to target date
        let closest = null;
        let minDiff = Infinity;
        
        for (const earning of historical) {
          if (!earning.date) continue;
          const earningDate = new Date(earning.date);
          const diff = Math.abs(earningDate - targetDate);
          
          if (diff < minDiff && diff < 7 * 24 * 60 * 60 * 1000) {
            minDiff = diff;
            closest = earning;
          }
        }
        
        if (closest && closest.eps !== null && closest.epsEstimated !== null) {
          console.log(`✅ Found earnings from FMP historical: ${ticker}`);
          return {
            actualEPS: closest.eps,
            expectedEPS: closest.epsEstimated,
            actualRevenue: closest.revenue || null,
            expectedRevenue: closest.revenueEstimated || null,
            period: closest.date,
            source: 'FMP Historical'
          };
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`FMP earnings error:`, error.message);
    return null;
  }
};

// 2. Alpha Vantage earnings fetcher
const fetchEarningsFromAlphaVantage = async (ticker, eventDate) => {
  const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY;
  if (!ALPHA_VANTAGE_KEY) return null;
  
  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=EARNINGS&symbol=${ticker}&apikey=${ALPHA_VANTAGE_KEY}`
    );
    
    if (!response.ok) return null;
    const data = await response.json();
    
    if (data.quarterlyEarnings && Array.isArray(data.quarterlyEarnings)) {
      const targetDate = new Date(eventDate);
      let closest = null;
      let minDiff = Infinity;
      
      for (const earning of data.quarterlyEarnings) {
        if (!earning.fiscalDateEnding) continue;
        const earningDate = new Date(earning.fiscalDateEnding);
        const diff = Math.abs(earningDate - targetDate);
        
        if (diff < minDiff && diff < 90 * 24 * 60 * 60 * 1000) { // Within 90 days
          minDiff = diff;
          closest = earning;
        }
      }
      
      if (closest && closest.reportedEPS && closest.estimatedEPS) {
        console.log(`✅ Found earnings from Alpha Vantage: ${ticker}`);
        return {
          actualEPS: parseFloat(closest.reportedEPS),
          expectedEPS: parseFloat(closest.estimatedEPS),
          actualRevenue: null,
          expectedRevenue: null,
          period: closest.fiscalDateEnding,
          source: 'Alpha Vantage'
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Alpha Vantage earnings error:`, error.message);
    return null;
  }
};

// 3. Finnhub earnings fetchers (from previous implementation)
const fetchEarningsFromFinnhub = async (ticker, eventDate) => {
  const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
  if (!FINNHUB_API_KEY) return null;
  
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/stock/earnings?symbol=${ticker}&token=${FINNHUB_API_KEY}`
    );
    
    if (!response.ok) return null;
    const earnings = await response.json();
    
    if (earnings.error || !earnings || earnings.length === 0) return null;
    
    const targetDate = new Date(eventDate);
    let closestEarning = null;
    let minDiff = Infinity;
    
    for (const earning of earnings) {
      if (!earning.period) continue;
      const earningDate = new Date(earning.period);
      const diff = Math.abs(earningDate - targetDate);
      
      if (diff < minDiff && diff < 7 * 24 * 60 * 60 * 1000) {
        minDiff = diff;
        closestEarning = earning;
      }
    }
    
    if (!closestEarning) return null;
    
    console.log(`✅ Found earnings from Finnhub: ${ticker}`);
    return {
      actualEPS: closestEarning.actual,
      expectedEPS: closestEarning.estimate,
      actualRevenue: null,
      expectedRevenue: null,
      period: closestEarning.period,
      source: 'Finnhub'
    };
  } catch (error) {
    console.error(`Finnhub earnings error:`, error.message);
    return null;
  }
};

const fetchEarningsFromFinnhubCalendar = async (ticker, eventDate) => {
  const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
  if (!FINNHUB_API_KEY) return null;
  
  try {
    const targetDate = new Date(eventDate);
    const fromDate = new Date(targetDate);
    fromDate.setDate(fromDate.getDate() - 7);
    const toDate = new Date(targetDate);
    toDate.setDate(toDate.getDate() + 7);
    
    const formatDate = (date) => date.toISOString().split('T')[0];
    
    const response = await fetch(
      `https://finnhub.io/api/v1/calendar/earnings?from=${formatDate(fromDate)}&to=${formatDate(toDate)}&token=${FINNHUB_API_KEY}`
    );
    
    if (!response.ok) return null;
    const calendar = await response.json();
    
    if (calendar.error || !calendar.earningsCalendar) return null;
    
    const earningsEntry = calendar.earningsCalendar.find(
      entry => entry.symbol === ticker
    );
    
    if (!earningsEntry) return null;
    
    if (earningsEntry.epsActual !== null && earningsEntry.epsEstimate !== null) {
      console.log(`✅ Found earnings from Finnhub calendar: ${ticker}`);
      return {
        actualEPS: earningsEntry.epsActual,
        expectedEPS: earningsEntry.epsEstimate,
        actualRevenue: earningsEntry.revenueActual || null,
        expectedRevenue: earningsEntry.revenueEstimate || null,
        period: earningsEntry.date,
        source: 'Finnhub Calendar'
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Finnhub calendar error:`, error.message);
    return null;
  }
};

// 4. Yahoo Finance (unofficial) - Last resort
const fetchEarningsFromYahoo = async (ticker, eventDate) => {
  try {
    // Using yahoo-finance2 npm package if installed
    const yahooFinance = require('yahoo-finance2').default;
    
    const earnings = await yahooFinance.quoteSummary(ticker, {
      modules: ['earnings', 'earningsHistory']
    });
    
    if (earnings && earnings.earningsHistory && earnings.earningsHistory.history) {
      const targetDate = new Date(eventDate);
      let closest = null;
      let minDiff = Infinity;
      
      for (const earning of earnings.earningsHistory.history) {
        if (!earning.quarter) continue;
        const earningDate = new Date(earning.quarter);
        const diff = Math.abs(earningDate - targetDate);
        
        if (diff < minDiff && diff < 90 * 24 * 60 * 60 * 1000) {
          minDiff = diff;
          closest = earning;
        }
      }
      
      if (closest && closest.epsActual !== undefined && closest.epsEstimate !== undefined) {
        console.log(`✅ Found earnings from Yahoo Finance: ${ticker}`);
        return {
          actualEPS: closest.epsActual,
          expectedEPS: closest.epsEstimate,
          actualRevenue: null,
          expectedRevenue: null,
          period: closest.quarter,
          source: 'Yahoo Finance'
        };
      }
    }
    
    return null;
  } catch (error) {
    // yahoo-finance2 not installed or error
    return null;
  }
};

// MASTER EARNINGS FETCHER - Tries all sources in order
const fetchEarningsDataMultiSource = async (ticker, eventDate) => {
  console.log(`🔍 Fetching earnings for ${ticker} on ${eventDate}...`);
  
  // Priority order: FMP → Alpha Vantage → Finnhub Calendar → Finnhub Historical → Yahoo
  
  // 1. Try FMP (best for earnings, 250 calls/day)
  let data = await fetchEarningsFromFMP(ticker, eventDate);
  if (data) {
    console.log(`✅ Using ${data.source}`);
    return data;
  }
  
  // 2. Try Alpha Vantage (25-500 calls/day)
  data = await fetchEarningsFromAlphaVantage(ticker, eventDate);
  if (data) {
    console.log(`✅ Using ${data.source}`);
    return data;
  }
  
  // 3. Try Finnhub Calendar (60 calls/min)
  data = await fetchEarningsFromFinnhubCalendar(ticker, eventDate);
  if (data) {
    console.log(`✅ Using ${data.source}`);
    return data;
  }
  
  // 4. Try Finnhub Historical (60 calls/min)
  data = await fetchEarningsFromFinnhub(ticker, eventDate);
  if (data) {
    console.log(`✅ Using ${data.source}`);
    return data;
  }
  
  // 5. Try Yahoo Finance (unlimited but unofficial)
  data = await fetchEarningsFromYahoo(ticker, eventDate);
  if (data) {
    console.log(`✅ Using ${data.source}`);
    return data;
  }
  
  console.log(`⚠️ No earnings data found from any source for ${ticker} on ${eventDate}`);
  console.log(`💡 Manual evaluation: node scripts/evaluateEarnings.js ${ticker} ${eventDate.toISOString ? eventDate.toISOString().split('T')[0] : eventDate} <actualEPS> <expectedEPS>`);
  
  return null;
};

// ============================================================================
// USER STATS UPDATE
// ============================================================================
const updateUserStats = async (userId, points, outcome) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    user.stats.totalPoints += points;
    
    if (outcome === 'Beat' || outcome === 'Meet') {
      user.stats.correctPredictions = (user.stats.correctPredictions || 0) + 1;
    }
    
    const totalEvaluated = await Prediction.countDocuments({
      userId,
      status: 'evaluated'
    });
    
    if (totalEvaluated > 0) {
      user.stats.accuracyRate = (user.stats.correctPredictions / totalEvaluated) * 100;
    }
    
    await user.save();
    console.log(`📊 Updated stats for user ${user.username}: ${points} points, Accuracy: ${user.stats.accuracyRate.toFixed(1)}%`);
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
};

// ============================================================================
// EVALUATION FUNCTIONS (Same as before, just using multi-source fetchers)
// ============================================================================

const evaluateEventPrediction = async (prediction, manualData = null) => {
  try {
    let earningsOutcome, actualEPS, expectedEPS, actualRevenue, expectedRevenue;
    
    if (prediction.eventType === 'earnings') {
      if (manualData) {
        actualEPS = manualData.actualEPS;
        expectedEPS = manualData.expectedEPS || prediction.expectedEPS;
        actualRevenue = manualData.actualRevenue;
        expectedRevenue = manualData.expectedRevenue;
        console.log(`📊 Using manual earnings data for ${prediction.ticker}`);
      } else {
        const earningsData = await fetchEarningsDataMultiSource(prediction.ticker, prediction.eventDate);
        if (earningsData) {
          actualEPS = earningsData.actualEPS;
          expectedEPS = earningsData.expectedEPS || prediction.expectedEPS;
          actualRevenue = earningsData.actualRevenue;
          expectedRevenue = earningsData.expectedRevenue;
          console.log(`📊 Using ${earningsData.source} data for ${prediction.ticker}`);
        }
      }
      
      if (actualEPS != null && expectedEPS != null) {
        earningsOutcome = calculateEarningsOutcome(actualEPS, expectedEPS, prediction.tolerance || 2);
        
        prediction.actualEPS = actualEPS;
        prediction.expectedEPS = expectedEPS;
        if (actualRevenue) prediction.actualRevenue = actualRevenue;
        if (expectedRevenue) prediction.expectedRevenue = expectedRevenue;
      } else {
        console.error(`Cannot evaluate ${prediction._id}: Missing earnings data for ${prediction.ticker} on ${prediction.eventDate}`);
        return null;
      }
    } else {
      if (!manualData || !manualData.earningsOutcome) {
        console.error(`Cannot evaluate ${prediction._id}: Manual result required for ${prediction.eventType}`);
        return null;
      }
      earningsOutcome = manualData.earningsOutcome;
    }
    
    const userPrediction = prediction.eventPrediction || prediction.eventOutcome;
    let actualResult;
    
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
    
    const points = calculatePoints('EVENT', actualResult, prediction.confidence);
    
    prediction.actualResult = actualResult;
    prediction.isCorrect = (actualResult === 'Beat');
    prediction.points = points;
    prediction.status = 'evaluated';
    prediction.evaluatedAt = new Date();
    
    if (prediction.eventType === 'earnings') {
      const epsChange = ((actualEPS - expectedEPS) / Math.abs(expectedEPS)) * 100;
      prediction.resultDetails = `Predicted ${userPrediction}, earnings ${earningsOutcome}. EPS: $${actualEPS?.toFixed(2)} vs expected $${expectedEPS?.toFixed(2)} (${epsChange > 0 ? '+' : ''}${epsChange.toFixed(1)}%) - ${actualResult}`;
    } else {
      prediction.resultDetails = `Predicted ${userPrediction}, actual was ${earningsOutcome} - ${actualResult}`;
    }
    
    await prediction.save();
    await updateUserStats(prediction.userId, points, actualResult);
    
    console.log(`✅ Evaluated EVENT prediction ${prediction._id}: Predicted ${userPrediction}, Earnings ${earningsOutcome} - ${actualResult} (${points} pts)`);
    return prediction;
  } catch (error) {
    console.error(`Error evaluating EVENT prediction ${prediction._id}:`, error);
    return null;
  }
};

const evaluateTimeWindowPrediction = async (prediction) => {
  try {
    const exitPrice = await fetchCurrentPrice(prediction.ticker);
    
    if (!exitPrice) {
      console.error(`Cannot evaluate ${prediction._id}: Failed to fetch exit price for ${prediction.ticker}`);
      return null;
    }
    
    const entryPrice = prediction.entryPrice || prediction.startPrice;
    const priceChange = ((exitPrice - entryPrice) / entryPrice) * 100;
    const direction = prediction.priceDirection || prediction.direction;
    
    const outcome = calculateTimeWindowOutcome(direction, priceChange);
    const isCorrect = (outcome === 'Beat' || outcome === 'Meet');
    const points = calculatePoints('TIME_WINDOW', outcome, prediction.confidence);
    
    prediction.exitPrice = exitPrice;
    prediction.actualResult = outcome;
    prediction.isCorrect = isCorrect;
    prediction.points = points;
    prediction.status = 'evaluated';
    prediction.evaluatedAt = new Date();
    prediction.resultDetails = `Predicted ${direction}, price moved ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}% ($${entryPrice.toFixed(2)} → $${exitPrice.toFixed(2)}) - ${outcome}`;
    
    await prediction.save();
    await updateUserStats(prediction.userId, points, outcome);
    
    console.log(`✅ Evaluated TIME_WINDOW prediction ${prediction._id}: ${outcome} (${points} pts)`);
    return prediction;
  } catch (error) {
    console.error(`Error evaluating TIME_WINDOW prediction ${prediction._id}:`, error);
    return null;
  }
};

const evaluateTargetPrediction = async (prediction) => {
  try {
    const currentPrice = await fetchCurrentPrice(prediction.ticker);
    
    if (!currentPrice) {
      console.error(`Cannot evaluate ${prediction._id}: Failed to fetch current price for ${prediction.ticker}`);
      return null;
    }
    
    const targetDate = new Date(prediction.targetDate);
    const now = new Date();
    const isExpired = now >= targetDate;
    
    if (currentPrice > (prediction.highestPrice || 0)) {
      prediction.highestPrice = currentPrice;
    }
    
    const targetHit = currentPrice >= prediction.targetPrice;
    
    if (targetHit && !prediction.hitTargetAt) {
      prediction.hitTargetAt = now;
    }
    
    if (isExpired || prediction.hitTargetAt) {
      const entryPrice = prediction.entryPrice || prediction.startPrice;
      const highestPrice = prediction.highestPrice || currentPrice;
      
      const outcome = calculateTargetOutcome(
        entryPrice,
        prediction.targetPrice,
        highestPrice,
        prediction.hitTargetAt,
        targetDate
      );
      
      const isCorrect = (outcome === 'Beat' || outcome === 'Meet');
      const points = calculatePoints('TARGET', outcome, prediction.confidence);
      
      prediction.actualResult = outcome;
      prediction.isCorrect = isCorrect;
      prediction.points = points;
      prediction.status = 'evaluated';
      prediction.evaluatedAt = now;
      
      if (outcome === 'Beat') {
        const percentAboveTarget = ((highestPrice - prediction.targetPrice) / prediction.targetPrice) * 100;
        prediction.resultDetails = `Target BEAT! Hit $${highestPrice.toFixed(2)} (${percentAboveTarget.toFixed(1)}% above target)`;
      } else if (outcome === 'Meet') {
        prediction.resultDetails = `Target MET at $${currentPrice.toFixed(2)}`;
      } else {
        const percentFromTarget = ((prediction.targetPrice - highestPrice) / prediction.targetPrice) * 100;
        prediction.resultDetails = `Target MISSED. Highest: $${highestPrice.toFixed(2)} (${percentFromTarget.toFixed(1)}% short)`;
      }
      
      await prediction.save();
      await updateUserStats(prediction.userId, points, outcome);
      
      console.log(`✅ Evaluated TARGET prediction ${prediction._id}: ${outcome} (${points} pts)`);
      return prediction;
    }
    
    await prediction.save();
    return null;
  } catch (error) {
    console.error(`Error evaluating TARGET prediction ${prediction._id}:`, error);
    return null;
  }
};

const manualEvaluateEvent = async (predictionId, earningsData) => {
  try {
    const prediction = await Prediction.findById(predictionId);
    
    if (!prediction) {
      throw new Error('Prediction not found');
    }
    
    if (prediction.predictionType !== 'EVENT') {
      throw new Error('Only EVENT predictions can be manually evaluated with earnings data');
    }
    
    if (prediction.status === 'evaluated') {
      throw new Error('Prediction already evaluated');
    }
    
    return await evaluateEventPrediction(prediction, earningsData);
  } catch (error) {
    console.error('Error in manual evaluation:', error);
    throw error;
  }
};

const evaluateAllDuePredictions = async () => {
  const now = new Date();
  
  try {
    const duePredictions = await Prediction.find({
      status: { $in: ['pending', 'locked'] },
      evaluateAt: { $lte: now }
    });
    
    console.log(`🔍 Found ${duePredictions.length} predictions to evaluate`);
    
    let evaluated = 0;
    let failed = 0;
    
    for (const prediction of duePredictions) {
      try {
        if (prediction.predictionType === 'TIME_WINDOW') {
          await evaluateTimeWindowPrediction(prediction);
          evaluated++;
        } else if (prediction.predictionType === 'TARGET') {
          const result = await evaluateTargetPrediction(prediction);
          if (result) evaluated++;
        } else if (prediction.predictionType === 'EVENT') {
          if (prediction.eventType === 'earnings') {
            const result = await evaluateEventPrediction(prediction);
            if (result) {
              evaluated++;
            } else {
              failed++;
            }
          }
        }
      } catch (error) {
        console.error(`Error evaluating prediction ${prediction._id}:`, error);
        failed++;
      }
    }
    
    console.log(`✅ Evaluation complete: ${evaluated} evaluated, ${failed} failed out of ${duePredictions.length} total`);
    return { evaluated, failed, total: duePredictions.length };
  } catch (error) {
    console.error('Error in evaluateAllDuePredictions:', error);
    throw error;
  }
};

module.exports = {
  evaluateEventPrediction,
  evaluateTimeWindowPrediction,
  evaluateTargetPrediction,
  evaluateAllDuePredictions,
  manualEvaluateEvent,
  calculatePoints,
  calculateEarningsOutcome,
  calculateTimeWindowOutcome,
  calculateTargetOutcome,
  fetchCurrentPrice,
  fetchEarningsData: fetchEarningsDataMultiSource
};