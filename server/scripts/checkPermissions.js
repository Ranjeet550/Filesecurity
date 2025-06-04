const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const Module = require('../models/Module');

// Load env vars
dotenv.config();

const checkPermissions = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check modules
    console.log('\n=== MODULES ===');
    const modules = await Module.find();
    modules.forEach(module => {
      console.log(`${module.name} (${module.displayName})`);
    });

    // Check permissions
    console.log('\n=== PERMISSIONS ===');
    const permissions = await Permission.find().populate('module');
    permissions.forEach(permission => {
      console.log(`${permission.module.name}.${permission.action} - ${permission.name}`);
    });

    // Check roles
    console.log('\n=== ROLES ===');
    const roles = await Role.find().populate({
      path: 'permissions',
      populate: {
        path: 'module',
        model: 'Module'
      }
    });
    
    roles.forEach(role => {
      console.log(`\n${role.name} (${role.displayName}):`);
      role.permissions.forEach(permission => {
        console.log(`  - ${permission.module.name}.${permission.action}`);
      });
    });

    // Check users
    console.log('\n=== USERS ===');
    const users = await User.find().populate('role');
    users.forEach(user => {
      console.log(`${user.email} - Role: ${user.role?.name || 'No role'} (ID: ${user.role?._id || 'None'})`);
    });

    console.log('\nCheck completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error checking permissions:', error);
    process.exit(1);
  }
};

checkPermissions();
