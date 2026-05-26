/**
 * @file seed.js
 * @description Prepopulates the database with initial admin and employee accounts, as well as demo leave requests.
 * Allows the interviewer or reviewer to run and test the application immediately.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const LeaveRequest = require('./models/LeaveRequest');

// Load environment configurations
dotenv.config();

/**
 * Runs the database seeding operation
 * @returns {Promise<void>}
 */
const seedDatabase = async () => {
  try {
    // Connect to database
    console.log('Connecting to database for seeding...');
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/leave-management'
    );
    console.log('Connected to MongoDB successfully.');

    // Clear any existing documents to start with a pristine test environment
    console.log('Clearing existing collections...');
    await User.deleteMany({});
    await LeaveRequest.deleteMany({});
    console.log('Collections cleared.');

    // Password values are plain text for review. Hashing happens in User pre-save hooks.
    console.log('Creating seed users...');

    // 1. Create employee seed accounts
    const employee1 = await User.create({
      name: 'Pragyansh Chauhan',
      email: 'cpragyansh@employee.com',
      password: 'password123', // Clean plain-text, will be hashed in model hooks
      role: 'employee',
      leaveBalances: {
        annual: 15,
        sick: 8,
        personal: 2
      }
    });
    console.log('Employee account 1 created (Login: cpragyansh@employee.com / password123)');



    // 2. Create admin seed account
    const admin1 = await User.create({
      name: 'Penthara Technologies Admin',
      email: 'pentharaHR1@admin.com',
      password: 'password123',
      role: 'admin',
      leaveBalances: {
        annual: 20,
        sick: 10,
        personal: 3
      }
    });
    console.log('Admin account created (Login: pentharaHR@admin.com / password123)');
    // 2. Create admin seed account
    const admin2 = await User.create({
      name: 'Penthara Technologies Admin2',
      email: 'ashuc@admin.com',
      password: 'password123',
      role: 'admin',
      leaveBalances: {
        annual: 20,
        sick: 10,
        personal: 3
      }
    });
    console.log('Admin account created (Login: pentharaHR@admin.com / password123)');

    // Create a couple of mock leave requests populated in history
    console.log('Creating demo leave requests...');

    // Annual Leave (Approved)
    const request1 = await LeaveRequest.create({
      employeeId: employee1._id,
      type: 'annual',
      startDate: new Date('2026-05-10'),
      endDate: new Date('2026-05-14'),
      totalDays: 5,
      reason: 'Family trip to Japan for spring vacation.',
      status: 'approved',
      approvedBy: admin2._id
    });

    // Sick Leave (Pending)
    const request2 = await LeaveRequest.create({
      employeeId: employee1._id,
      type: 'sick',
      startDate: new Date('2026-05-27'),
      endDate: new Date('2026-05-28'),
      totalDays: 2,
      reason: 'Suffering from heavy flu and high fever. Doctor recommended bed rest.',
      status: 'pending'
    });

    // Personal Leave (Rejected)
    const request3 = await LeaveRequest.create({
      employeeId: employee1._id,
      type: 'personal',
      startDate: new Date('2026-04-20'),
      endDate: new Date('2026-04-20'),
      totalDays: 1,
      reason: 'Mandatory banking appointment at local bank branch during office hours.',
      status: 'rejected',
      approvedBy: admin1._id,
      rejectionReason: 'The requested date clashes with an important team sync. Please schedule it for another day.'
    });

    console.log('Mock leave requests successfully populated.');
    console.log('Seeding finished successfully!');

    // Close the mongoose connection
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during database seeding:', error.message);
    process.exit(1);
  }
};

// Execute seeding operation
seedDatabase();
