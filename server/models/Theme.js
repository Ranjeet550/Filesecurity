const mongoose = require('mongoose');

const ThemeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Theme name is required'],
    trim: true
  },
  key: {
    type: String,
    required: [true, 'Theme key is required'],
    unique: true,
    trim: true
  },
  primaryColor: {
    type: String,
    required: [true, 'Primary color is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  isDefault: {
    type: Boolean,
    default: false
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
ThemeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure only one theme is active at a time
ThemeSchema.pre('save', async function(next) {
  if (this.isActive && this.isModified('isActive')) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isActive: false }
    );
  }
  next();
});

module.exports = mongoose.model('Theme', ThemeSchema);
