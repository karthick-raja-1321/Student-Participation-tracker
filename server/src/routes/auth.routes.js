const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loginSchema, registerSchema, changePasswordSchema } = require('../validators/auth.validator');

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Protected routes
router.post('/logout', protect, authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.get('/me', protect, authController.getMe);
router.put('/change-password', protect, validate(changePasswordSchema), authController.changePassword);

module.exports = router;
