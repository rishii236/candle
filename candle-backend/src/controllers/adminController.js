// controllers/adminController.js
const { 
  evaluateEventPrediction, 
  evaluateAllDuePredictions,
  evaluateTimeWindowPrediction,
  evaluateTargetPrediction
} = require('../services/predictionEvaluator');
const Prediction = require('../models/Prediction');

// Manually trigger evaluation for all due predictions
const triggerEvaluation = async (req, res) => {
  try {
    const result = await evaluateAllDuePredictions();
    
    res.json({
      success: true,
      message: `Evaluated ${result.evaluated} predictions`,
      ...result
    });
  } catch (error) {
    console.error('Trigger evaluation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to evaluate predictions',
      error: error.message 
    });
  }
};

// Manually evaluate a specific EVENT prediction
const evaluateEventManually = async (req, res) => {
  try {
    const { predictionId, actualResult } = req.body;
    
    if (!predictionId || !actualResult) {
      return res.status(400).json({ 
        message: 'predictionId and actualResult are required' 
      });
    }
    
    if (!['Beat', 'Meet', 'Miss'].includes(actualResult)) {
      return res.status(400).json({ 
        message: 'actualResult must be Beat, Meet, or Miss' 
      });
    }
    
    const prediction = await Prediction.findById(predictionId);
    
    if (!prediction) {
      return res.status(404).json({ message: 'Prediction not found' });
    }
    
    if (prediction.predictionType !== 'EVENT') {
      return res.status(400).json({ 
        message: 'This endpoint is only for EVENT predictions' 
      });
    }
    
    const evaluated = await evaluateEventPrediction(prediction, actualResult);
    
    res.json({
      success: true,
      message: 'EVENT prediction evaluated',
      prediction: evaluated
    });
  } catch (error) {
    console.error('Manual evaluation error:', error);
    res.status(500).json({ 
      message: 'Failed to evaluate prediction',
      error: error.message 
    });
  }
};

// Force evaluate a specific prediction by ID
const forceEvaluatePrediction = async (req, res) => {
  try {
    const { predictionId } = req.params;
    
    const prediction = await Prediction.findById(predictionId);
    
    if (!prediction) {
      return res.status(404).json({ message: 'Prediction not found' });
    }
    
    let result;
    
    if (prediction.predictionType === 'TIME_WINDOW') {
      result = await evaluateTimeWindowPrediction(prediction);
    } else if (prediction.predictionType === 'TARGET') {
      result = await evaluateTargetPrediction(prediction);
    } else if (prediction.predictionType === 'EVENT') {
      return res.status(400).json({ 
        message: 'EVENT predictions require actualResult. Use /admin/evaluate-event endpoint' 
      });
    }
    
    if (result) {
      res.json({
        success: true,
        message: 'Prediction evaluated',
        prediction: result
      });
    } else {
      res.json({
        success: false,
        message: 'Prediction not ready for evaluation yet'
      });
    }
  } catch (error) {
    console.error('Force evaluation error:', error);
    res.status(500).json({ 
      message: 'Failed to evaluate prediction',
      error: error.message 
    });
  }
};

// Get evaluation status/stats
const getEvaluationStats = async (req, res) => {
  try {
    const now = new Date();
    
    const stats = {
      pending: await Prediction.countDocuments({ status: 'pending' }),
      locked: await Prediction.countDocuments({ status: 'locked' }),
      evaluated: await Prediction.countDocuments({ status: 'evaluated' }),
      dueForEvaluation: await Prediction.countDocuments({
        status: { $in: ['pending', 'locked'] },
        evaluateAt: { $lte: now }
      }),
      awaitingManualEvaluation: await Prediction.countDocuments({
        predictionType: 'EVENT',
        status: { $in: ['pending', 'locked'] },
        eventDate: { $lte: now }
      })
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Get evaluation stats error:', error);
    res.status(500).json({ message: 'Failed to get stats' });
  }
};

module.exports = {
  triggerEvaluation,
  evaluateEventManually,
  forceEvaluatePrediction,
  getEvaluationStats
};