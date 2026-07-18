// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const {
  triggerEvaluation,
  evaluateEventManually,
  forceEvaluatePrediction,
  getEvaluationStats
} = require('../controllers/adminController');
const authenticateToken = require('../middleware/auth');

// Optional: Add admin-only middleware
// const requireAdmin = (req, res, next) => {
//   if (req.user.role !== 'admin') {
//     return res.status(403).json({ message: 'Admin access required' });
//   }
//   next();
// };

// Get evaluation statistics
router.get('/stats', authenticateToken, getEvaluationStats);

// Trigger evaluation for all due predictions
router.post('/evaluate-all', authenticateToken, triggerEvaluation);

// Manually evaluate an EVENT prediction
router.post('/evaluate-event', authenticateToken, evaluateEventManually);

// Force evaluate a specific prediction
router.post('/evaluate/:predictionId', authenticateToken, forceEvaluatePrediction);

module.exports = router;