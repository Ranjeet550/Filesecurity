const Activity = require('../models/Activity');

/**
 * Logger middleware for tracking all application activities
 * This middleware captures request details and logs them to the database
 */
exports.activityLogger = async (req, res, next) => {
  // Store the original end function
  const originalEnd = res.end;
  
  // Get the start time
  const startTime = Date.now();
  
  // Create a log entry with initial data
  const logEntry = {
    user: req.user ? req.user._id : null,
    ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
    method: req.method,
    path: req.originalUrl || req.url,
    userAgent: req.headers['user-agent'] || 'Unknown',
    location: req.userLocation || {
      latitude: 0,
      longitude: 0,
      city: 'Unknown',
      country: 'Unknown'
    }
  };

  // Override the res.end function to capture the response status
  res.end = function(chunk, encoding) {
    // Call the original end function
    originalEnd.call(this, chunk, encoding);
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Add status code to log entry
    logEntry.statusCode = res.statusCode;
    
    // Log the activity asynchronously (don't wait for it to complete)
    logActivity(req, res, logEntry, responseTime).catch(err => {
      console.error('Error logging activity:', err);
    });
  };
  
  // Continue to the next middleware
  next();
};

/**
 * Log an activity to the database
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} logEntry - Basic log entry data
 * @param {Number} responseTime - Response time in milliseconds
 */
async function logActivity(req, res, logEntry, responseTime) {
  try {
    // Determine activity type and action based on the path
    const { activityType, action, description } = determineActivityTypeAndAction(req);
    
    // Create activity log
    await Activity.create({
      ...logEntry,
      activityType,
      action,
      description,
      data: {
        // Include safe request data (avoid logging sensitive information)
        params: req.params,
        query: req.query,
        // Include only safe body fields (exclude passwords, etc.)
        body: sanitizeRequestBody(req.body),
        responseTime,
        // Add any other relevant data
        timestamp: new Date()
      }
    });
    
    // Log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ACTIVITY] ${activityType}:${action} - ${description} (${responseTime}ms)`);
    }
  } catch (error) {
    // Log error but don't affect the request flow
    console.error('Error saving activity log:', error);
  }
}

/**
 * Determine the activity type and action based on the request
 * @param {Object} req - Express request object
 * @returns {Object} Activity type, action and description
 */
function determineActivityTypeAndAction(req) {
  const path = req.originalUrl || req.url;
  const method = req.method;
  
  // Auth activities
  if (path.startsWith('/api/auth')) {
    if (path.includes('/login') && method === 'POST') {
      return {
        activityType: 'auth',
        action: 'login',
        description: `User login attempt${req.user ? ' successful' : ' failed'}`
      };
    } else if (path.includes('/register') && method === 'POST') {
      return {
        activityType: 'auth',
        action: 'register',
        description: 'User registration'
      };
    } else if (path.includes('/profile') && method === 'PUT') {
      return {
        activityType: 'user',
        action: 'update_profile',
        description: 'User profile update'
      };
    } else if (path.includes('/profile-picture') && method === 'POST') {
      return {
        activityType: 'user',
        action: 'update_profile_picture',
        description: 'User profile picture update'
      };
    } else if (path.includes('/forgot-password') && method === 'POST') {
      return {
        activityType: 'auth',
        action: 'forgot_password',
        description: 'Password reset request'
      };
    } else if (path.includes('/reset-password') && method === 'POST') {
      return {
        activityType: 'auth',
        action: 'reset_password',
        description: 'Password reset'
      };
    } else if (path.includes('/change-password') && method === 'POST') {
      return {
        activityType: 'auth',
        action: 'change_password',
        description: 'Password change'
      };
    }
  }
  
  // File activities
  else if (path.startsWith('/api/files')) {
    if (path.includes('/upload') && method === 'POST') {
      return {
        activityType: 'file',
        action: 'upload',
        description: 'File upload'
      };
    } else if (method === 'GET' && !path.includes('/download') && path !== '/api/files/') {
      return {
        activityType: 'file',
        action: 'view',
        description: 'File view'
      };
    } else if (path.includes('/download') || (path.match(/\/api\/files\/[^\/]+$/) && method === 'POST')) {
      return {
        activityType: 'file',
        action: 'download',
        description: 'File download'
      };
    } else if (method === 'DELETE') {
      return {
        activityType: 'file',
        action: 'delete',
        description: 'File deletion'
      };
    } else if (method === 'GET' && path === '/api/files/') {
      return {
        activityType: 'file',
        action: 'list',
        description: 'File listing'
      };
    }
  }
  
  // User management activities
  else if (path.startsWith('/api/users')) {
    if (method === 'GET' && path === '/api/users') {
      return {
        activityType: 'user',
        action: 'list',
        description: 'User listing'
      };
    } else if (method === 'GET' && path.match(/\/api\/users\/[^\/]+$/)) {
      return {
        activityType: 'user',
        action: 'view',
        description: 'User view'
      };
    } else if (method === 'POST') {
      return {
        activityType: 'user',
        action: 'create',
        description: 'User creation'
      };
    } else if (method === 'PUT' || method === 'PATCH') {
      return {
        activityType: 'user',
        action: 'update',
        description: 'User update'
      };
    } else if (method === 'DELETE') {
      return {
        activityType: 'user',
        action: 'delete',
        description: 'User deletion'
      };
    }
  }
  
  // Default for unrecognized paths
  return {
    activityType: 'system',
    action: 'access',
    description: `${method} ${path}`
  };
}

/**
 * Sanitize request body to remove sensitive information
 * @param {Object} body - Request body
 * @returns {Object} Sanitized body
 */
function sanitizeRequestBody(body) {
  if (!body) return {};
  
  // Create a copy of the body
  const sanitized = { ...body };
  
  // List of sensitive fields to remove
  const sensitiveFields = ['password', 'newPassword', 'confirmPassword', 'token', 'otp'];
  
  // Remove sensitive fields
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

/**
 * Utility function to log activities programmatically from anywhere in the code
 * @param {Object} options - Activity options
 */
exports.logActivity = async (options) => {
  try {
    const {
      user = null,
      ipAddress = 'Internal',
      activityType = 'system',
      action,
      description,
      data = {},
      method = 'SYSTEM',
      path = 'internal',
      statusCode = 200,
      location = {
        latitude: 0,
        longitude: 0,
        city: 'Unknown',
        country: 'Unknown'
      },
      userAgent = 'System'
    } = options;
    
    // Create activity log
    await Activity.create({
      user,
      ipAddress,
      activityType,
      action,
      description,
      data,
      method,
      path,
      statusCode,
      location,
      userAgent,
      timestamp: new Date()
    });
    
    // Log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ACTIVITY] ${activityType}:${action} - ${description}`);
    }
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};
