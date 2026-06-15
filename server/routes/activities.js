const express = require('express');
const {
  getActivities,
  getActivity,
  getActivityStats,
  getSystemLogs,
  getUserActivityTimeline,
  exportActivities,
  clearOldActivities
} = require('../controllers/activities');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

// Superadmin check middleware
const isSuperAdmin = (req, res, next) => {
  if (!req.user || (req.user.role?.name !== 'superadmin' && req.user.role !== 'superadmin')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Superadmin privileges required.'
    });
  }
  next();
};

// Apply protection middleware to all routes
router.use(protect);

// Apply superadmin check to all activity routes
router.use(isSuperAdmin);

// Specific routes (must come before parameterized routes)
router.get('/stats', getActivityStats);
router.get('/export', exportActivities);
router.get('/system/logs', getSystemLogs);
router.delete('/clear', clearOldActivities);

// User timeline route
router.get('/user/:userId/timeline', getUserActivityTimeline);

// Generic routes (must come last)
router.get('/', getActivities);
router.get('/:id', getActivity);

module.exports = router;
