const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { hasPermission } = require('../middleware/permission');
const { PERMISSIONS } = require('../config/constants');
const eventController = require('../controllers/event.controller');

router.get('/', protect, eventController.getAllEvents);

router.post('/', protect, hasPermission(PERMISSIONS.EVENT_CREATE_INSTITUTION, PERMISSIONS.EVENT_CREATE_DEPARTMENT), eventController.createEvent);

// Debug endpoint
router.get('/debug/permissions', protect, (req, res) => {
  const { ROLE_PERMISSIONS, PERMISSIONS } = require('../config/constants');
  res.json({
    user: req.user.email,
    role: req.user.role,
    permissions: ROLE_PERMISSIONS[req.user.role],
    required_permission: PERMISSIONS.REPORT_VIEW_ASSIGNED,
    has_permission: ROLE_PERMISSIONS[req.user.role].includes(PERMISSIONS.REPORT_VIEW_ASSIGNED)
  });
});

// Event analytics and reporting routes (must be before /:id route)
router.get('/:eventId/viewers/students', protect, eventController.getStudentsWhoViewed);

router.get('/:eventId/viewers/faculty', protect, eventController.getFacultyWhoViewed);

router.get('/:eventId/registrations', protect, eventController.getStudentsWhoRegistered);

router.get('/:eventId/not-participated', protect, eventController.getRegisteredButNotParticipated);

router.get('/:id', protect, eventController.getEventById);

router.post('/:id/register', protect, eventController.registerForEvent);

router.put('/:id', protect, hasPermission(PERMISSIONS.EVENT_UPDATE), eventController.updateEvent);

router.delete('/:id', protect, hasPermission(PERMISSIONS.EVENT_DELETE), eventController.deleteEvent);

router.post('/:id/publish', protect, hasPermission(PERMISSIONS.EVENT_PUBLISH), eventController.publishEvent);

module.exports = router;
