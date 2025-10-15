const User = require('../models/User');
const Role = require('../models/Role');
const OTP = require('../models/OTP');
const { generateOTP, sendOTPEmail } = require('../utils/emailService');
const fs = require('fs');
const path = require('path');
const { logActivity } = require('../middleware/logger');
const { encryptResponse, decryptRequest } = require('../utils/responseEncryption');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    // Decrypt request body if encrypted
    let requestBody = req.body;
    if (req.body && req.body.iv && req.body.encrypted) {
      requestBody = decryptRequest(req.body.iv, req.body.encrypted);
    }
    const { name, email, password, role } = requestBody;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json(encryptResponse({
        success: false,
        message: 'Email already registered'
      }));
    }

    // Get default role if not provided
    let roleId = role;
    if (!role) {
      const defaultRole = await Role.findOne({ name: 'user' });
      if (!defaultRole) {
        return res.status(500).json(encryptResponse({
          success: false,
          message: 'Default user role not found. Please contact administrator.'
        }));
      }
      roleId = defaultRole._id;
    } else {
      // Validate provided role
      const roleExists = await Role.findById(role);
      if (!roleExists) {
        return res.status(400).json(encryptResponse({
          success: false,
          message: 'Invalid role specified'
        }));
      }
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: roleId,
      lastLoginLocation: req.userLocation
    });

    // Populate role for response
    await user.populate('role', 'name displayName');

    // Generate token
    const token = user.getSignedJwtToken();

    // Log user registration
    await logActivity({
      user: user._id,
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
      activityType: 'auth',
      action: 'register',
      description: `New user registered: ${user.email}`,
      data: {
        userId: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      method: req.method,
      path: req.originalUrl,
      statusCode: 201,
      location: req.userLocation,
      userAgent: req.headers['user-agent'] || 'Unknown'
    });

    res.status(201).json(encryptResponse({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        bio: user.bio
      }
    }));
  } catch (error) {
    console.error(error);
    res.status(500).json(encryptResponse({
      success: false,
      message: 'Server error'
    }));
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    // Decrypt request body if encrypted
    let requestBody = req.body;
    if (req.body && req.body.encrypted) {
      requestBody = decryptRequest(req.body.encrypted);
    }
    const { email, password } = requestBody;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json(encryptResponse({
        success: false,
        message: 'Please provide email and password'
      }));
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password').populate('role', 'name displayName isActive');
    if (!user) {
      // Log failed login attempt for non-existent user
      await logActivity({
        user: null,
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
        activityType: 'auth',
        action: 'login_failed',
        description: `Failed login attempt for non-existent user ${email}`,
        data: {
          email: email,
          reason: 'user_not_found'
        },
        method: req.method,
        path: req.originalUrl,
        statusCode: 401,
        location: req.userLocation,
        userAgent: req.headers['user-agent'] || 'Unknown'
      });

      return res.status(401).json(encryptResponse({
        success: false,
        message: 'Invalid credentials'
      }));
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      // Log failed login attempt
      await logActivity({
        user: user._id,
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
        activityType: 'auth',
        action: 'login_failed',
        description: `Failed login attempt for user ${user.email} (invalid password)`,
        data: {
          userId: user._id,
          email: user.email,
          reason: 'invalid_password'
        },
        method: req.method,
        path: req.originalUrl,
        statusCode: 401,
        location: req.userLocation,
        userAgent: req.headers['user-agent'] || 'Unknown'
      });

      return res.status(401).json(encryptResponse({
        success: false,
        message: 'Invalid credentials'
      }));
    }

    // Check if user's role is active
    if (!user.role || !user.role.isActive) {
      // Log failed login attempt for inactive role
      await logActivity({
        user: user._id,
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
        activityType: 'auth',
        action: 'login_failed',
        description: `Failed login attempt for user ${user.email} (inactive role)`,
        data: {
          userId: user._id,
          email: user.email,
          reason: 'inactive_role'
        },
        method: req.method,
        path: req.originalUrl,
        statusCode: 401,
        location: req.userLocation,
        userAgent: req.headers['user-agent'] || 'Unknown'
      });

      return res.status(401).json(encryptResponse({
        success: false,
        message: 'Account is disabled. Please contact administrator.'
      }));
    }



    // Update last login time and location
    user.lastLogin = Date.now();
    user.lastLoginLocation = req.userLocation;
    await user.save();

    // Generate token
    const token = user.getSignedJwtToken();

    // Log successful login
    await logActivity({
      user: user._id,
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
      activityType: 'auth',
      action: 'login',
      description: `User ${user.email} logged in successfully`,
      data: {
        userId: user._id,
        email: user.email,
        role: user.role
      },
      method: req.method,
      path: req.originalUrl,
      statusCode: 200,
      location: req.userLocation,
      userAgent: req.headers['user-agent'] || 'Unknown'
    });

    res.status(200).json(encryptResponse({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        bio: user.bio
      }
    }));
  } catch (error) {
    console.error(error);
    res.status(500).json(encryptResponse({
      success: false,
      message: 'Server error'
    }));
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate({
        path: 'role',
        select: 'name displayName permissions',
        populate: {
          path: 'permissions',
          populate: {
            path: 'module',
            model: 'Module',
            select: 'name displayName'
          }
        }
      });

    res.status(200).json(encryptResponse({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        bio: user.bio,
        lastLogin: user.lastLogin,
        lastLoginLocation: user.lastLoginLocation,
        createdAt: user.createdAt
      }
    }));
  } catch (error) {
    console.error(error);
    res.status(500).json(encryptResponse({
      success: false,
      message: 'Server error'
    }));
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Private
exports.refreshToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('role', 'name displayName');

    if (!user) {
      return res.status(404).json(encryptResponse({
        success: false,
        message: 'User not found'
      }));
    }

    // Generate new token
    const token = user.getSignedJwtToken();

    res.status(200).json(encryptResponse({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        bio: user.bio
      }
    }));
  } catch (error) {
    console.error(error);
    res.status(500).json(encryptResponse({
      success: false,
      message: 'Server error'
    }));
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    // Decrypt request body if encrypted
    let requestBody = req.body;
    if (req.body && req.body.encrypted) {
      requestBody = decryptRequest(req.body.encrypted);
    }
    const { name, bio } = requestBody;

    // Find user
    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json(encryptResponse({
        success: false,
        message: 'User not found'
      }));
    }



    // Update fields
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;

    // Save user
    await user.save();

    res.status(200).json(encryptResponse({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        bio: user.bio,
        lastLogin: user.lastLogin,
        lastLoginLocation: user.lastLoginLocation,
        createdAt: user.createdAt
      }
    }));
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json(encryptResponse({
      success: false,
      message: 'Failed to update profile. Please try again.'
    }));
  }
};

