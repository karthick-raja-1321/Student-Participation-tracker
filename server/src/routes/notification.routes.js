const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getSubmissionHistory,
  getApprovableSubmissions
} = require('../controllers/notification.controller');

router.get('/', protect, getNotifications);
router.get('/unread/count', protect, getUnreadCount);
router.get('/submission-history/list', protect, getSubmissionHistory);
router.get('/approvable-submissions/list', protect, getApprovableSubmissions);
router.put('/:id/read', protect, markAsRead);
router.put('/mark-all-read', protect, markAllAsRead);
router.delete('/:id', protect, deleteNotification);

module.exports = router;
