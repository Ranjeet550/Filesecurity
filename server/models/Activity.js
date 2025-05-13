const mongoose = require('mongoose');

/**
 * Activity Schema
 * Stores all user and system activities for audit and tracking purposes
 */
const ActivitySchema = new mongoose.Schema({
  // User who performed the action (if authenticated)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // IP address of the request
  ipAddress: {
    type: String,
    default: 'Unknown'
  },
  
  // Type of activity (auth, file, user, system)
  activityType: {
    type: String,
    enum: ['auth', 'file', 'user', 'system'],
    required: true
  },
  
  // Specific action performed
  action: {
    type: String,
    required: true
  },
  
  // Description of the activity
  description: {
    type: String,
    required: true
  },
  
  // Additional data related to the activity (stored as JSON)
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // HTTP method used
  method: {
    type: String,
    default: 'Unknown'
  },
  
  // URL path accessed
  path: {
    type: String,
    default: 'Unknown'
  },
  
  // Status code of the response
  statusCode: {
    type: Number,
    default: 0
  },
  
  // Location data
  location: {
    latitude: {
      type: Number,
      default: 0
    },
    longitude: {
      type: Number,
      default: 0
    },
    city: {
      type: String,
      default: 'Unknown'
    },
    country: {
      type: String,
      default: 'Unknown'
    }
  },
  
  // User agent information
  userAgent: {
    type: String,
    default: 'Unknown'
  },
  
  // Timestamp when the activity occurred
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for faster queries
ActivitySchema.index({ timestamp: -1 });
ActivitySchema.index({ user: 1, timestamp: -1 });
ActivitySchema.index({ activityType: 1, timestamp: -1 });
ActivitySchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model('Activity', ActivitySchema);
