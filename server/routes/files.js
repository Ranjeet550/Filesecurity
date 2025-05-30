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
const upload = require('../middleware/upload');

const router = express.Router();

// Apply location tracking middleware to all routes
router.use(trackLocation);

router.post('/upload', protect, upload.single('file'), uploadFile);
router.get('/', protect, getFiles);
router.get('/:id', protect, getFile);
router.get('/:id/password', protect, getFilePassword);
router.post('/:id/download', optionalAuth, downloadFile);
router.delete('/:id', protect, deleteFile);

module.exports = router;
