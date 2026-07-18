// controllers/communityController.js
const CommunityPost = require('../models/CommunityPost');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Get community feed
// @route   GET /api/community
// @access  Private
const getCommunityFeed = async (req, res) => {
  try {
    const { page = 1, limit = 20, ticker } = req.query;
    
    // Build query
    const query = {};
    if (ticker) {
      query.ticker = ticker.toUpperCase();
    }

    // Execute query with pagination
    const posts = await CommunityPost.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'username fullName avatar')
      .lean();

    const count = await CommunityPost.countDocuments(query);

    // Transform posts to include author info and user's like status
    const postsWithDetails = posts.map(post => ({
      ...post,
      author: {
        username: post.userId.username,
        fullName: post.userId.fullName,
        avatar: post.userId.avatar
      },
      isLikedByUser: post.likes.some(
        likeId => likeId.toString() === req.user._id.toString()
      ),
      // Remove userId from response for cleaner API
      userId: undefined
    }));

    res.json({
      success: true,
      posts: postsWithDetails,
      pagination: {
        totalRecords: count,
        totalPages: Math.ceil(count / limit),
        current: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching community feed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch community feed'
    });
  }
};

// @desc    Create a new community post
// @route   POST /api/community
// @access  Private
const createPost = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { ticker, company, content } = req.body;

    // Validate content length
    if (content.length > 300) {
      return res.status(400).json({
        success: false,
        message: 'Content must be 300 characters or less'
      });
    }

    // Create post
    const post = await CommunityPost.create({
      userId: req.user._id,
      ticker: ticker.toUpperCase(),
      company,
      content: content.trim(),
      likes: [],
      likeCount: 0
    });

    // Populate author info for response
    await post.populate('userId', 'username fullName avatar');

    console.log(`✅ Created community post by ${req.user.username} for ${ticker}`);

    // Format response
    const responsePost = {
      ...post.toObject(),
      author: {
        username: post.userId.username,
        fullName: post.userId.fullName,
        avatar: post.userId.avatar
      },
      isLikedByUser: false,
      userId: undefined
    };

    res.status(201).json({
      success: true,
      post: responsePost
    });
  } catch (error) {
    console.error('Error creating community post:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create post'
    });
  }
};

// @desc    Like/Unlike a community post
// @route   POST /api/community/:id/like
// @access  Private
const toggleLike = async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const userId = req.user._id;
    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex > -1) {
      // User already liked - remove like
      post.likes.splice(likeIndex, 1);
      post.likeCount = Math.max(0, post.likeCount - 1);
      await post.save();

      console.log(`👎 ${req.user.username} unliked post ${post._id}`);

      res.json({
        success: true,
        isLiked: false,
        likeCount: post.likeCount
      });
    } else {
      // User hasn't liked - add like
      post.likes.push(userId);
      post.likeCount = post.likes.length;
      await post.save();

      console.log(`👍 ${req.user.username} liked post ${post._id}`);

      res.json({
        success: true,
        isLiked: true,
        likeCount: post.likeCount
      });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle like'
    });
  }
};

// @desc    Get user's own posts
// @route   GET /api/community/my-posts
// @access  Private
const getMyPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const posts = await CommunityPost.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await CommunityPost.countDocuments({ userId: req.user._id });

    res.json({
      success: true,
      posts,
      pagination: {
        totalRecords: count,
        totalPages: Math.ceil(count / limit),
        current: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your posts'
    });
  }
};

module.exports = {
  getCommunityFeed,
  createPost,
  toggleLike,
  getMyPosts
};