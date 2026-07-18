// controllers/predictionController.js
const Prediction = require('../models/Prediction');
const { validationResult } = require('express-validator');

// Helper function to calculate evaluation time
const calculateEvaluationTime = (predictionType, data) => {
  const now = new Date();
  
  if (predictionType === 'EVENT') {
    // Evaluate 24 hours after the event date
    const eventDate = new Date(data.eventDate);
    return new Date(eventDate.getTime() + 24 * 60 * 60 * 1000);
  } else if (predictionType === 'TIME_WINDOW') {
    // Evaluate after the time window
    const timeInMs = {
      '1D': 24 * 60 * 60 * 1000,
      '7D': 7 * 24 * 60 * 60 * 1000,
      '30D': 30 * 24 * 60 * 60 * 1000
    };
    return new Date(now.getTime() + timeInMs[data.timeWindow]);
  } else if (predictionType === 'TARGET') {
    // Evaluate at target date
    return new Date(data.targetDate);
  }
  
  return now;
};

// Helper function to calculate lock time
const calculateLockTime = (predictionType, data) => {
  const now = new Date();
  
  if (predictionType === 'EVENT') {
    // Lock 24 hours before event
    const eventDate = new Date(data.eventDate);
    return new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
  } else if (predictionType === 'TIME_WINDOW') {
    // Lock immediately for time window
    return now;
  } else if (predictionType === 'TARGET') {
    // Lock immediately for target price
    return now;
  }
  
  return now;
};

// @desc    Get user's predictions
// @route   GET /api/predictions
// @access  Private
const getPredictions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    
    // Build query
    const query = { userId: req.user._id };
    if (type && type !== 'all') query.predictionType = type;
    if (status && status !== 'all') query.status = status;

    // Execute query with pagination
    const predictions = await Prediction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Prediction.countDocuments(query);

    res.json({
      success: true,
      predictions,
      pagination: {
        totalRecords: count,
        totalPages: Math.ceil(count / limit),
        current: parseInt(page),
        limit: parseInt(limit),
        total: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch predictions'
    });
  }
};

// @desc    Create a new prediction
// @route   POST /api/predictions
// @access  Private
const createPrediction = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { 
      company, 
      ticker, 
      predictionType, 
      confidence = 3,
      // EVENT fields
      eventType,
      eventDate,
      eventOutcome,
      // TIME_WINDOW fields
      timeWindow,
      priceDirection,
      startPrice,
      // TARGET fields
      targetPrice,
      targetDate,
      entryPrice
    } = req.body;

    // Validate prediction type specific fields
    if (predictionType === 'EVENT') {
      if (!eventType || !eventDate || !eventOutcome) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required EVENT prediction fields' 
        });
      }
    } else if (predictionType === 'TIME_WINDOW') {
      if (!timeWindow || !priceDirection || !startPrice) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required TIME_WINDOW prediction fields' 
        });
      }
    } else if (predictionType === 'TARGET') {
      if (!targetPrice || !targetDate || !entryPrice) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required TARGET prediction fields' 
        });
      }
    }

    // Build prediction object
    const predictionData = {
      userId: req.user._id,
      company,
      ticker,
      predictionType,
      confidence,
      status: 'pending'
    };

    // Add type-specific fields
    if (predictionType === 'EVENT') {
      predictionData.eventType = eventType;
      predictionData.eventDate = new Date(eventDate);
      predictionData.eventOutcome = eventOutcome;
      predictionData.eventPrediction = eventOutcome; // Alias for compatibility
    } else if (predictionType === 'TIME_WINDOW') {
      predictionData.timeWindow = timeWindow;
      predictionData.priceDirection = priceDirection;
      predictionData.direction = priceDirection; // Alias for compatibility
      predictionData.startPrice = startPrice;
      predictionData.entryPrice = startPrice; // Alias for compatibility
    } else if (predictionType === 'TARGET') {
      predictionData.targetPrice = targetPrice;
      predictionData.targetDate = new Date(targetDate);
      predictionData.entryPrice = entryPrice;
      predictionData.highestPrice = entryPrice; // Initialize with entry price
    }

    // Calculate lock and evaluation times
    predictionData.lockAt = calculateLockTime(predictionType, predictionData);
    predictionData.evaluateAt = calculateEvaluationTime(predictionType, predictionData);

    // Create prediction
    const prediction = await Prediction.create(predictionData);

    console.log(`✅ Created ${predictionType} prediction for ${ticker}`);
    console.log(`🔒 Lock time: ${predictionData.lockAt}`);
    console.log(`📊 Evaluate time: ${predictionData.evaluateAt}`);

    res.status(201).json({
      success: true,
      prediction
    });
  } catch (error) {
    console.error('Error creating prediction:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create prediction'
    });
  }
};

// @desc    Get prediction by ID
// @route   GET /api/predictions/:id
// @access  Private
const getPredictionById = async (req, res) => {
  try {
    const prediction = await Prediction.findById(req.params.id);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    // Check ownership
    if (prediction.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this prediction'
      });
    }

    res.json({
      success: true,
      prediction
    });
  } catch (error) {
    console.error('Error fetching prediction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prediction'
    });
  }
};

module.exports = {
  getPredictions,      // Exported with correct name
  createPrediction,
  getPredictionById
};