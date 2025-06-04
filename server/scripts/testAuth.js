const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

// Load env vars
dotenv.config();

const testAuth = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get all users and their tokens
    const users = await User.find().populate('role');
    
    console.log('\n=== USERS AND TOKENS ===');
    for (const user of users) {
      console.log(`\nUser: ${user.email}`);
      console.log(`Role: ${user.role?.name} (${user.role?.displayName})`);
      
      // Generate a test token for this user
      const token = user.getSignedJwtToken();
      console.log(`Token: ${token.substring(0, 50)}...`);
      
      // Verify the token
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(`Token valid - User ID: ${decoded.id}, Role ID: ${decoded.roleId}`);
      } catch (err) {
        console.log(`Token invalid: ${err.message}`);
      }
    }

    console.log('\nTest completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error testing auth:', error);
    process.exit(1);
  }
};

testAuth();
