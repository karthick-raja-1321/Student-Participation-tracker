const { ROLE_PERMISSIONS } = require('../config/constants');
const logger = require('../config/logger');

// Check if user has specific permission
const hasPermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authenticated'
      });
    }

    const userRole = req.user.role;
    
    // SUPER_ADMIN has access to everything
    if (userRole === 'SUPER_ADMIN') {
      return next();
    }

    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    
    logger.info(`Permission check: User=${req.user.email}, Role=${userRole}, Required=[${requiredPermissions}], Has=[${userPermissions}]`);

    const hasAccess = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );

    if (!hasAccess) {
      logger.warn(`Permission denied for user ${req.user.email} - Required: ${requiredPermissions}, User has: ${userPermissions}`);
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action'
      });
    }

    next();
  };
};

// Check if user has specific role
const hasRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have the required role to access this resource'
      });
    }

    next();
  };
};

// Check if user can access department resources
const canAccessDepartment = (req, res, next) => {
  const departmentId = req.params.departmentId || req.body.departmentId || req.query.departmentId;

  if (!departmentId) {
    return next();
  }

  const userRole = req.user.role;
  const userDepartmentId = req.user.departmentId?.toString();

  // Super admin can access all departments
  if (userRole === 'SUPER_ADMIN') {
    return next();
  }

  // Others can only access their own department
  if (userDepartmentId !== departmentId.toString()) {
    return res.status(403).json({
      status: 'error',
      message: 'You can only access resources from your own department'
    });
  }

  next();
};

module.exports = {
  hasPermission,
  hasRole,
  canAccessDepartment
};
