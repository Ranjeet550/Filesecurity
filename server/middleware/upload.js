const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory from middleware...');
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set storage engine
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    // Generate a unique filename with original extension
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Check file type and set proper MIME type
const fileFilter = (req, file, cb) => {
  // Allow all file types for now
  // In a production app, you might want to restrict file types

  // Ensure the mimetype is correctly set based on file extension
  const ext = path.extname(file.originalname).toLowerCase();

  // Map common extensions to MIME types
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.zip': 'application/zip',
    '.txt': 'text/plain',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4'
  };

  // Override mimetype if we can determine it from extension
  if (mimeTypes[ext]) {
    file.mimetype = mimeTypes[ext];
    console.log(`Set file mimetype to ${file.mimetype} based on extension ${ext}`);
  }

  cb(null, true);
};

// Initialize upload with better form field handling
const upload = multer({
  storage: storage,
  // No file size limits - unlimited storage
  fileFilter: fileFilter,
  // Ensure form fields are preserved
  limits: {
    fieldSize: 1024 * 1024, // 1MB for field values
    fieldNameSize: 100
  }
});

module.exports = upload;
