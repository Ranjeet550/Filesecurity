const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Module name is required'],
    unique: true,
    trim: true
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  icon: {
    type: String,
    default: 'AppstoreOutlined'
  },
  route: {
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

// Update the updatedAt field before saving
ModuleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Module', ModuleSchema);
