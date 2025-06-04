const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const userRoutes = require('./routes/users');
const activityRoutes = require('./routes/activities');
const moduleRoutes = require('./routes/modules');
const permissionRoutes = require('./routes/permissions');
const roleRoutes = require('./routes/roles');

// Import middleware
const { activityLogger, logActivity } = require('./middleware/logger');

// Initialize express app
const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory...');
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests to console (simple logging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Activity logger middleware (comprehensive logging to database)
app.use(activityLogger);

// Static files directory for uploads
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/roles', roleRoutes);

// Server port
const PORT = process.env.PORT || 5000;

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/secure-file-transfer';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Log server start as an activity
mongoose.connection.once('open', async () => {
  try {
    await logActivity({
      activityType: 'system',
      action: 'server_start',
      description: 'Server started successfully',
      data: {
        nodeEnv: process.env.NODE_ENV || 'development',
        port: PORT
      }
    });
  } catch (error) {
    console.error('Error logging server start:', error);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
