/**
 * @file authController.js
 * @description Handles user registration and login. Also has a route to get the current user's profile.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Creates a JWT token for the user using their ID.
 * This token is sent to the frontend and used to verify the user on every request.
 * @param {string} userId - The MongoDB ID of the user
 * @returns {string} A signed JWT token
 */
const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || '7676fgfghfghj5567c', {
    expiresIn: '30d'
  });
};

/**
 * Register a new user account.
 * Checks if email is already taken, then creates the user.
 * @route POST /api/auth/register
 * @param {Object} req - Request with name, email, password, role in body
 * @param {Object} res - Response with user data and token
 */
const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Check if email is already taken
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    // Create the user (password is hashed automatically in User model)
    const newUser = await User.create({
      name,
      email,
      password,
      role: role || 'employee'
    });

    // Send back user info and token
    res.status(201).json({
      success: true,
      data: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        leaveBalances: newUser.leaveBalances,
        token: createToken(newUser._id)
      }
    });

  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

/**
 * Login with email and password.
 * Returns user data + JWT token if credentials are correct.
 * @route POST /api/auth/login
 * @param {Object} req - Request with email and password in body
 * @param {Object} res - Response with user data and token
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });

    // Check if user exists and password is correct
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Send back user data and token
    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        leaveBalances: user.leaveBalances,
        token: createToken(user._id)
      }
    });

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

/**
 * Get the currently logged-in user's profile.
 * The protect middleware already adds req.user so we just return it.
 * @route GET /api/auth/me
 * @param {Object} req - Request (req.user is set by protect middleware)
 * @param {Object} res - Response with user data
 */
const getMe = async (req, res) => {
  try {
    res.json({ success: true, data: req.user });
  } catch (error) {
    console.error('GetMe error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching profile.' });
  }
};

module.exports = { register, login, getMe };
