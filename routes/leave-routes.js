/**
 * @file leave-routes.js
 * @description Express routes for leave management services.
 */

const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getHistory,
  getAllRequests,
  updateStatus
} = require('../controllers/leaveController');
const { protect, adminOnly } = require('../middleware/auth');

/**
 * @route POST /api/leaves/apply
 * @desc Apply for a new leave request (Employee)
 * @access Private
 */
router.post('/apply', protect, applyLeave);

/**
 * @route GET /api/leaves/history
 * @desc View employee leave history list (Employee)
 * @access Private
 */
router.get('/history', protect, getHistory);

/**
 * @route GET /api/leaves/admin/all
 * @desc View all leave requests in the system (Admin only)
 * @access Private/Admin
 */
router.get('/admin/all', protect, adminOnly, getAllRequests);

/**
 * @route PUT /api/leaves/admin/review/:id
 * @desc Review (Approve or Reject) a leave request (Admin only)
 * @access Private/Admin
 */
router.put('/admin/review/:id', protect, adminOnly, updateStatus);

module.exports = router;
