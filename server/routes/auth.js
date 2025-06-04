const express = require('express');
const {
  register,
  login,
  getMe,
  refreshToken,
  updateProfile,
  uploadProfilePicture,
  forgotPassword,
  verifyOTP,
  resetPassword,
  changePassword
} = require('../controllers/auth');
const { protect } = require('../middleware/auth');
const { trackLocation } = require('../middleware/location');
const upload = require('../middleware/upload');

const router = express.Router();

// Apply location tracking middleware to all routes
router.use(trackLocation);

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/refresh-token', protect, refreshToken);

// Profile routes
router.put('/profile', protect, updateProfile);
router.post('/profile-picture', protect, upload.single('profilePicture'), uploadProfilePicture);

// Password management routes
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', protect, resetPassword);
router.post('/change-password', protect, changePassword);

module.exports = router;
