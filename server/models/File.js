const mongoose = require('mongoose');
const crypto = require('crypto');

const FileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, 'Please add a filename'],
    trim: true
  },
  originalName: {
    type: String,
    required: [true, 'Original filename is required']
  },
  path: {
    type: String,
    required: [true, 'File path is required']
  },
  size: {
    type: Number,
    required: [true, 'File size is required']
  },
  mimetype: {
    type: String,
    required: [true, 'File type is required']
  },
  password: {
    type: String,
    required: [true, 'Password is required for file security']
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadLocation: {
    type: {
      latitude: Number,
      longitude: Number,
      city: String,
      country: String
    }
  },
  downloads: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      downloadedAt: {
        type: Date,
        default: Date.now
      },
      location: {
        latitude: Number,
        longitude: Number,
        city: String,
        country: String
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Default expiry is 30 days from now
      const now = new Date();
      return new Date(now.setDate(now.getDate() + 30));
    }
  }
});

// Generate a random password for the file
FileSchema.statics.generatePassword = function() {
  // Generate a random 8-character password
  return crypto.randomBytes(4).toString('hex');
};

// Check if the provided password matches the file password
FileSchema.methods.verifyPassword = function(enteredPassword) {
  return enteredPassword === this.password;
};

module.exports = mongoose.model('File', FileSchema);
