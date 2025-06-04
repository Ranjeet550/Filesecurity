const mongoose = require('mongoose');
const dotenv = require('dotenv');
const initializeRolePermissions = require('../seeders/initializeRolePermissions');

// Load env vars
dotenv.config();

const seedRoles = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Initialize roles and permissions
    await initializeRolePermissions();

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding roles:', error);
    process.exit(1);
  }
};

seedRoles();
