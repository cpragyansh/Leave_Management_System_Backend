/**
 * @file db.js
 * @description This file connects our app to the MongoDB database using Mongoose.
 */

const mongoose = require('mongoose');

/**
 * Connects to MongoDB when the server starts up.
 * Uses the MONGODB_URI from the .env file, or falls back to localhost.
 
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/leave-management-system'
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1); // stop the server if DB can't connect
  }
};

module.exports = connectDB;
