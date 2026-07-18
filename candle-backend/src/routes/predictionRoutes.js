// routes/predictionRoutes.js
const express = require('express');
const router = express.Router();
const { getPredictions, createPrediction } = require('../controllers/predictionController');
const { 
  validateEventPrediction, 
  validateTimeWindowPrediction, 
  validateTargetPrediction 
} = require('../validators/predictionValidators');
const handleValidationErrors = require('../middleware/validate');
const authenticateToken = require('../middleware/auth');

router.get('/', authenticateToken, getPredictions);

// Route with dynamic validation based on prediction type
router.post('/', authenticateToken, (req, res, next) => {
  const { predictionType } = req.body;
  
  let validators;
  if (predictionType === 'EVENT') {
    validators = validateEventPrediction;
  } else if (predictionType === 'TIME_WINDOW') {
    validators = validateTimeWindowPrediction;
  } else if (predictionType === 'TARGET') {
    validators = validateTargetPrediction;
  } else {
    return res.status(400).json({ message: 'Invalid prediction type' });
  }
  
  // Apply validators
  Promise.all(validators.map(validator => validator.run(req)))
    .then(() => next())
    .catch(next);
}, handleValidationErrors, createPrediction);

module.exports = router;