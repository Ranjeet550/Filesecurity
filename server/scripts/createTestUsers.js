const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const createTestUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Fetch the roles
    const superadminRole = await Role.findOne({ name: 'superadmin' });
    const adminRole = await Role.findOne({ name: 'admin' });
    const userRole = await Role.findOne({ name: 'user' });

    if (!superadminRole || !adminRole || !userRole) {
      console.error('Required roles not found. Please run the seeder first.');
      process.exit(1);
    }

    console.log('Found roles:');
    console.log('- Superadmin:', superadminRole._id);
    console.log('- Admin:', adminRole._id);
    console.log('- User:', userRole._id);

    // Check if users already exist
    const existingUsers = await User.find({
      email: { $in: ['superadmin@example.com', 'admin@example.com'] }
    });

    if (existingUsers.length > 0) {
      console.log('\nUsers already exist. Deleting existing test users...');
      await User.deleteMany({
        email: { $in: ['superadmin@example.com', 'admin@example.com'] }
      });
      console.log('Deleted existing test users.');
    }

    // Create Superadmin user
    const superadminUser = await User.create({
      name: 'Super Administrator',
      email: 'superadmin@example.com',
      password: 'password123',
      role: superadminRole._id,
      group: 'System'
    });
    console.log('\n✓ Created Superadmin user:');
    console.log('  Email:', superadminUser.email);
    console.log('  Role: Super Administrator (All modules access)');
    console.log('  Permissions: Dashboard, File Management, User Management, Settings, System Management');

    // Create Admin user
    const adminUser = await User.create({
      name: 'Administrator',
      email: 'admin@example.com',
      password: 'password123',
      role: adminRole._id,
      group: 'System'
    });
    console.log('\n✓ Created Administrator user:');
    console.log('  Email:', adminUser.email);
    console.log('  Role: Administrator (Dashboard & File Management only)');
    console.log('  Permissions: Dashboard (all), File Management (all)');

    console.log('\n✅ Test users created successfully!');
    console.log('\nTest Credentials:');
    console.log('-----------------------------------');
    console.log('Superadmin:');
    console.log('  Email: superadmin@example.com');
    console.log('  Password: password123');
    console.log('  Access: All modules');
    console.log('');
    console.log('Administrator:');
    console.log('  Email: admin@example.com');
    console.log('  Password: password123');
    console.log('  Access: Dashboard & File Management only');
    console.log('-----------------------------------\n');

    await mongoose.connection.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error creating test users:', error.message);
    process.exit(1);
  }
};

createTestUsers();
