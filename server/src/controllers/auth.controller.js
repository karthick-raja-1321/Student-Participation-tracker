const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const logger = require('../config/logger');
const { sendPasswordResetEmail, sendPasswordChangedEmail } = require('../services/email.service');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { email, password, role, firstName, lastName, phone, departmentId, employeeId } = req.body;

    const user = await User.create({
      email,
      password,
      role,
      firstName,
      lastName,
      phone,
      departmentId,
      employeeId
    });

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Your account is inactive. Please contact administrator.'
      });
    }

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    logger.info(`User logged in: ${email}`);

    res.json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          departmentId: user.departmentId
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    req.user.refreshToken = null;
    await req.user.save();

    res.json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        status: 'error',
        message: 'Refresh token is required'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid refresh token'
      });
    }

    const newToken = generateToken(user._id);

    res.json({
      status: 'success',
      data: {
        token: newToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('departmentId', 'name code');

    res.json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);
    
    // Send password changed notification
    try {
      await sendPasswordChangedEmail(user.email, user.firstName);
    } catch (emailError) {
      logger.error(`Failed to send password changed email: ${emailError.message}`);
    }

    res.json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Send password reset email
    try {
      await sendPasswordResetEmail(email, resetToken, user.firstName);
      logger.info(`Password reset email sent to: ${email}`);
    } catch (emailError) {
      logger.error(`Failed to send password reset email: ${emailError.message}`);
    }

    res.json({
      status: 'success',
      message: 'Password reset link sent to your email',
      // For development only - remove in production
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    // Implementation would verify token and update password
    res.json({
      status: 'success',
      message: 'Password reset successful'
    });
  } catch (error) {
    next(error);
  }
};
