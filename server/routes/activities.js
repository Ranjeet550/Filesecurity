const express = require('express');
const {
  getActivities,
  getActivity,
  getActivityStats
} = require('../controllers/activities');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');

const router = express.Router();

// Apply protection middleware to all routes
router.use(protect);

// Activity routes
router.get('/', checkPermission('system_management', 'read'), getActivities);
router.get('/stats', checkPermission('system_management', 'read'), getActivityStats);
router.get('/:id', checkPermission('system_management', 'read'), getActivity);

module.exports = router;
