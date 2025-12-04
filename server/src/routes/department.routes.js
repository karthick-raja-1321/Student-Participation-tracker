const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { hasPermission } = require('../middleware/permission');
const { PERMISSIONS } = require('../config/constants');
const departmentController = require('../controllers/department.controller');

router.get('/', protect, hasPermission(PERMISSIONS.DEPARTMENT_READ_ALL, PERMISSIONS.DEPARTMENT_READ_OWN), departmentController.getAllDepartments);

router.post('/', protect, hasPermission(PERMISSIONS.DEPARTMENT_CREATE), departmentController.createDepartment);

router.get('/:id', protect, departmentController.getDepartmentById);

router.put('/:id', protect, hasPermission(PERMISSIONS.DEPARTMENT_UPDATE), departmentController.updateDepartment);

router.delete('/:id', protect, hasPermission(PERMISSIONS.DEPARTMENT_DELETE), departmentController.deleteDepartment);

module.exports = router;
