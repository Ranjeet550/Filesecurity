const Module = require('../models/Module');

// @desc    Get all modules
// @route   GET /api/modules
// @access  Private/Admin
exports.getModules = async (req, res) => {
  try {
    const modules = await Module.find({ isActive: true }).sort({ displayName: 1 });
    
    res.status(200).json({
      success: true,
      count: modules.length,
      data: modules
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single module
// @route   GET /api/modules/:id
// @access  Private/Admin
exports.getModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    res.status(200).json({
      success: true,
      data: module
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create module
// @route   POST /api/modules
// @access  Private/Admin
exports.createModule = async (req, res) => {
  try {
    const { name, displayName, description, icon, route } = req.body;

    // Check if module already exists
    const existingModule = await Module.findOne({ name });
    if (existingModule) {
      return res.status(400).json({
        success: false,
        message: 'Module with this name already exists'
      });
    }

    // Create module
    const module = await Module.create({
      name,
      displayName,
      description,
      icon,
      route
    });

    res.status(201).json({
      success: true,
      data: module
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update module
// @route   PUT /api/modules/:id
// @access  Private/Admin
exports.updateModule = async (req, res) => {
  try {
    const { name, displayName, description, icon, route, isActive } = req.body;

    let module = await Module.findById(req.params.id);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Check if name is being changed and if it already exists
    if (name && name !== module.name) {
      const existingModule = await Module.findOne({ name });
      if (existingModule) {
        return res.status(400).json({
          success: false,
          message: 'Module with this name already exists'
        });
      }
    }

    // Update module
    module = await Module.findByIdAndUpdate(
      req.params.id,
      { name, displayName, description, icon, route, isActive },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: module
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete module
// @route   DELETE /api/modules/:id
// @access  Private/Admin
exports.deleteModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found'
      });
    }

    // Soft delete by setting isActive to false
    await Module.findByIdAndUpdate(req.params.id, { isActive: false });

    res.status(200).json({
      success: true,
      message: 'Module deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
