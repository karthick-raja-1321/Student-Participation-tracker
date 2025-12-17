const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    logger.info(`Auth check for ${req.method} ${req.path} - Token present: ${!!token}`);

    if (!token) {
      logger.warn(`No token for ${req.path}`);
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to access this route'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password -refreshToken');
      
      if (!req.user) {
        logger.warn(`User not found for token`);
        return res.status(401).json({
          status: 'error',
          message: 'User not found'
        });
      }

      if (!req.user.isActive) {
        logger.warn(`Inactive user: ${req.user.email}`);
        return res.status(401).json({
          status: 'error',
          message: 'User account is inactive'
        });
      }

      // Apply simulated role if in test mode
      if (req.user.isTestMode && req.user.simulatedRole) {
        req.user.originalRole = req.user.role;
        req.user.role = req.user.simulatedRole;
        if (req.user.simulatedDepartmentId) {
          req.user.originalDepartmentId = req.user.departmentId;
          req.user.departmentId = req.user.simulatedDepartmentId;
        }
        logger.info(`Using simulated role for ${req.user.email}: ${req.user.simulatedRole} (original: ${req.user.originalRole})`);
      }

      logger.info(`Auth successful for ${req.user.email} - Role: ${req.user.role}`);
      next();
    } catch (err) {
      logger.warn(`Token verification failed: ${err.message}`);
      return res.status(401).json({
        status: 'error',
        message: 'Token is invalid or expired'
      });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Authentication failed'
    });
  }
};

module.exports = { protect };
