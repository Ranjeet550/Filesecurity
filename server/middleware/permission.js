const Role = require('../models/Role');
const Module = require('../models/Module');

// Check if user has permission for specific module and action
exports.checkPermission = (moduleName, action) => {
  return async (req, res, next) => {
    try {
      // Check if user exists
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized to access this route'
        });
      }

      // Get user's role with permissions
      const userRole = await Role.findById(req.user.role)
        .populate({
          path: 'permissions',
          populate: {
            path: 'module',
            model: 'Module'
          }
        });

      if (!userRole || !userRole.isActive) {
        return res.status(403).json({
          success: false,
          message: 'User role not found or inactive'
        });
      }

      // Check if user has the required permission
      console.log(`Checking permission for ${req.user.email}: ${moduleName}.${action}`);
      console.log(`User role: ${userRole.name}, Permissions count: ${userRole.permissions.length}`);

      // Temporary bypass for admin users
      if (userRole.name === 'admin') {
        console.log(`✓ Admin user - bypassing permission check`);
        req.userPermissions = userRole.permissions;
        return next();
      }

      const hasPermission = userRole.permissions.some(permission => {
        const match = permission.module.name === moduleName &&
                     permission.action === action &&
                     permission.isActive;
        if (match) {
          console.log(`✓ Found matching permission: ${permission.module.name}.${permission.action}`);
        }
        return match;
      });

      console.log(`Permission check result: ${hasPermission}`);

      if (!hasPermission) {
        console.log(`❌ Access denied for ${req.user.email}: ${moduleName}.${action}`);
        return res.status(403).json({
          success: false,
          message: `Access denied. Required permission: ${action} on ${moduleName}`
        });
      }

      // Add user permissions to request for future use
      req.userPermissions = userRole.permissions;

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during permission check'
      });
    }
  };
};

// Check if user has any of the specified permissions
exports.checkAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      // Check if user exists
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized to access this route'
        });
      }

      // Get user's role with permissions
      const userRole = await Role.findById(req.user.role)
        .populate({
          path: 'permissions',
          populate: {
            path: 'module',
            model: 'Module'
          }
        });

      if (!userRole || !userRole.isActive) {
        return res.status(403).json({
          success: false,
          message: 'User role not found or inactive'
        });
      }

      // Check if user has any of the required permissions
      const hasAnyPermission = permissions.some(({ moduleName, action }) =>
        userRole.permissions.some(permission => 
          permission.module.name === moduleName && 
          permission.action === action &&
          permission.isActive
        )
      );

      if (!hasAnyPermission) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions'
        });
      }

      // Add user permissions to request for future use
      req.userPermissions = userRole.permissions;
      
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during permission check'
      });
    }
  };
};

// Middleware to add user permissions to request without checking
exports.addUserPermissions = async (req, res, next) => {
  try {
    if (req.user && req.user.role) {
      const userRole = await Role.findById(req.user.role)
        .populate({
          path: 'permissions',
          populate: {
            path: 'module',
            model: 'Module'
          }
        });

      if (userRole && userRole.isActive) {
        req.userPermissions = userRole.permissions;
        req.userRole = userRole;
      }
    }
    
    next();
  } catch (error) {
    console.error('Add user permissions error:', error);
    next(); // Continue without permissions
  }
};
