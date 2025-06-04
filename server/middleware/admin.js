/**
 * Middleware to restrict access to admin users only (deprecated - use checkPermission instead)
 */
exports.adminOnly = (req, res, next) => {
  // Check if user exists and has admin role
  if (!req.user || !req.user.role || req.user.role.name !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }

  next();
};
