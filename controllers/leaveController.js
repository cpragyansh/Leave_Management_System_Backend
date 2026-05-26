/**
 * @file leaveController.js
 * @description All the logic for leave requests - applying, viewing history, and admin approval/rejection.
 */

const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');

/**
 * Counts how many working days are between two dates.
 * We skip Saturday and Sunday since those aren't work days.
 * @param {Date} startDate - First day of leave
 * @param {Date} endDate - Last day of leave
 * @returns {number} Total working days
 */
const countWorkingDays = (startDate, endDate) => {
  let count = 0;
  let current = new Date(startDate);

  while (current <= endDate) {
    const day = current.getDay(); // 0 = Sunday, 6 = Saturday
    if (day !== 0 && day !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
};

/**
 * Employee submits a new leave request.
 * Checks if they have enough balance before saving.
 * @route POST /api/leaves/apply
 * @param {Object} req - Request with type, startDate, endDate, reason in body
 * @param {Object} res - Response with the new leave request data
 */
const applyLeave = async (req, res) => {
  const { type, startDate, endDate, reason } = req.body;

  // All fields are required
  if (!type || !startDate || !endDate || !reason) {
    return res.status(400).json({
      success: false,
      message: 'Please fill in all fields: type, start date, end date, and reason.'
    });
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be before start date.'
      });
    }

    const workingDays = countWorkingDays(start, end);

    if (workingDays === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your selected dates fall on weekends. Please pick working days.'
      });
    }

    // Check if the employee has enough leave balance
    const employee = await User.findById(req.user.id);
    const availableBalance = employee.leaveBalances[type];

    if (availableBalance === undefined) {
      return res.status(400).json({ success: false, message: `Invalid leave type: ${type}` });
    }

    if (availableBalance < workingDays) {
      return res.status(400).json({
        success: false,
        message: `Not enough balance. You need ${workingDays} days but only have ${availableBalance} left.`
      });
    }

    // Save the leave request
    const newRequest = await LeaveRequest.create({
      employeeId: req.user.id,
      type,
      startDate: start,
      endDate: end,
      totalDays: workingDays,
      reason,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully!',
      data: newRequest
    });

  } catch (error) {
    console.error('Error applying for leave:', error.message);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

/**
 * Get the leave history for the currently logged-in employee.
 * Returns all their past leave requests, newest first.
 * @route GET /api/leaves/history
 * @param {Object} req - Request (req.user set by protect middleware)
 * @param {Object} res - Response with array of leave requests
 */
const getHistory = async (req, res) => {
  try {
    const history = await LeaveRequest.find({ employeeId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('approvedBy', 'name email');

    res.json({ success: true, data: history });

  } catch (error) {
    console.error('Error fetching leave history:', error.message);
    res.status(500).json({ success: false, message: 'Could not fetch leave history.' });
  }
};

/**
 * Admin - get all leave requests from all employees.
 * This is used to show everything on the admin dashboard.
 * @route GET /api/leaves/admin/all
 * @param {Object} req - Request
 * @param {Object} res - Response with all leave requests
 */
const getAllRequests = async (req, res) => {
  try {
    const allRequests = await LeaveRequest.find()
      .populate('employeeId', 'name email leaveBalances')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: allRequests });

  } catch (error) {
    console.error('Error fetching all leave requests:', error.message);
    res.status(500).json({ success: false, message: 'Could not fetch leave requests.' });
  }
};

/**
 * Admin - approve or reject a leave request.
 * If approved, we also deduct the days from the employee's balance.
 * @route PUT /api/leaves/admin/review/:id
 * @param {Object} req - Request with status and optional rejectionReason in body
 * @param {Object} res - Response with updated leave request
 */
const updateStatus = async (req, res) => {
  const { status, rejectionReason } = req.body;
  const leaveId = req.params.id;

  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Status must be either approved or rejected.'
    });
  }

  if (status === 'rejected' && (!rejectionReason || rejectionReason.trim().length < 5)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a rejection reason (at least 5 characters).'
    });
  }

  try {
    const leaveRequest = await LeaveRequest.findById(leaveId);

    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    // Can only review pending requests
    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This request is already ${leaveRequest.status}. Cannot change it.`
      });
    }

    // If approving, deduct days from employee's balance
    if (status === 'approved') {
      const employee = await User.findById(leaveRequest.employeeId);
      const balance = employee.leaveBalances[leaveRequest.type];

      if (balance < leaveRequest.totalDays) {
        return res.status(400).json({
          success: false,
          message: 'Cannot approve. Employee does not have enough leave balance anymore.'
        });
      }

      employee.leaveBalances[leaveRequest.type] -= leaveRequest.totalDays;
      await employee.save();
    }

    // Update the request status
    leaveRequest.status = status;
    leaveRequest.approvedBy = req.user.id;
    if (status === 'rejected') {
      leaveRequest.rejectionReason = rejectionReason;
    }
    await leaveRequest.save();

    res.json({
      success: true,
      message: `Leave request ${status} successfully!`,
      data: leaveRequest
    });

  } catch (error) {
    console.error('Error updating leave status:', error.message);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

module.exports = { applyLeave, getHistory, getAllRequests, updateStatus };
