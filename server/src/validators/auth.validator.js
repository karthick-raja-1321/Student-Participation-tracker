const Joi = require('joi');
const { ROLES } = require('../config/constants');

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  })
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid(...Object.values(ROLES)).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  phone: Joi.string().pattern(/^[6-9]\d{9}$/),
  departmentId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
  employeeId: Joi.string()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required().invalid(Joi.ref('currentPassword')).messages({
    'any.invalid': 'New password must be different from current password'
  })
});

module.exports = {
  loginSchema,
  registerSchema,
  changePasswordSchema
};
