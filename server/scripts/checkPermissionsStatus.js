const mongoose = require('mongoose');
require('dotenv').config();

// Import models to ensure they're registered
require('../models/Module');
require('../models/Permission');

const Permission = mongoose.model('Permission');

const checkPermissionsStatus = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check all permissions with their status
    console.log('\n=== CHECKING ALL PERMISSIONS ===');
    const allPermissions = await Permission.find({}).populate('module', 'displayName');
    console.log(`Found ${allPermissions.length} total permissions:`);

    let activeCount = 0;
    let inactiveCount = 0;

    allPermissions.forEach(permission => {
      const status = permission.isActive ? 'ACTIVE' : 'INACTIVE';
      if (permission.isActive) activeCount++;
      else inactiveCount++;

      console.log(`- ${permission.name} (${permission.action}) - ${status} - Module: ${permission.module?.displayName || 'UNKNOWN'}`);
    });

    console.log(`\n📊 Summary:`);
    console.log(`- Active permissions: ${activeCount}`);
    console.log(`- Inactive permissions: ${inactiveCount}`);
    console.log(`- Total permissions: ${allPermissions.length}`);

    await mongoose.connection.close();
    console.log('\n✅ Permission status check completed');

  } catch (error) {
    console.error('❌ Error checking permissions:', error);
    process.exit(1);
  }
};

checkPermissionsStatus();