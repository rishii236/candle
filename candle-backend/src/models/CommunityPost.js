const mongoose = require('mongoose');

const communityPostSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  ticker: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    maxlength: 10,
    index: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likeCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index for efficient feed queries (newest first)
communityPostSchema.index({ createdAt: -1 });

// Index for filtering by ticker
communityPostSchema.index({ ticker: 1, createdAt: -1 });

// Virtual for author info (populated manually in controller)
communityPostSchema.virtual('author', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Ensure virtuals are included in JSON
communityPostSchema.set('toJSON', { virtuals: true });
communityPostSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('CommunityPost', communityPostSchema);