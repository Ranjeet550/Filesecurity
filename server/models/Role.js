const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    trim: true
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isSystem: {
    type: Boolean,
    default: false // System roles cannot be deleted
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
RoleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to check if role has specific permission
RoleSchema.methods.hasPermission = function(permissionId) {
  return this.permissions.includes(permissionId);
};

// Method to check if role has permission for module and action
RoleSchema.methods.hasModulePermission = async function(moduleName, action) {
  await this.populate({
    path: 'permissions',
    populate: {
      path: 'module',
      model: 'Module'
    }
  });
  
  return this.permissions.some(permission => 
    permission.module.name === moduleName && permission.action === action
  );
};

module.exports = mongoose.model('Role', RoleSchema);
