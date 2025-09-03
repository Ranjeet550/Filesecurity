const express = require('express');
const {
  uploadFile,
  getFiles,
  getFile,
  downloadFile,
  deleteFile,
  getFilePassword,
  assignFileToUsers,
  acceptFile
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



// Upload file
router.post('/upload', protect, checkPermission('file_management', 'create'), upload.fields([{ name: 'file', maxCount: 1 }]), uploadFile);

// Get all files
router.get('/', protect, checkPermission('file_management', 'read'), getFiles);

// Get file by ID
router.get('/:id', protect, checkPermission('file_management', 'read'), getFile);

// Get file password
router.get('/:id/password', protect, checkPermission('file_management', 'read'), getFilePassword);

// Download file
router.post('/:id/download', optionalAuth, downloadFile);

// Delete file
router.delete('/:id', protect, checkPermission('file_management', 'delete'), deleteFile);

// Assign file to users (admin only)
router.post('/:id/assign', protect, checkPermission('file_management', 'update'), assignFileToUsers);

// Accept file (assigned user only)
router.post('/:id/accept', protect, acceptFile);

module.exports = router;
