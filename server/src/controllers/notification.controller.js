const Notification = require('../models/Notification');

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
