const User = require('../models/User');
const Role = require('../models/Role');
const { encryptResponse } = require('../utils/responseEncryption');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('role', 'name displayName')
      .sort({ createdAt: -1 });

    res.status(200).json(encryptResponse({
      success: true,
      count: users.length,
      data: users
    }));
  } catch (error) {
    console.error(error);
    res.status(500).json(encryptResponse({
      success: false,
      message: 'Server error'
    }));
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('role', 'name displayName');

    if (!user) {
      return res.status(404).json(encryptResponse({
        success: false,
        message: 'User not found'
      }));
    }

    res.status(200).json(encryptResponse({
      success: true,
      data: user
    }));
  } catch (error) {
    console.error(error);
    res.status(500).json(encryptResponse({
      success: false,
      message: 'Server error'
    }));
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, group } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json(encryptResponse({
        success: false,
        message: 'Email already registered'
      }));
    }

    // Validate role if provided
    let roleId = role;
    if (role) {
      const roleExists = await Role.findById(role);
      if (!roleExists) {
        return res.status(400).json(encryptResponse({
          success: false,
          message: 'Invalid role specified'
        }));
      }
      roleId = role;
    } else {
      // Get default user role
      const defaultRole = await Role.findOne({ name: 'user' });
      if (!defaultRole) {
        return res.status(500).json(encryptResponse({
          success: false,
          message: 'Default user role not found'
        }));
      }
      roleId = defaultRole._id;
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: roleId,
      group
    });

    // Populate role for response
    await user.populate('role', 'name displayName');

    res.status(201).json(encryptResponse({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }));
  } catch (error) {
    console.error(error);
    res.status(500).json(encryptResponse({
      success: false,
      message: 'Server error'
    }));
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, group } = req.body;

    // Find user
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json(encryptResponse({
        success: false,
        message: 'User not found'
      }));
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json(encryptResponse({
          success: false,
          message: 'Email already registered'
        }));
      }
    }

    // Validate role if provided
    if (role) {
      const roleExists = await Role.findById(role);
      if (!roleExists) {
        return res.status(400).json(encryptResponse({
          success: false,
          message: 'Invalid role specified'
        }));
      }
    }

    // Update user
    user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, group },
      { new: true, runValidators: true }
    ).select('-password').populate('role', 'name displayName');

    res.status(200).json(encryptResponse({
      success: true,
      data: user
    }));
  } catch (error) {
    console.error(error);
    res.status(500).json(encryptResponse({
      success: false,
      message: 'Server error'
    }));
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json(encryptResponse({
        success: false,
        message: 'User not found'
      }));
    }

    await user.deleteOne();

    res.status(200).json(encryptResponse({
      success: true,
      data: {}
    }));
  } catch (error) {
    console.error(error);
    res.status(500).json(encryptResponse({
      success: false,
      message: 'Server error'
    }));
  }
};
