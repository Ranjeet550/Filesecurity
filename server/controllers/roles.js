const Role = require('../models/Role');
const Permission = require('../models/Permission');
const User = require('../models/User');

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private/Admin
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find({ isActive: true })
      .populate({
        path: 'permissions',
        populate: {
          path: 'module',
          model: 'Module'
        }
      })
      .sort({ displayName: 1 });
    
    res.status(200).json({
      success: true,
      count: roles.length,
      data: roles
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single role
// @route   GET /api/roles/:id
// @access  Private/Admin
exports.getRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id)
      .populate({
        path: 'permissions',
        populate: {
          path: 'module',
          model: 'Module'
        }
      });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    res.status(200).json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create role
// @route   POST /api/roles
// @access  Private/Admin
exports.createRole = async (req, res) => {
  try {
    const { name, displayName, description, permissions } = req.body;

    // Check if role already exists
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Role with this name already exists'
      });
    }

    // Validate permissions if provided
    if (permissions && permissions.length > 0) {
      const validPermissions = await Permission.find({ 
        _id: { $in: permissions },
        isActive: true 
      });
      if (validPermissions.length !== permissions.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more permissions are invalid'
        });
      }
    }

    // Create role
    const role = await Role.create({
      name,
      displayName,
      description,
      permissions: permissions || []
    });

    // Populate permissions
    await role.populate({
      path: 'permissions',
      populate: {
        path: 'module',
        model: 'Module'
      }
    });

    res.status(201).json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update role
// @route   PUT /api/roles/:id
// @access  Private/Admin
exports.updateRole = async (req, res) => {
  try {
    const { name, displayName, description, permissions, isActive } = req.body;

    let role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Check if it's a system role
    if (role.isSystem && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate system role'
      });
    }

    // Check if name is being changed and if it already exists
    if (name && name !== role.name) {
      const existingRole = await Role.findOne({ name });
      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: 'Role with this name already exists'
        });
      }
    }

    // Validate permissions if provided
    if (permissions && permissions.length > 0) {
      const validPermissions = await Permission.find({ 
        _id: { $in: permissions },
        isActive: true 
      });
      if (validPermissions.length !== permissions.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more permissions are invalid'
        });
      }
    }

    // Update role
    role = await Role.findByIdAndUpdate(
      req.params.id,
      { name, displayName, description, permissions, isActive },
      { new: true, runValidators: true }
    ).populate({
      path: 'permissions',
      populate: {
        path: 'module',
        model: 'Module'
      }
    });

    res.status(200).json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete role
// @route   DELETE /api/roles/:id
// @access  Private/Admin
exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Check if it's a system role
    if (role.isSystem) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete system role'
      });
    }

    // Check if any users are assigned to this role
    const usersWithRole = await User.countDocuments({ role: req.params.id });
    if (usersWithRole > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role. ${usersWithRole} user(s) are assigned to this role`
      });
    }

    // Soft delete by setting isActive to false
    await Role.findByIdAndUpdate(req.params.id, { isActive: false });

    res.status(200).json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
