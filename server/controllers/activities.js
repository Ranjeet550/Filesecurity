const Activity = require('../models/Activity');
const { encryptResponse } = require('../utils/responseEncryption');

/**
 * @desc    Get all activities with pagination and filtering
 * @route   GET /api/activities
 * @access  Private/Admin
 */
exports.getActivities = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    
    // Build query
    let query = {};
    
    // Filter by activity type
    if (req.query.type) {
      query.activityType = req.query.type;
    }
    
    // Filter by action
    if (req.query.action) {
      query.action = req.query.action;
    }
    
    // Filter by user
    if (req.query.user) {
      query.user = req.query.user;
    }
    
    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      query.timestamp = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    } else if (req.query.startDate) {
      query.timestamp = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      query.timestamp = { $lte: new Date(req.query.endDate) };
    }
    
    // Execute query with pagination
    const activities = await Activity.find(query)
      .populate('user', 'name email')
      .sort({ timestamp: -1 })
      .skip(startIndex)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Activity.countDocuments(query);
    
    // Calculate pagination details
    const pagination = {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
    
    res.status(200).json(encryptResponse({
      success: true,
      pagination,
      data: activities
    }));
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json(encryptResponse({
      success: false,
      message: 'Server error'
    }));
  }
};

/**
 * @desc    Get activity by ID
 * @route   GET /api/activities/:id
 * @access  Private/Admin
 */
exports.getActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('user', 'name email');
    
    if (!activity) {
      return res.status(404).json(encryptResponse({
        success: false,
        message: 'Activity not found'
      }));
    }
    
    res.status(200).json(encryptResponse({
      success: true,
      data: activity
    }));
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json(encryptResponse({
      success: false,
      message: 'Server error'
    }));
  }
};

/**
 * @desc    Get activity statistics
 * @route   GET /api/activities/stats
 * @access  Private/Admin
 */
exports.getActivityStats = async (req, res) => {
  try {
    // Get date range (default to last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (parseInt(req.query.days, 10) || 30));
    
    // Get total count by activity type
    const typeStats = await Activity.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$activityType',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get total count by action
    const actionStats = await Activity.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    // Get daily activity count
    const dailyStats = await Activity.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    res.status(200).json(encryptResponse({
      success: true,
      data: {
        typeStats,
        actionStats,
        dailyStats
      }
    }));
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json(encryptResponse({
      success: false,
      message: 'Server error'
    }));
  }
};

/**
 * @desc    Get system logs (system-level activities)
 * @route   GET /api/activities/system/logs
 * @access  Private/Admin
 */
exports.getSystemLogs = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    
    // Build query for system activities
    let query = { activityType: 'system' };
    
    // Filter by level if provided
    if (req.query.level) {
      query.action = req.query.level;
    }
    
    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      query.timestamp = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    } else if (req.query.startDate) {
      query.timestamp = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      query.timestamp = { $lte: new Date(req.query.endDate) };
    }
    
    // Execute query with pagination
    const logs = await Activity.find(query)
      .sort({ timestamp: -1 })
      .skip(startIndex)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Activity.countDocuments(query);
    
    // Calculate pagination details
    const pagination = {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
    
    res.status(200).json(encryptResponse({
      success: true,
      pagination,
      data: logs
    }));
  } catch (error) {
    console.error('Error fetching system logs:', error);
    res.status(500).json(encryptResponse({
      success: false,
      message: 'Server error'
    }));
  }
};

/**
 * @desc    Get user activity timeline
 * @route   GET /api/activities/user/:userId/timeline
 * @access  Private/Admin
 */
exports.getUserActivityTimeline = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    
    // Get user activities
    const activities = await Activity.find({ user: userId })
      .sort({ timestamp: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate('user', 'name email');
    
    const total = await Activity.countDocuments({ user: userId });
    
    res.status(200).json(encryptResponse({
      success: true,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: activities
    }));
  } catch (error) {
    console.error('Error fetching user timeline:', error);
    res.status(500).json(encryptResponse({
      success: false,
      message: 'Server error'
    }));
  }
};

/**
 * @desc    Export activities to CSV
 * @route   GET /api/activities/export
 * @access  Private/Admin
 */
exports.exportActivities = async (req, res) => {
  try {
    // Build query
    let query = {};
    
    if (req.query.type && req.query.type !== 'all') {
      query.activityType = req.query.type;
    }
    
    if (req.query.startDate && req.query.endDate) {
      query.timestamp = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Fetch all matching activities
    const activities = await Activity.find(query)
      .populate('user', 'name email')
      .sort({ timestamp: -1 });
    
    // Convert to CSV format
    if (activities.length === 0) {
      return res.status(200).json(encryptResponse({
        success: false,
        message: 'No activities to export'
      }));
    }
    
    // CSV headers
    const headers = ['Timestamp', 'Type', 'Action', 'User', 'Description', 'IP Address', 'Method', 'Path', 'Status Code'];
    const rows = activities.map(activity => [
      new Date(activity.timestamp).toISOString(),
      activity.activityType,
      activity.action,
      activity.user?.name || 'System',
      activity.description,
      activity.ipAddress,
      activity.method,
      activity.path,
      activity.statusCode
    ]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // Send as file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="activities-${Date.now()}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting activities:', error);
    res.status(500).json(encryptResponse({
      success: false,
      message: 'Server error'
    }));
  }
};

/**
 * @desc    Clear old activities (keep only recent ones)
 * @route   DELETE /api/activities/clear
 * @access  Private/Admin
 */
exports.clearOldActivities = async (req, res) => {
  try {
    const { daysOld } = req.body || {};
    const days = parseInt(daysOld, 10) || 90;
    
    // Calculate date cutoff
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    // Delete activities older than cutoff
    const result = await Activity.deleteMany({
      timestamp: { $lt: cutoffDate }
    });
    
    res.status(200).json(encryptResponse({
      success: true,
      message: `Deleted ${result.deletedCount} old activities`,
      data: {
        deletedCount: result.deletedCount,
        cutoffDate
      }
    }));
  } catch (error) {
    console.error('Error clearing old activities:', error);
    res.status(500).json(encryptResponse({
      success: false,
      message: 'Server error'
    }));
  }
};
