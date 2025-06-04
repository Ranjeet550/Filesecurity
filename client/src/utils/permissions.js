/**
 * Utility functions for checking user permissions
 */

/**
 * Check if user has a specific permission
 * @param {Object} user - User object with role and permissions
 * @param {string} moduleName - Module name (e.g., 'file_management')
 * @param {string} action - Action name (e.g., 'delete', 'create', 'read', 'update')
 * @returns {boolean} - True if user has the permission
 */
export const hasPermission = (user, moduleName, action) => {
  // Check if user exists and has role
  if (!user || !user.role) {
    return false;
  }

  // Admin users have all permissions
  if (user.role.name === 'admin') {
    return true;
  }

  // Check if user has the specific permission
  if (!user.role.permissions || !Array.isArray(user.role.permissions)) {
    return false;
  }

  return user.role.permissions.some(permission => {
    return permission.module?.name === moduleName && 
           permission.action === action &&
           permission.isActive !== false;
  });
};

/**
 * Check if user has any of the specified permissions
 * @param {Object} user - User object with role and permissions
 * @param {Array} permissions - Array of {moduleName, action} objects
 * @returns {boolean} - True if user has any of the permissions
 */
export const hasAnyPermission = (user, permissions) => {
  return permissions.some(({ moduleName, action }) => 
    hasPermission(user, moduleName, action)
  );
};

/**
 * Check if user is admin
 * @param {Object} user - User object with role
 * @returns {boolean} - True if user is admin
 */
export const isAdmin = (user) => {
  return user?.role?.name === 'admin';
};

/**
 * Get all user permissions as a flat array
 * @param {Object} user - User object with role and permissions
 * @returns {Array} - Array of permission strings in format 'module.action'
 */
export const getUserPermissions = (user) => {
  if (!user || !user.role || !user.role.permissions) {
    return [];
  }

  return user.role.permissions
    .filter(permission => permission.isActive !== false)
    .map(permission => `${permission.module?.name}.${permission.action}`)
    .filter(Boolean);
};
