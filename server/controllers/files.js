const File = require('../models/File');
const fs = require('fs');
const path = require('path');
const { logActivity } = require('../middleware/logger');
const { encryptFile } = require('../utils/fileEncryption');
const { protectUploadedPDF, protectUploadedExcel } = require('../utils/pdfProtection');

// @desc    Upload a file
// @route   POST /api/files/upload
// @access  Private (requires file_management create permission)
exports.uploadFile = async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('Request body:', req.body);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Password in body:', req.body.password);
    console.log('Request files:', req.files);
    console.log('User:', req.user);
    
    // Extract location data from form fields
    let userLocation = {
      latitude: 0,
      longitude: 0,
      city: 'Unknown',
      country: 'Unknown'
    };
    
    if (req.body.latitude && req.body.longitude) {
      userLocation = {
        latitude: parseFloat(req.body.latitude) || 0,
        longitude: parseFloat(req.body.longitude) || 0,
        city: req.body.city || 'Unknown',
        country: req.body.country || 'Unknown'
      };
      console.log('Location data extracted from form:', userLocation);
    } else {
      console.log('No location data found in form, using default');
    }

    if (!req.files || !req.files.file || req.files.file.length === 0) {
      console.log('No file found in request');
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const uploadedFile = req.files.file[0];
    console.log('File details:', {
      filename: uploadedFile.filename,
      originalName: uploadedFile.originalname,
      path: uploadedFile.path,
      size: uploadedFile.size,
      mimetype: uploadedFile.mimetype
    });

    // Check if a custom password was provided, otherwise generate one
    let password;
    console.log('Request body for password check:', req.body);
    console.log('Password field in body:', req.body.password);
    console.log('Password field type:', typeof req.body.password);
    
    if (req.body.password && req.body.password.trim()) {
      const customPassword = req.body.password.trim();
      
      // Validate custom password length (minimum 8 characters)
      if (customPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Custom password must be at least 8 characters long'
        });
      }
      
      password = customPassword;
      console.log('Using custom password from request:', password);
    } else {
      password = File.generatePassword();
      console.log('Generated random password:', password);
    }

    // Normalize the file path to ensure consistency
    const normalizedPath = path.normalize(uploadedFile.path);
    console.log('Original file path:', uploadedFile.path);
    console.log('Normalized file path:', normalizedPath);

    // Determine the correct MIME type based on file extension if not provided
    let mimeType = uploadedFile.mimetype;

          // If mimetype is missing or generic, determine it from the file extension
      if (!mimeType || mimeType === 'application/octet-stream') {
        const ext = path.extname(uploadedFile.originalname).toLowerCase();

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

      mimeType = mimeTypes[ext] || 'application/octet-stream';
      console.log(`Determined MIME type from extension ${ext}: ${mimeType}`);
    }

    console.log('File MIME type for upload:', mimeType);

    // Handle file protection based on file type
    let finalFilePath = normalizedPath;
    let finalFilename = uploadedFile.filename;
    let finalSize = uploadedFile.size;

    if (mimeType === 'application/pdf') {
      try {
        console.log('PDF file detected, applying password protection...');
        const protectionResult = await protectUploadedPDF(
          normalizedPath,
          password,
          uploadedFile.originalname
        );

        if (protectionResult.success) {
          finalFilePath = protectionResult.protectedFilePath;
          finalFilename = protectionResult.protectedFileName;

          // Get the size of the protected PDF
          const stats = fs.statSync(finalFilePath);
          finalSize = stats.size;

          console.log('PDF protection successful:', {
            originalPath: normalizedPath,
            protectedPath: finalFilePath,
            originalSize: uploadedFile.size,
            protectedSize: finalSize
          });
        }
      } catch (error) {
        console.error('Error protecting PDF:', error);
        // Continue with original file if protection fails
        console.log('Continuing with original file due to protection error');
      }
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
               mimeType === 'application/vnd.ms-excel') {
      try {
        console.log('Excel file detected, applying password protection...');
        const protectionResult = await protectUploadedExcel(
          normalizedPath,
          password,
          uploadedFile.originalname
        );

        if (protectionResult.success) {
          finalFilePath = protectionResult.protectedFilePath;
          finalFilename = protectionResult.protectedFileName;

          // Get the size of the protected Excel file
          const stats = fs.statSync(finalFilePath);
          finalSize = stats.size;

          console.log('Excel protection successful:', {
            originalPath: normalizedPath,
            protectedPath: finalFilePath,
            originalSize: uploadedFile.size,
            protectedSize: finalSize,
            protection: protectionResult.protection
          });
        }
      } catch (error) {
        console.error('Error protecting Excel file:', error);
        // Continue with original file if protection fails
        console.log('Continuing with original file due to protection error');
      }
    }

    // Create file record in database
    const file = await File.create({
      filename: finalFilename,
      originalName: uploadedFile.originalname,
      path: finalFilePath,
      size: finalSize,
      mimetype: mimeType,
      password: password,
      uploadedBy: req.user.id,
      uploadLocation: userLocation
    });

    // Log file upload activity
    await logActivity({
      user: req.user._id,
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
      activityType: 'file',
      action: 'upload',
      description: `File "${file.originalName}" uploaded successfully`,
      data: {
        fileId: file._id,
        filename: file.originalName,
        size: file.size,
        mimetype: file.mimetype
      },
      method: req.method,
      path: req.originalUrl,
      statusCode: 201,
      location: userLocation,
      userAgent: req.headers['user-agent'] || 'Unknown'
    });

    res.status(201).json({
      success: true,
      data: {
        id: file._id,
        filename: file.originalName,
        password: password,
        uploadedAt: file.createdAt,
        expiresAt: file.expiresAt
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all files assigned to user (or all files for admin)
// @route   GET /api/files
// @access  Private (requires file_management read permission)
exports.getFiles = async (req, res) => {
  try {
    let query = {};
    let selectFields = 'originalName size createdAt expiresAt downloads mimetype uploadLocation assignedTo uploadedBy';
    // Always populate uploadedBy with name/email for all users
    const userRole = req.user.role;
    const isAdmin = userRole && (userRole.name === 'admin' || (typeof userRole === 'string' && userRole === 'admin'));

    if (isAdmin) {
      // Admin can see all files
      query = {}; // No filter - get all files
      console.log('Admin user requesting all files');
    } else {
      // Regular users can only see files assigned to them or uploaded by them
      query = { $or: [
        { assignedTo: req.user.id },
        { uploadedBy: req.user.id }
      ] };
      console.log(`User ${req.user.email} requesting their assigned files`);
    }

    let filesQuery = File.find(query)
      .select(selectFields)
      .sort('-createdAt')
      .populate({ path: 'uploadedBy', select: 'name email' });

    const files = await filesQuery;

    res.status(200).json({
      success: true,
      count: files.length,
      data: files,
      isAdmin: isAdmin
    });
  } catch (error) {
    console.error('Error in getFiles:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Assign a file to users (admin only)
// @route   POST /api/files/:id/assign
// @access  Private (admin only)
exports.assignFileToUsers = async (req, res) => {
  try {
    const userRole = req.user.role;
    const isAdmin = userRole && (userRole.name === 'admin' || (typeof userRole === 'string' && userRole === 'admin'));
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Only admin can assign files.' });
    }

    const fileId = req.params.id;
    const { userIds } = req.body; // expects array of user IDs
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: 'userIds array is required.' });
    }

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    // Assign users (avoid duplicates)
    file.assignedTo = Array.from(new Set([...(file.assignedTo || []), ...userIds]));
    await file.save();

    res.status(200).json({ success: true, message: 'File assigned to users.', data: file });
  } catch (error) {
    console.error('Error in assignFileToUsers:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get file by ID
// @route   GET /api/files/:id
// @access  Private (requires file_management read permission)
exports.getFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }


    // Check if user is the owner, admin, or assigned to the file
    const userRole = req.userRole || req.user.role;
    const isAdmin = userRole && (userRole.name === 'admin' || (typeof userRole === 'string' && userRole === 'admin'));
    const isUploader = file.uploadedBy.toString() === req.user.id;
    const isAssigned = Array.isArray(file.assignedTo) && file.assignedTo.map(id => id.toString()).includes(req.user.id);

    if (!isUploader && !isAdmin && !isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this file'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: file._id,
        filename: file.originalName,
        size: file.size,
        uploadedAt: file.createdAt,
        downloads: file.downloads.length,
        uploadLocation: file.uploadLocation
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Download file
// @route   POST /api/files/:id/download
// @access  Public (with password)
exports.downloadFile = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Verify password
    if (!file.verifyPassword(password)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Record download information (always record, even for anonymous downloads)
    console.log('Recording download for file:', file._id, 'User:', req.user ? req.user.id : 'anonymous');
    
    // Ensure location data is available
    const downloadLocation = req.userLocation || {
      latitude: 0,
      longitude: 0,
      city: 'Unknown',
      country: 'Unknown'
    };
    
    file.downloads.push({
      user: req.user ? req.user.id : null,
      location: downloadLocation
    });
    await file.save();
    console.log('Download recorded. Total downloads for this file:', file.downloads.length);

    // Check if file exists on disk
    // Try different path resolutions to find the file
    let filePath = file.path; // Original path stored in DB
    let fileExists = fs.existsSync(filePath);

    // If not found, try with __dirname
    if (!fileExists) {
      filePath = path.join(__dirname, '..', file.path);
      fileExists = fs.existsSync(filePath);
      console.log('Trying path with __dirname:', filePath, 'Exists:', fileExists);
    }

    // If still not found, try with absolute path from uploads dir
    if (!fileExists) {
      filePath = path.join(__dirname, '..', 'uploads', file.filename);
      fileExists = fs.existsSync(filePath);
      console.log('Trying path with uploads dir:', filePath, 'Exists:', fileExists);
    }

    // If still not found, try with just the filename
    if (!fileExists) {
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      const files = fs.readdirSync(uploadsDir);
      console.log('Files in uploads directory:', files);

      // Check if the filename exists in the uploads directory
      if (files.includes(file.filename)) {
        filePath = path.join(uploadsDir, file.filename);
        fileExists = true;
        console.log('Found file by name in uploads directory:', filePath);
      }
    }

    if (!fileExists) {
      // Log file not found error
      await logActivity({
        user: req.user ? req.user._id : null,
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
        activityType: 'file',
        action: 'download_error',
        description: 'File not found on server',
        data: {
          fileId: file._id,
          filename: file.originalName,
          storedPath: file.path,
          attemptedPaths: [
            file.path,
            path.join(__dirname, '..', file.path),
            path.join(__dirname, '..', 'uploads', file.filename)
          ]
        },
        method: req.method,
        path: req.originalUrl,
        statusCode: 404,
        location: downloadLocation,
        userAgent: req.headers['user-agent'] || 'Unknown'
      });

      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Log successful download
    await logActivity({
      user: req.user ? req.user._id : null,
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
      activityType: 'file',
      action: 'download',
      description: `File "${file.originalName}" downloaded successfully`,
      data: {
        fileId: file._id,
        filename: file.originalName,
        size: file.size,
        mimetype: file.mimetype,
        uploadedBy: file.uploadedBy
      },
      method: req.method,
      path: req.originalUrl,
      statusCode: 200,
      location: downloadLocation,
      userAgent: req.headers['user-agent'] || 'Unknown'
    });

    // Determine the correct MIME type
    let mimeType = file.mimetype;

    // If mimetype is missing or generic, try to determine it from the file extension
    if (!mimeType || mimeType === 'application/octet-stream') {
      const ext = path.extname(file.originalName).toLowerCase();

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

      mimeType = mimeTypes[ext] || 'application/octet-stream';
      console.log(`Determined MIME type from extension ${ext}: ${mimeType}`);
    }

    console.log('File MIME type:', mimeType);

    try {
      // Make sure the path is absolute
      const absolutePath = path.resolve(filePath);
      console.log('File absolute path:', absolutePath);

      // Handle protected files differently - serve them directly
      if (mimeType === 'application/pdf') {
        console.log('Serving password-protected PDF directly');

        // Set headers for PDF download with original filename
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Pragma', 'no-cache');

        // Log headers for debugging
        console.log('PDF Response headers:', res.getHeaders());

        // Send the password-protected PDF directly
        fs.createReadStream(absolutePath).pipe(res);
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                 mimeType === 'application/vnd.ms-excel') {
        console.log('Serving password-protected Excel file directly');

        // Set headers for Excel download with original filename
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        res.setHeader('Content-Type', mimeType);
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Pragma', 'no-cache');

        // Log headers for debugging
        console.log('Excel Response headers:', res.getHeaders());

        // Send the password-protected Excel file directly
        fs.createReadStream(absolutePath).pipe(res);
      } else {
        // For non-PDF files, use the existing encryption method
        console.log('Encrypting non-PDF file with password:', password);
        const encryptedFilePath = await encryptFile(
          absolutePath,
          password,
          file.originalName,
          mimeType
        );
        console.log('Encrypted file created at:', encryptedFilePath);

        // Set a new filename for the encrypted file
        const encryptedFileName = `${path.basename(file.originalName, path.extname(file.originalName))}_protected.html`;

        // Set headers to force download and prevent navigation
        res.setHeader('Content-Disposition', `attachment; filename="${encryptedFileName}"`);
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Pragma', 'no-cache');

        // Log all headers for debugging
        console.log('Response headers:', res.getHeaders());

        // Send the encrypted file
        fs.createReadStream(encryptedFilePath).pipe(res);

        // Delete the encrypted file after sending
        res.on('finish', () => {
          try {
            if (fs.existsSync(encryptedFilePath)) {
              fs.unlinkSync(encryptedFilePath);
              console.log('Temporary encrypted file deleted:', encryptedFilePath);
            }
          } catch (error) {
            console.error('Error deleting temporary encrypted file:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error processing file for download:', error);
      return res.status(500).json({
        success: false,
        message: 'Error processing file for download'
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get file password for sharing
// @route   GET /api/files/:id/password
// @access  Private (requires file_management read permission)
exports.getFilePassword = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check if user is the owner of the file or admin
    const userRole = req.user.role;
    const isAdmin = userRole && (userRole.name === 'admin' || (typeof userRole === 'string' && userRole === 'admin'));

    if (file.uploadedBy.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this file'
      });
    }

    // Log password retrieval activity
    await logActivity({
      user: req.user._id,
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
      activityType: 'file',
      action: 'password_retrieval',
      description: `Password retrieved for file "${file.originalName}"`,
      data: {
        fileId: file._id,
        filename: file.originalName
      },
      method: req.method,
      path: req.originalUrl,
      statusCode: 200,
      location: req.userLocation || { latitude: 0, longitude: 0, city: 'Unknown', country: 'Unknown' },
      userAgent: req.headers['user-agent'] || 'Unknown'
    });

    res.status(200).json({
      success: true,
      data: {
        password: file.password
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete file
// @route   DELETE /api/files/:id
// @access  Private (requires file_management delete permission)
exports.deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check if user is the owner of the file or has admin role
    // Permission middleware already checked for file_management delete permission
    const userRole = req.userRole || req.user.role;
    const isAdmin = userRole && (userRole.name === 'admin' || (typeof userRole === 'string' && userRole === 'admin'));

    // Allow deletion if user is admin or owner of the file
    if (file.uploadedBy.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this file'
      });
    }

    // Delete file from disk
    const filePath = path.join(__dirname, '..', file.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete file from database
    await file.deleteOne();

    // Log file deletion activity
    await logActivity({
      user: req.user._id,
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
      activityType: 'file',
      action: 'delete',
      description: `File "${file.originalName}" deleted successfully`,
      data: {
        fileId: file._id,
        filename: file.originalName,
        size: file.size,
        mimetype: file.mimetype
      },
      method: req.method,
      path: req.originalUrl,
      statusCode: 200,
      location: req.userLocation || { latitude: 0, longitude: 0, city: 'Unknown', country: 'Unknown' },
      userAgent: req.headers['user-agent'] || 'Unknown'
    });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
