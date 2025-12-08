const Setting = require('../models/Setting');
const path = require('path');
const fs = require('fs');

// @desc    Get download limit setting
// @route   GET /api/settings/download-limit
// @access  Private (Admin only)
exports.getDownloadLimit = async (req, res) => {
  try {
    let setting = await Setting.findOne({ key: 'downloadLimit' });
    console.log('Retrieved download limit setting:', setting);

    if (!setting) {
      // Create default setting if not exists
      console.log('Creating default download limit setting');
      setting = await Setting.create({
        key: 'downloadLimit',
        value: 1, // Default: 1 download per user per file
        description: 'Maximum number of downloads allowed per user per file',
        updatedBy: req.user ? req.user._id : null
      });
      console.log('Created default setting:', setting);
    }

    res.status(200).json({
      success: true,
      data: setting
    });
  } catch (error) {
    console.error('Error getting download limit:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Set download limit setting
// @route   PUT /api/settings/download-limit
// @access  Private (Admin only)
exports.setDownloadLimit = async (req, res) => {
  try {
    const { value } = req.body;
    console.log('Setting download limit, value:', value, 'user:', req.user);

    // Validate value
    if (value === undefined || value === null) {
      return res.status(400).json({
        success: false,
        message: 'Value is required'
      });
    }

    const limit = parseInt(value);
    if (isNaN(limit) || limit < 1) {
      return res.status(400).json({
        success: false,
        message: 'Download limit must be a positive integer'
      });
    }

    // Update or create the setting
    const setting = await Setting.findOneAndUpdate(
      { key: 'downloadLimit' },
      {
        key: 'downloadLimit',
        value: limit,
        description: 'Maximum number of downloads allowed per user per file',
        updatedBy: req.user ? req.user._id : null
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    console.log('Download limit setting saved:', setting);

    res.status(200).json({
      success: true,
      data: setting,
      message: 'Download limit updated successfully'
    });
  } catch (error) {
    console.error('Error setting download limit:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload group image
// @route   POST /api/settings/group-image/:groupName
// @access  Private (Admin only)
exports.uploadGroupImage = async (req, res) => {
  try {
    const { groupName } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    const imageFile = req.file;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(imageFile.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Only image files (JPEG, PNG, GIF) are allowed'
      });
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (imageFile.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'Image size must be less than 2MB'
      });
    }

    // Create or update setting for group image
    const setting = await Setting.findOneAndUpdate(
      { key: `groupImage_${groupName}` },
      {
        key: `groupImage_${groupName}`,
        value: imageFile.filename, // Store filename
        description: `Group image for ${groupName}`,
        updatedBy: req.user._id
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: setting,
      message: 'Group image uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading group image:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get group image
// @route   GET /api/settings/group-image/:groupName
// @access  Private
exports.getGroupImage = async (req, res) => {
  try {
    const { groupName } = req.params;

    const setting = await Setting.findOne({ key: `groupImage_${groupName}` });

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Group image not found'
      });
    }

    // Return the image file
    const imagePath = path.join(__dirname, '..', 'uploads', setting.value);

    if (!require('fs').existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        message: 'Image file not found'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/jpeg'); // Default, will be overridden by actual file
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    // Send the file
    res.sendFile(imagePath);
  } catch (error) {
    console.error('Error getting group image:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete group image
// @route   DELETE /api/settings/group-image/:groupName
// @access  Private (Admin only)
exports.deleteGroupImage = async (req, res) => {
  try {
    const { groupName } = req.params;

    const setting = await Setting.findOne({ key: `groupImage_${groupName}` });

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Group image not found'
      });
    }

    // Delete the physical file
    const fs = require('fs');
    const imagePath = path.join(__dirname, '..', 'uploads', setting.value);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Delete the setting
    await Setting.findByIdAndDelete(setting._id);

    res.status(200).json({
      success: true,
      message: 'Group image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting group image:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all group images
// @route   GET /api/settings/group-images
// @access  Private
exports.getAllGroupImages = async (req, res) => {
  try {
    const settings = await Setting.find({
      key: { $regex: '^groupImage_' }
    }).populate('updatedBy', 'name email');

    // Transform to group-based structure
    const groupImages = {};
    settings.forEach(setting => {
      const groupName = setting.key.replace('groupImage_', '');
      groupImages[groupName] = {
        filename: setting.value,
        uploadedAt: setting.updatedAt,
        uploadedBy: setting.updatedBy
      };
    });

    res.status(200).json({
      success: true,
      data: groupImages
    });
  } catch (error) {
    console.error('Error getting group images:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get session timeout setting
// @route   GET /api/settings/session-timeout
// @access  Private (Admin only)
exports.getSessionTimeout = async (req, res) => {
  try {
    let setting = await Setting.findOne({ key: 'sessionTimeout' });

    if (!setting) {
      // Create default setting if not exists
      setting = await Setting.create({
        key: 'sessionTimeout',
        value: 480, // Default: 8 hours in minutes
        description: 'Maximum session duration in minutes',
        updatedBy: req.user ? req.user._id : null
      });
    }

    res.status(200).json({
      success: true,
      data: setting
    });
  } catch (error) {
    console.error('Error getting session timeout:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Set session timeout setting
// @route   PUT /api/settings/session-timeout
// @access  Private (Admin only)
exports.setSessionTimeout = async (req, res) => {
  try {
    const { value } = req.body;

    // Validate value
    if (value === undefined || value === null) {
      return res.status(400).json({
        success: false,
        message: 'Value is required'
      });
    }

    const timeout = parseInt(value);
    if (isNaN(timeout) || timeout < 1) {
      return res.status(400).json({
        success: false,
        message: 'Session timeout must be a positive integer'
      });
    }

    // Update or create the setting
    const setting = await Setting.findOneAndUpdate(
      { key: 'sessionTimeout' },
      {
        key: 'sessionTimeout',
        value: timeout,
        description: 'Maximum session duration in minutes',
        updatedBy: req.user ? req.user._id : null
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: setting,
      message: 'Session timeout updated successfully'
    });
  } catch (error) {
    console.error('Error setting session timeout:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get activity timeout setting
// @route   GET /api/settings/activity-timeout
// @access  Private (Admin only)
exports.getActivityTimeout = async (req, res) => {
  try {
    let setting = await Setting.findOne({ key: 'activityTimeout' });

    if (!setting) {
      // Create default setting if not exists
      setting = await Setting.create({
        key: 'activityTimeout',
        value: 30, // Default: 30 minutes
        description: 'Inactivity timeout in minutes before session expires',
        updatedBy: req.user ? req.user._id : null
      });
    }

    res.status(200).json({
      success: true,
      data: setting
    });
  } catch (error) {
    console.error('Error getting activity timeout:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Set activity timeout setting
// @route   PUT /api/settings/activity-timeout
// @access  Private (Admin only)
exports.setActivityTimeout = async (req, res) => {
  try {
    const { value } = req.body;

    // Validate value
    if (value === undefined || value === null) {
      return res.status(400).json({
        success: false,
        message: 'Value is required'
      });
    }

    const timeout = parseInt(value);
    if (isNaN(timeout) || timeout < 1) {
      return res.status(400).json({
        success: false,
        message: 'Activity timeout must be a positive integer'
      });
    }

    // Update or create the setting
    const setting = await Setting.findOneAndUpdate(
      { key: 'activityTimeout' },
      {
        key: 'activityTimeout',
        value: timeout,
        description: 'Inactivity timeout in minutes before session expires',
        updatedBy: req.user ? req.user._id : null
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: setting,
      message: 'Activity timeout updated successfully'
    });
  } catch (error) {
    console.error('Error setting activity timeout:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all settings
// @route   GET /api/settings
// @access  Private (Admin only)
exports.getAllSettings = async (req, res) => {
  try {
    const settings = await Setting.find().populate('updatedBy', 'name email');

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};