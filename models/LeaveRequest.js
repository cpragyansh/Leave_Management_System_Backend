/**
 * @file LeaveRequest.js
 * @description Mongoose model for leave requests. Every time an employee applies for leave, it gets saved here.
 */

const mongoose = require('mongoose');

/**
 * LeaveRequest schema - one document = one leave application.
 * Tracks who applied, what type, dates, status, and admin review info.
 */
const leaveRequestSchema = new mongoose.Schema(
  {
    // Which employee applied for this leave
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee ID is required']
    },

    // Type of leave: annual, sick, or personal
    type: {
      type: String,
      enum: ['annual', 'sick', 'personal'],
      required: [true, 'Leave type is required']
    },

    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },

    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },

    // We calculate this in the controller (excludes weekends)
    totalDays: {
      type: Number,
      required: [true, 'Total days is required'],
      min: [1, 'Leave must be at least 1 day']
    },

    reason: {
      type: String,
      required: [true, 'Please provide a reason for the leave'],
      trim: true,
      minlength: [5, 'Reason must be at least 5 characters']
    },

    // Starts as pending, admin changes it to approved or rejected
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },

    // The admin who reviewed this request
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    // Only filled in if the request was rejected
    rejectionReason: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true // adds createdAt and updatedAt
  }
);

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
