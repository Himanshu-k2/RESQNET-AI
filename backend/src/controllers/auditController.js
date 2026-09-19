import { AuditLog } from '../models/AuditLog.js';

// @desc    Get audit logs with filtering
// @route   GET /api/audit
// @access  Protected (Coordinator/Admin only)
export const getAuditLogs = async (req, res, next) => {
  try {
    const { action, targetId, limit = 50 } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (targetId) filter.targetId = targetId;

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('user', 'name email role organization');

    res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    next(error);
  }
};
