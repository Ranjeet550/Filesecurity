const Permission = require('../models/Permission');
const Module = require('../models/Module');

// @desc    Get all permissions
// @route   GET /api/permissions
// @access  Private/Admin
exports.getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find({ isActive: true })
      .populate('module', 'name displayName')
      .sort({ 'module.displayName': 1, action: 1 });
    
    res.status(200).json({
      success: true,
      count: permissions.length,
      data: permissions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get permissions by module
// @route   GET /api/permissions/module/:moduleId
// @access  Private/Admin
exports.getPermissionsByModule = async (req, res) => {
  try {
    const permissions = await Permission.find({ 
      module: req.params.moduleId,
      isActive: true 
    }).populate('module', 'name displayName');
    
    res.status(200).json({
      success: true,
      count: permissions.length,
      data: permissions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single permission
// @route   GET /api/permissions/:id
// @access  Private/Admin
exports.getPermission = async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id)
      .populate('module', 'name displayName');

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }

    res.status(200).json({
      success: true,
      data: permission
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create permission
// @route   POST /api/permissions
// @access  Private/Admin
exports.createPermission = async (req, res) => {
  try {
    const { name, action, module, description } = req.body;

    // Check if module exists
    const moduleExists = await Module.findById(module);
    if (!moduleExists) {
      return res.status(400).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Check if permission already exists for this module and action
    const existingPermission = await Permission.findOne({ module, action });
    if (existingPermission) {
      return res.status(400).json({
        success: false,
        message: 'Permission already exists for this module and action'
      });
    }

    // Create permission
    const permission = await Permission.create({
      name,
      action,
      module,
      description
    });

    // Populate module data
    await permission.populate('module', 'name displayName');

    res.status(201).json({
      success: true,
      data: permission
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update permission
// @route   PUT /api/permissions/:id
// @access  Private/Admin
exports.updatePermission = async (req, res) => {
  try {
    const { name, action, module, description, isActive } = req.body;

    let permission = await Permission.findById(req.params.id);

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }

    // Check if module exists (if being updated)
    if (module) {
      const moduleExists = await Module.findById(module);
      if (!moduleExists) {
        return res.status(400).json({
          success: false,
          message: 'Module not found'
        });
      }
    }

    // Check if permission already exists for this module and action (if being updated)
    if ((module && module !== permission.module.toString()) || 
        (action && action !== permission.action)) {
      const existingPermission = await Permission.findOne({ 
        module: module || permission.module, 
        action: action || permission.action,
        _id: { $ne: req.params.id }
      });
      if (existingPermission) {
        return res.status(400).json({
          success: false,
          message: 'Permission already exists for this module and action'
        });
      }
    }

    // Update permission
    permission = await Permission.findByIdAndUpdate(
      req.params.id,
      { name, action, module, description, isActive },
      { new: true, runValidators: true }
    ).populate('module', 'name displayName');

    res.status(200).json({
      success: true,
      data: permission
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete permission
// @route   DELETE /api/permissions/:id
// @access  Private/Admin
exports.deletePermission = async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }

    // Soft delete by setting isActive to false
    await Permission.findByIdAndUpdate(req.params.id, { isActive: false });

    res.status(200).json({
      success: true,
      message: 'Permission deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
