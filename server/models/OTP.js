const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  otp: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // OTP expires after 10 minutes (600 seconds)
  }
});

// Method to verify OTP
OTPSchema.methods.verifyOTP = function(otp) {
  return this.otp === otp;
};

module.exports = mongoose.model('OTP', OTPSchema);
