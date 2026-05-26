/**
 * @file auth-routes.js
 * @description Express routes for authentication services. Maps registration, login, and profile lookups.
 */

const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

/**
 * @route POST /api/auth/register
 * @desc User registration
 * @access Public
 */
router.post('/register', register);

/**
 * @route POST /api/auth/login
 * @desc User login
 * @access Public
 */
router.post('/login', login);

/**
 * @route GET /api/auth/me
 * @desc Fetch current authenticated user profile details
 * @access Private
 */
router.get('/me', protect, getMe);

module.exports = router;
