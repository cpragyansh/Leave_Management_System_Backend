/**
 * @file auth.js
 * @description Middleware to protect routes. Checks if the user is logged in and if they are an admin.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect middleware - runs before any route that needs login.
 * It reads the JWT token from the request header and checks if it's valid.
 * If valid, it adds the user info to req.user so other functions can use it.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - Call this to go to the next function
 */
const protect = async (req, res, next) => {
  let token;

  // JWT is sent in the header as: "Authorization: Bearer <token>"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized. Please login first.' });
  }

  try {
    // Verify the token and get the user ID from it
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

    // Find the user in DB but don't return their password
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    next(); // token is valid, move to the actual route

  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token. Please login again.' });
  }
};

/**
 * Admin only middleware - use this AFTER protect middleware.
 * Checks if the logged in user has admin role. If not, access is denied.
 * @param {Object} req - The request object (should already have req.user set by protect)
 * @param {Object} res - The response object
 * @param {Function} next - Call this to allow access
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
  }
};

module.exports = { protect, adminOnly };
