const express = require('express');
const {
  uploadFile,
  getFiles,
  getFile,
  downloadFile,
  deleteFile,
  getFilePassword
} = require('../controllers/files');
const { protect, optionalAuth } = require('../middleware/auth');
const { trackLocation } = require('../middleware/location');
const { checkPermission } = require('../middleware/permission');
const upload = require('../middleware/upload');

const router = express.Router();

// Apply location tracking middleware to all routes except upload (which needs special handling)
router.use((req, res, next) => {
  if (req.path === '/upload' && req.method === 'POST') {
    // Skip location tracking for upload route - it will be handled in the controller
    next();
  } else {
    trackLocation(req, res, next);
  }
});

router.post('/upload', protect, checkPermission('file_management', 'create'), upload.fields([{ name: 'file', maxCount: 1 }]), uploadFile);
router.get('/', protect, checkPermission('file_management', 'read'), getFiles);
router.get('/:id', protect, checkPermission('file_management', 'read'), getFile);
router.get('/:id/password', protect, checkPermission('file_management', 'read'), getFilePassword);
router.post('/:id/download', optionalAuth, downloadFile);
router.delete('/:id', protect, checkPermission('file_management', 'delete'), deleteFile);

module.exports = router;
