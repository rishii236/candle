const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser, updateProfile } = require('../controllers/authController');
const { validateRegistration, validateLogin, validateProfileUpdate } = require('../validators/authValidators');
const handleValidationErrors = require('../middleware/validate');
const authenticateToken = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

router.post('/register', authLimiter, validateRegistration, handleValidationErrors, register);
router.post('/login', authLimiter, validateLogin, handleValidationErrors, login);
router.get('/me', authenticateToken, getCurrentUser);
router.put('/profile', authenticateToken, validateProfileUpdate, handleValidationErrors, updateProfile);

module.exports = router;