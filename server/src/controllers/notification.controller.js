const Notification = require('../models/Notification');
const { getSubmissionHistory, getApprovableSubmissions } = require('../services/notification.service');
const Faculty = require('../models/Faculty');

// Get all notifications for the current user
exports.getNotifications = async (req, res, next) => {
  try {
    const { limit = 50, skip = 0, unreadOnly = false, readOnly = false } = req.query;
    
    const filter = { userId: req.user._id };
    if (unreadOnly === 'true') {
      filter.isRead = false;
    } else if (readOnly === 'true') {
      filter.isRead = true;
    }
    
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('relatedId');
    
    const total = await Notification.countDocuments(filter);
    
    res.json({
      notifications,
      total,
      hasMore: total > parseInt(skip) + notifications.length
    });
  } catch (error) {
    next(error);
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false
    });
    
    res.json({ count });
  } catch (error) {
    next(error);
  }
};

// Mark notification as read
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }
    
    res.json({
      status: 'success',
      data: { notification }
    });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    
    res.json({
      status: 'success',
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// Delete notification
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }
    
    res.json({
      status: 'success',
      message: 'Notification deleted'
    });
  } catch (error) {
    next(error);
  }
};

// Get submission history for approvers (HOD, Class Advisors, Innovation Coordinators)
exports.getSubmissionHistory = async (req, res, next) => {
  try {
    const { status } = req.query;
    
    // Only approvers can view submission history
    if (!['HOD', 'FACULTY'].includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Only approvers can view submission history'
      });
    }
    
    // Get faculty to determine department
    const faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty) {
      return res.status(404).json({
        status: 'error',
        message: 'Faculty record not found'
      });
    }
    
    // Get submission history
    const history = await getSubmissionHistory(faculty.departmentId, status);
    
    res.json({
      status: 'success',
      data: { history }
    });
  } catch (error) {
    next(error);
  }
};

// Get approvable submissions (new, approved, rejected)
exports.getApprovableSubmissions = async (req, res, next) => {
  try {
    // Only approvers can view submissions
    if (!['HOD', 'FACULTY'].includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Only approvers can view submissions'
      });
    }
    
    // Get faculty to determine department
    const faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty) {
      return res.status(404).json({
        status: 'error',
        message: 'Faculty record not found'
      });
    }
    
    // Get approvable submissions
    const submissions = await getApprovableSubmissions(faculty, faculty.departmentId);
    
    res.json({
      status: 'success',
      data: { submissions }
    });
  } catch (error) {
    next(error);
  }
};
