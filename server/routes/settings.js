const express = require('express');
const {
  getDownloadLimit,
  setDownloadLimit,
  getSessionTimeout,
  setSessionTimeout,
  getActivityTimeout,
  setActivityTimeout,
  getAllSettings,
  uploadGroupImage,
  getGroupImage,
  deleteGroupImage,
  getAllGroupImages
} = require('../controllers/settings');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/permission');
const upload = require('../middleware/upload');

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// Routes for download limit setting
// Allow all authenticated users to read download limit (needed for UI)
router.route('/download-limit')
  .get(protect, getDownloadLimit)
  .put(checkPermission('settings', 'update'), setDownloadLimit);

// Routes for session timeout setting
router.route('/session-timeout')
  .get(checkPermission('settings', 'read'), getSessionTimeout)
  .put(checkPermission('settings', 'update'), setSessionTimeout);

// Routes for activity timeout setting
router.route('/activity-timeout')
  .get(checkPermission('settings', 'read'), getActivityTimeout)
  .put(checkPermission('settings', 'update'), setActivityTimeout);

// Route for all settings (admin only)
router.route('/')
  .get(checkPermission('settings', 'read'), getAllSettings);

// Routes for group images
router.route('/group-images')
  .get(protect, getAllGroupImages);

router.route('/group-image/:groupName')
  .get(protect, getGroupImage)
  .post(protect, checkPermission('settings', 'update'), upload.single('image'), uploadGroupImage)
  .delete(protect, checkPermission('settings', 'update'), deleteGroupImage);

module.exports = router;