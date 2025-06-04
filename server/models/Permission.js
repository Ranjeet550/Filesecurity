const mongoose = require('mongoose');

const PermissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Permission name is required'],
    trim: true
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: ['create', 'read', 'update', 'delete'],
    trim: true
  },
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: [true, 'Module is required']
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create compound index for module and action to ensure uniqueness
PermissionSchema.index({ module: 1, action: 1 }, { unique: true });

// Update the updatedAt field before saving
PermissionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Permission', PermissionSchema);
