const Activity = require('../models/Activity');

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
    
    res.status(200).json({
      success: true,
      pagination,
      data: activities
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
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
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
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
    
    res.status(200).json({
      success: true,
      data: {
        typeStats,
        actionStats,
        dailyStats
      }
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
