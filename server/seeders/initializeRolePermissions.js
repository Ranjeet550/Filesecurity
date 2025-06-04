const mongoose = require('mongoose');
const Module = require('../models/Module');
const Permission = require('../models/Permission');
const Role = require('../models/Role');
const User = require('../models/User');

const initializeRolePermissions = async () => {
  try {
    console.log('Initializing modules, permissions, and roles...');

    // Define modules
    const modules = [
      {
        name: 'dashboard',
        displayName: 'Dashboard',
        description: 'Main dashboard and overview',
        icon: 'DashboardOutlined',
        route: '/dashboard'
      },
      {
        name: 'file_management',
        displayName: 'File Management',
        description: 'Upload, download, and manage files',
        icon: 'FileOutlined',
        route: '/files'
      },
      {
        name: 'user_management',
        displayName: 'User Management',
        description: 'Manage users, roles, and permissions',
        icon: 'TeamOutlined',
        route: '/users'
      },
      {
        name: 'system_management',
        displayName: 'System Management',
        description: 'System activities and logs',
        icon: 'SettingOutlined',
        route: '/system'
      }
    ];

    // Create or update modules
    const createdModules = {};
    for (const moduleData of modules) {
      let module = await Module.findOne({ name: moduleData.name });
      if (!module) {
        module = await Module.create(moduleData);
        console.log(`Created module: ${moduleData.displayName}`);
      } else {
        module = await Module.findByIdAndUpdate(module._id, moduleData, { new: true });
        console.log(`Updated module: ${moduleData.displayName}`);
      }
      createdModules[moduleData.name] = module;
    }

    // Define permissions for each module
    const permissionActions = ['create', 'read', 'update', 'delete'];
    const createdPermissions = {};

    for (const [moduleName, module] of Object.entries(createdModules)) {
      createdPermissions[moduleName] = {};
      
      for (const action of permissionActions) {
        const permissionName = `${module.displayName} - ${action.charAt(0).toUpperCase() + action.slice(1)}`;
        
        let permission = await Permission.findOne({ module: module._id, action });
        if (!permission) {
          permission = await Permission.create({
            name: permissionName,
            action,
            module: module._id,
            description: `${action.charAt(0).toUpperCase() + action.slice(1)} access to ${module.displayName}`
          });
          console.log(`Created permission: ${permissionName}`);
        }
        createdPermissions[moduleName][action] = permission;
      }
    }

    // Define roles
    const roles = [
      {
        name: 'admin',
        displayName: 'Administrator',
        description: 'Full system access',
        isSystem: true,
        permissions: Object.values(createdPermissions).flatMap(modulePerms => Object.values(modulePerms)).map(p => p._id)
      },
      {
        name: 'user',
        displayName: 'Regular User',
        description: 'Basic user access',
        isSystem: true,
        permissions: [
          createdPermissions.dashboard.read._id,
          createdPermissions.file_management.create._id,
          createdPermissions.file_management.read._id,
          createdPermissions.file_management.update._id
          // Note: delete permission removed for regular users
        ]
      },
      {
        name: 'viewer',
        displayName: 'Viewer',
        description: 'Read-only access',
        isSystem: false,
        permissions: [
          createdPermissions.dashboard.read._id,
          createdPermissions.file_management.read._id
        ]
      }
    ];

    // Create or update roles
    const createdRoles = {};
    for (const roleData of roles) {
      let role = await Role.findOne({ name: roleData.name });
      if (!role) {
        role = await Role.create({
          name: roleData.name,
          displayName: roleData.displayName,
          description: roleData.description,
          isSystem: roleData.isSystem,
          permissions: roleData.permissions
        });
        console.log(`Created role: ${roleData.displayName}`);
      } else {
        role = await Role.findByIdAndUpdate(role._id, {
          displayName: roleData.displayName,
          description: roleData.description,
          permissions: roleData.permissions
        }, { new: true });
        console.log(`Updated role: ${roleData.displayName}`);
      }
      createdRoles[roleData.name] = role;
    }

    // Update existing users with default roles if they don't have proper role references
    const usersWithStringRoles = await User.find({
      role: { $type: 'string' }
    });

    for (const user of usersWithStringRoles) {
      let newRoleId;
      if (user.role === 'admin' || (typeof user.role === 'string' && user.role.includes('admin'))) {
        newRoleId = createdRoles.admin._id;
      } else {
        newRoleId = createdRoles.user._id;
      }

      await User.findByIdAndUpdate(user._id, { role: newRoleId });
      console.log(`Updated user ${user.email} with proper role reference`);
    }

    // Also check for users with no role or invalid ObjectId roles
    const usersWithoutValidRoles = await User.find({
      $or: [
        { role: { $exists: false } },
        { role: null }
      ]
    });

    for (const user of usersWithoutValidRoles) {
      await User.findByIdAndUpdate(user._id, { role: createdRoles.user._id });
      console.log(`Updated user ${user.email} with default user role`);
    }

    console.log('Role and permission initialization completed successfully!');
    return {
      modules: createdModules,
      permissions: createdPermissions,
      roles: createdRoles
    };

  } catch (error) {
    console.error('Error initializing roles and permissions:', error);
    throw error;
  }
};

module.exports = initializeRolePermissions;