// @desc    Upload profile picture
// @route   POST /api/auth/profile-picture
// @access  Private
exports.uploadProfilePicture = async (req, res) => {
  try {
    console.log('Profile picture upload request received');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('User:', req.user);

    if (!req.file) {
      console.log('No file found in request');
      return res.status(400).json(encryptResponse({
        success: false,
        message: 'Please upload an image file'
      }));
    }

    // Get user
    const user = await User.findById(req.user.id);

    if (!user) {
      // Remove uploaded file if user not found
      fs.unlinkSync(req.file.path);

      return res.status(404).json(encryptResponse({
        success: false,
        message: 'User not found'
      }));
    }

    // If user already has a profile picture, delete the old one
    if (user.profilePicture) {
      const oldPicturePath = path.join(__dirname, '..', 'uploads', path.basename(user.profilePicture));
      if (fs.existsSync(oldPicturePath)) {
        fs.unlinkSync(oldPicturePath);
      }
    }



    // Set the new profile picture path
    // Store the relative path to the file
    user.profilePicture = `/uploads/${req.file.filename}`;
    await user.save();

    console.log('Profile picture updated successfully');
    console.log('New profile picture path:', user.profilePicture);

    const responseData = {
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        bio: user.bio
      }
    };

    console.log('Response data:', JSON.stringify(responseData));
    res.status(200).json(encryptResponse(responseData));
  } catch (error) {
    console.error('Profile picture upload error:', error);

    // Remove uploaded file if there was an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json(encryptResponse({
      success: false,
      message: 'Failed to upload profile picture. Please try again.'
    }));
  }
};

