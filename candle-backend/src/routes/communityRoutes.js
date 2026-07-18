// routes/communityRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getCommunityFeed, 
  createPost, 
  toggleLike,
  getMyPosts 
} = require('../controllers/communityController');
const { body } = require('express-validator');
const handleValidationErrors = require('../middleware/validate');
const authenticateToken = require('../middleware/auth');

// Validators for creating a post
const validatePost = [
  body('ticker')
    .trim()
    .notEmpty()
    .withMessage('Ticker is required')
    .isLength({ min: 1, max: 10 })
    .withMessage('Ticker must be 1-10 characters')
    .matches(/^[A-Z]+$/)
    .withMessage('Ticker must contain only uppercase letters'),
  body('company')
    .trim()
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ max: 100 })
    .withMessage('Company name must be less than 100 characters'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 1, max: 300 })
    .withMessage('Content must be between 1 and 300 characters')
];

// @route   GET /api/community
// @desc    Get community feed
// @access  Private
router.get('/', authenticateToken, getCommunityFeed);

// @route   GET /api/community/my-posts
// @desc    Get user's own posts
// @access  Private
router.get('/my-posts', authenticateToken, getMyPosts);

// @route   POST /api/community
// @desc    Create a new post
// @access  Private
router.post('/', authenticateToken, validatePost, handleValidationErrors, createPost);

// @route   POST /api/community/:id/like
// @desc    Like/Unlike a post
// @access  Private
router.post('/:id/like', authenticateToken, toggleLike);

module.exports = router;