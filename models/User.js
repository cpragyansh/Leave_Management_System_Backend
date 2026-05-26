/**
 * @file User.js
 * @description Mongoose model for users. Stores employee and admin accounts with their leave balances.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User schema - defines how a user is stored in the database.
 * Each user has a name, email, password (hashed), role, and leave balance.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
      type: String,
      enum: ['employee', 'admin'],
      default: 'employee'
    },
    // Each employee starts with these leave days per year
    leaveBalances: {
      annual: { type: Number, default: 20 },
      sick: { type: Number, default: 10 },
      personal: { type: Number, default: 3 }
    }
  },
  {
    timestamps: true // adds createdAt and updatedAt automatically
  }
);

/**
 * Before saving a user, hash their password if it was changed.
 * We don't want to store plain text passwords in the database.
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); // only hash if password changed

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Check if a plain text password matches the stored hashed password.
 * Used during login to verify the user.
 * @param {string} plainPassword - The password the user typed in
 * @returns {boolean} true if password is correct, false otherwise
 */
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