// @desc    Forgot password - send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    // Decrypt request body if encrypted
    let requestBody = req.body;
    if (req.body && req.body.encrypted) {
      try {
        requestBody = decryptRequest(req.body.encrypted);
      } catch (decryptError) {
        console.error('Decryption failed, using plain body:', decryptError);
        requestBody = req.body; // Fallback to plain if decryption fails
      }
    }
    const { email } = requestBody;

    if (!email) {
      return res.status(400).json(encryptResponse({
        success: false,
        message: 'Please provide an email address'
      }));
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json(encryptResponse({
        success: false,
        message: 'User not found with this email'
      }));
    }

    // Generate OTP
    const otp = generateOTP();

    // Save OTP to database
    // First, delete any existing OTPs for this email
    await OTP.deleteMany({ email });

    // Create new OTP record
    await OTP.create({
      email,
      otp
    });

    // Send OTP via email
    await sendOTPEmail(email, otp);

    res.status(200).json(encryptResponse({
      success: true,
      message: 'OTP sent to your email'
    }));
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json(encryptResponse({
      success: false,
      message: 'Failed to send OTP. Please try again.'
    }));
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    // Decrypt request body if encrypted
    let requestBody = req.body;
    if (req.body && req.body.encrypted) {
      requestBody = decryptRequest(req.body.encrypted);
    }
    const { email, otp } = requestBody;

    if (!email || !otp) {
      return res.status(400).json(encryptResponse({
        success: false,
        message: 'Please provide email and OTP'
      }));
    }

    // Find the OTP record
    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      return res.status(400).json(encryptResponse({
        success: false,
        message: 'OTP expired or not found. Please request a new one.'
      }));
    }

    // Verify OTP
    if (!otpRecord.verifyOTP(otp)) {
      return res.status(400).json(encryptResponse({
        success: false,
        message: 'Invalid OTP'
      }));
    }

    // OTP is valid, generate a temporary token for password reset
    const user = await User.findOne({ email });
    const resetToken = user.getSignedJwtToken(60 * 60); // 1 hour token

    // Delete the OTP record as it's been used
    await OTP.deleteOne({ _id: otpRecord._id });

    res.status(200).json(encryptResponse({
      success: true,
      message: 'OTP verified successfully',
      resetToken
    }));
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json(encryptResponse({
      success: false,
      message: 'Failed to verify OTP. Please try again.'
    }));
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Private (requires token from verifyOTP)
exports.resetPassword = async (req, res) => {
  try {
    // Decrypt request body if encrypted
    let requestBody = req.body;
    if (req.body && req.body.encrypted) {
      requestBody = decryptRequest(req.body.encrypted);
    }
    const { password } = requestBody;

    if (!password) {
      return res.status(400).json(encryptResponse({
        success: false,
        message: 'Please provide a new password'
      }));
    }

    // Get user from the token
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json(encryptResponse({
        success: false,
        message: 'User not found'
      }));
    }



    // Update password
    user.password = password;
    await user.save();

    res.status(200).json(encryptResponse({
      success: true,
      message: 'Password reset successful'
    }));
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json(encryptResponse({
      success: false,
      message: 'Failed to reset password. Please try again.'
    }));
  }
};

// @desc    Change password (when user is logged in)
// @route   POST /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    // Decrypt request body if encrypted
    let requestBody = req.body;
    if (req.body && req.body.encrypted) {
      requestBody = decryptRequest(req.body.encrypted);
    }
    const { currentPassword, newPassword } = requestBody;

    if (!currentPassword || !newPassword) {
      return res.status(400).json(encryptResponse({
        success: false,
        message: 'Please provide current and new password'
      }));
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json(encryptResponse({
        success: false,
        message: 'Current password is incorrect'
      }));
    }



    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json(encryptResponse({
      success: true,
      message: 'Password changed successfully'
    }));
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json(encryptResponse({
      success: false,
      message: 'Failed to change password. Please try again.'
    }));
  }
};
