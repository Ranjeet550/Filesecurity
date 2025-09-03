const mongoose = require('mongoose');
const crypto = require('crypto');

const FileSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Pending', 'Accepted'],
    default: 'Pending'
  },
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
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
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
  }
});

// Generate a random password for the file
FileSchema.statics.generatePassword = function() {
  // Generate a 10-character alphanumeric password with special characters
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  let password = '';
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += specialChars[Math.floor(Math.random() * specialChars.length)];
  
  // Fill the remaining 6 characters with random selection from all categories
  const allChars = lowercase + uppercase + numbers + specialChars;
  for (let i = 0; i < 6; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password to make it more random
  password = password.split('').sort(() => Math.random() - 0.5).join('');
  
  return password;
};

// Check if the provided password matches the file password
FileSchema.methods.verifyPassword = function(enteredPassword) {
  return enteredPassword === this.password;
};

module.exports = mongoose.model('File', FileSchema);
