const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Set user in request with role populated
    req.user = await User.findById(decoded.id).populate('role');
    console.log(`Auth: User ${req.user?.email} authenticated with role: ${req.user?.role?.name}`);

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Optional authentication - populates req.user if token exists but doesn't require it
exports.optionalAuth = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token, continue without user
  if (!token) {
    return next();
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Set user in request with role populated
    req.user = await User.findById(decoded.id).populate('role');

    next();
  } catch (err) {
    // If token is invalid, continue without user (don't throw error)
    next();
  }
};

// Grant access to specific roles (deprecated - use checkPermission instead)
exports.authorize = (...roleNames) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'User role not found'
      });
    }

    if (!roleNames.includes(req.user.role.name)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role.name} is not authorized to access this route`
      });
    }
    next();
  };
};
