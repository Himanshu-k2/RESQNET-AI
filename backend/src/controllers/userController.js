import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Protected (Admin only)
export const getUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const filter = {};

    if (role && role !== 'ALL') {
      filter.role = role;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: regex },
        { email: regex },
        { organization: regex },
        { phone: regex },
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a user's role (e.g. promote trusted user to COORDINATOR)
// @route   PATCH /api/users/:id/role
// @access  Protected (Admin only)
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = [
      'RESOURCE_PROVIDER',
      'COORDINATOR',
      'ADMIN',
      'citizen',
      'coordinator',
      'admin',
    ];

    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Valid options: RESOURCE_PROVIDER, COORDINATOR, ADMIN.',
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Safety guard: Admin cannot demote themselves away from ADMIN
    if (
      targetUser._id.toString() === req.user._id.toString() &&
      targetUser.role.toUpperCase() === 'ADMIN' &&
      role.toUpperCase() !== 'ADMIN'
    ) {
      return res.status(400).json({
        success: false,
        message: 'You cannot remove your own Administrator role.',
      });
    }

    const previousRole = targetUser.role;
    targetUser.role = role;

    if (role === 'COORDINATOR' || role === 'coordinator' || role === 'ADMIN' || role === 'admin') {
      targetUser.badgeVerified = true;
    }

    await targetUser.save();

    await AuditLog.create({
      action: 'USER_ROLE_UPDATED',
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      targetType: 'User',
      targetId: targetUser._id,
      details: { previousRole, newRole: role },
      reason: `Role changed from ${previousRole} to ${role} by Admin ${req.user.name}.`,
    });

    res.status(200).json({
      success: true,
      message: `User role successfully updated to ${role}.`,
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        phone: targetUser.phone,
        location: targetUser.location,
        organization: targetUser.organization,
        badgeVerified: targetUser.badgeVerified,
        isActive: targetUser.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active status
// @route   PATCH /api/users/:id/status
// @access  Protected (Admin only)
export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean (true or false).',
      });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account.',
      });
    }

    targetUser.isActive = isActive;
    await targetUser.save();

    await AuditLog.create({
      action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      targetType: 'User',
      targetId: targetUser._id,
      details: { isActive },
      reason: `Account status updated to ${isActive ? 'active' : 'inactive'} by Admin ${req.user.name}.`,
    });

    res.status(200).json({
      success: true,
      message: `User account has been ${isActive ? 'activated' : 'deactivated'}.`,
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        isActive: targetUser.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};
