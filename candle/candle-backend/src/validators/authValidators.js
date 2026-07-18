const { body } = require('express-validator');

const validateRegistration = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-20 characters and contain only letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('fullName')
    .isLength({ min: 2, max: 50 })
    .trim()
    .withMessage('Full name must be 2-50 characters')
];

const validateLogin = [
  body('emailOrUsername')
    .notEmpty()
    .withMessage('Email or username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const validateProfileUpdate = [
  body('fullName').optional().isLength({ min: 2, max: 50 }).trim(),
  body('avatar').optional().isURL().withMessage('Avatar must be a valid URL')
];

module.exports = { validateRegistration, validateLogin, validateProfileUpdate };