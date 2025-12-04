const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { hasPermission } = require('../middleware/permission');
const { PERMISSIONS } = require('../config/constants');
const studentController = require('../controllers/student.controller');

router.get('/', protect, studentController.getAllStudents);

// Student dashboard and tracking routes (specific routes before :id)
router.get('/dashboard/:studentId', protect, studentController.getStudentDashboard);
router.get('/submissions/:submissionId/tracking', protect, studentController.getSubmissionTracking);
router.get('/submissions/:submissionId/od-receipt', protect, studentController.generateODReceipt);

router.post('/', protect, hasPermission(PERMISSIONS.STUDENT_CREATE), studentController.createStudent);

router.get('/:id', protect, studentController.getStudentById);

router.put('/:id', protect, hasPermission(PERMISSIONS.STUDENT_UPDATE), studentController.updateStudent);

router.delete('/:id', protect, hasPermission(PERMISSIONS.STUDENT_DELETE), studentController.deleteStudent);

module.exports = router;
