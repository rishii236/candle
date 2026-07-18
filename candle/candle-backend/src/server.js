require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/db');
const { startEvaluationJob } = require('./jobs/evaluationJob');
const adminRoutes = require('./routes/adminRoutes');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Register admin routes (not in app.js to keep separation of concerns)
app.use('/api/admin', adminRoutes);

// Start automatic evaluation job - runs every 5 minutes
startEvaluationJob();
console.log('✅ Evaluation system initialized');

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🔄 Automatic prediction evaluation is ACTIVE (runs every 5 minutes)`);
});

module.exports = app;