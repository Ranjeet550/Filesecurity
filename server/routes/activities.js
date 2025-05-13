const express = require('express');
const {
  getActivities,
  getActivity,
  getActivityStats
} = require('../controllers/activities');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

const router = express.Router();

// Apply protection middleware to all routes
router.use(protect);
// Restrict access to admin users only
router.use(adminOnly);

// Activity routes
router.get('/', getActivities);
router.get('/stats', getActivityStats);
router.get('/:id', getActivity);

module.exports = router;
