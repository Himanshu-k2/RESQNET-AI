import { Notification } from '../models/Notification.js';

// @desc    Get current user's notifications and unread count
// @route   GET /api/notifications
// @access  Protected
export const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 40, unreadOnly } = req.query;

    const filter = { recipientId: userId };
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [total, unreadCount, notifications] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipientId: userId, isRead: false }),
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('relatedResourceId', 'title resourceType quantity availability'),
    ]);

    res.status(200).json({
      success: true,
      unreadCount,
      total,
      notifications,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)) || 1,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Protected
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // Secure Ownership Check: Strictly find notification belonging to this user
    const notification = await Notification.findOne({ _id: id, recipientId: userId });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or unauthorized to modify.',
      });
    }

    notification.isRead = true;
    await notification.save();

    const unreadCount = await Notification.countDocuments({ recipientId: userId, isRead: false });

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      notification,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read for current user
// @route   PATCH /api/notifications/read-all
// @access  Protected
export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany({ recipientId: userId, isRead: false }, { isRead: true });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      unreadCount: 0,
    });
  } catch (error) {
    next(error);
  }
};
