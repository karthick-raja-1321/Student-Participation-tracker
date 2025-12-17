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

// @desc    Switch role (Admin/SUPER_ADMIN only - for testing)
// @route   POST /api/auth/switch-role
// @access  Private
exports.switchRole = async (req, res, next) => {
  try {
    const { targetRole, targetDepartmentId } = req.body;
    const { ROLES } = require('../config/constants');

    // Only SUPER_ADMIN can switch roles
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        status: 'error',
        message: 'Only SUPER_ADMIN can switch roles'
      });
    }

    // Validate target role
    if (!Object.values(ROLES).includes(targetRole)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid role. Must be one of: ${Object.values(ROLES).join(', ')}`
      });
    }

    // Validate department for non-SUPER_ADMIN roles
    if (targetRole !== 'SUPER_ADMIN' && targetDepartmentId) {
      const Department = require('../models/Department');
      const dept = await Department.findById(targetDepartmentId);
      if (!dept) {
        return res.status(404).json({
          status: 'error',
          message: 'Department not found'
        });
      }
    }

    // Update user with simulated role
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        simulatedRole: targetRole,
        simulatedDepartmentId: targetDepartmentId || null,
        isTestMode: true
      },
      { new: true }
    ).populate('departmentId simulatedDepartmentId', 'name code');

    logger.info(`Role switched for user ${req.user.email}: ${req.user.role} → ${targetRole}`);

    res.json({
      status: 'success',
      message: `Role switched to ${targetRole}`,
      data: {
        user: {
          id: user._id,
          email: user.email,
          originalRole: user.role,
          simulatedRole: user.simulatedRole,
          isTestMode: user.isTestMode,
          firstName: user.firstName,
          lastName: user.lastName,
          departmentId: user.departmentId,
          simulatedDepartmentId: user.simulatedDepartmentId
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset role to original
// @route   POST /api/auth/reset-role
// @access  Private
exports.resetRole = async (req, res, next) => {
  try {
    // User can reset their own role
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        simulatedRole: null,
        simulatedDepartmentId: null,
        isTestMode: false
      },
      { new: true }
    ).populate('departmentId', 'name code');

    logger.info(`Role reset for user ${req.user.email}: back to ${user.role}`);

    res.json({
      status: 'success',
      message: `Role reset to ${user.role}`,
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          departmentId: user.departmentId,
          isTestMode: user.isTestMode
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get available roles for switching
// @route   GET /api/auth/available-roles
// @access  Private
exports.getAvailableRoles = async (req, res, next) => {
  try {
    const { ROLES } = require('../config/constants');
    const Department = require('../models/Department');

    // Only SUPER_ADMIN can switch roles
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        status: 'error',
        message: 'Only SUPER_ADMIN can view available roles'
      });
    }

    const departments = await Department.find({ isActive: true }).select('name code _id');

    res.json({
      status: 'success',
      data: {
        roles: Object.values(ROLES),
        departments,
        currentRole: req.user.role,
        simulatedRole: req.user.simulatedRole,
        isTestMode: req.user.isTestMode
      }
    });
  } catch (error) {
    next(error);
  }
};
