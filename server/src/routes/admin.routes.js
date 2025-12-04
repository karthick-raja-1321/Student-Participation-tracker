const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth');
const { hasPermission } = require('../middleware/permission');
const { PERMISSIONS } = require('../config/constants');

// All routes require SUPER_ADMIN permission
router.use(protect);
router.use(hasPermission(PERMISSIONS.SYSTEM_ADMIN));

// Password management routes
router.post('/reset-password/:userId', adminController.resetUserPassword);
router.post('/generate-password/:userId', adminController.generatePassword);

module.exports = router;
