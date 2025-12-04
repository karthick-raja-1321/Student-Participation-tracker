const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { hasPermission } = require('../middleware/permission');
const { PERMISSIONS } = require('../config/constants');
const facultyController = require('../controllers/faculty.controller');

// List faculty
router.get('/', protect, facultyController.getAllFaculty);

// Create faculty
router.post('/', protect, hasPermission(PERMISSIONS.FACULTY_CREATE), facultyController.createFaculty);

// Get faculty by ID
router.get('/:id', protect, facultyController.getFacultyById);

// Update faculty
router.put('/:id', protect, hasPermission(PERMISSIONS.FACULTY_UPDATE), facultyController.updateFaculty);

// Delete faculty
router.delete('/:id', protect, hasPermission(PERMISSIONS.FACULTY_DELETE), facultyController.deleteFaculty);

module.exports = router;
