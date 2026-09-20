import { Group } from '../models/Group.js';
import { GroupMembership } from '../models/GroupMembership.js';
import { SafetyCheckIn } from '../models/SafetyCheckIn.js';
import { GroupAnnouncement } from '../models/GroupAnnouncement.js';
import { Incident } from '../models/Incident.js';
import { ResourceOffer } from '../models/ResourceOffer.js';
import crypto from 'crypto';

// Helper to generate a clean, friendly, uppercase invite code
const generateInviteCode = (groupName) => {
  const cleanPrefix = (groupName || 'GRP')
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 3)
    .toUpperCase() || 'RES';
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
  return `${cleanPrefix}-${randomSuffix}`;
};

// @desc    Create a new Community Group
// @route   POST /api/groups
// @access  Protected
export const createGroup = async (req, res, next) => {
  try {
    const { name, description, category, areaDescription, privacy } = req.body || {};

    console.log('[GroupController] createGroup request received:', {
      userId: req.user?._id,
      userEmail: req.user?.email,
      payload: { name, category, areaDescription, description, privacy },
    });

    if (!name || typeof name !== 'string' || !name.trim()) {
      console.warn('[GroupController] createGroup rejected: missing group name');
      return res.status(400).json({ success: false, message: 'Please provide a group name.' });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      console.warn('[GroupController] createGroup rejected: group name too short (<2 chars)');
      return res.status(400).json({ success: false, message: 'Group name must be at least 2 characters.' });
    }

    if (trimmedName.length > 60) {
      console.warn('[GroupController] createGroup rejected: group name too long (>60 chars)');
      return res.status(400).json({ success: false, message: 'Group name cannot exceed 60 characters.' });
    }

    // Normalize category against allowed schema enums
    const ALLOWED_CATEGORIES = [
      'APARTMENT', 'NEIGHBORHOOD', 'WORKPLACE', 'SCHOOL_COLLEGE', 'VOLUNTEER_ORG', 'FAMILY_FRIENDS', 'OTHER',
      'Family', 'Hostel', 'College', 'Apartment', 'Office', 'Community', 'Other'
    ];
    let safeCategory = 'Community';
    if (category && typeof category === 'string') {
      const match = ALLOWED_CATEGORIES.find((c) => c.toUpperCase() === category.trim().toUpperCase());
      safeCategory = match || 'OTHER';
    }

    // Normalize privacy
    let safePrivacy = 'INVITE_ONLY';
    if (privacy && typeof privacy === 'string') {
      const pUpper = privacy.trim().toUpperCase();
      if (pUpper === 'PRIVATE' || pUpper === 'INVITE_ONLY') {
        safePrivacy = pUpper;
      }
    }

    // Sanitize string lengths to prevent Mongoose schema validation failures
    const safeDescription = description && typeof description === 'string' ? description.trim().slice(0, 300) : '';
    const safeAreaDescription = areaDescription && typeof areaDescription === 'string' ? areaDescription.trim().slice(0, 100) : '';

    // Generate unique invite code with loop guard
    let inviteCode = generateInviteCode(trimmedName);
    let codeExists = await Group.findOne({ inviteCode });
    let attempts = 0;
    while (codeExists && attempts < 10) {
      inviteCode = generateInviteCode(trimmedName);
      codeExists = await Group.findOne({ inviteCode });
      attempts++;
    }

    const group = await Group.create({
      name: trimmedName,
      description: safeDescription,
      category: safeCategory,
      areaDescription: safeAreaDescription,
      privacy: safePrivacy,
      inviteCode,
      createdBy: req.user._id,
    });

    // Automatically make creator an active admin
    await GroupMembership.create({
      group: group._id,
      user: req.user._id,
      role: 'admin',
      membershipStatus: 'active',
      joinedAt: new Date(),
    });

    // Post a welcome announcement
    await GroupAnnouncement.create({
      group: group._id,
      createdBy: req.user._id,
      authorName: req.user.name || 'Community Admin',
      title: `Welcome to ${group.name}`.slice(0, 120),
      content: 'This safety circle is now active. Members can voluntarily check in, view emergency updates, and request assistance.',
      priority: 'NORMAL',
    });

    console.log('[GroupController] Community group created successfully:', {
      groupId: group._id,
      name: group.name,
      inviteCode: group.inviteCode,
    });

    res.status(201).json({
      success: true,
      message: 'Community group created successfully.',
      group,
    });
  } catch (error) {
    console.error('[GroupController] Error creating community group:', error);
    if (error.name === 'ValidationError') {
      const msg = Object.values(error.errors).map((val) => val.message).join(', ');
      return res.status(400).json({ success: false, message: msg });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A group with a similar unique identifier already exists. Please try again.',
      });
    }
    next(error);
  }
};

// @desc    Get current user's groups
// @route   GET /api/groups/my
// @access  Protected
export const getMyGroups = async (req, res, next) => {
  try {
    const memberships = await GroupMembership.find({
      user: req.user._id,
      membershipStatus: 'active',
    })
      .populate('group')
      .sort({ joinedAt: -1 });

    const groupsWithCounts = await Promise.all(
      memberships.map(async (m) => {
        if (!m.group) return null;
        const memberCount = await GroupMembership.countDocuments({
          group: m.group._id,
          membershipStatus: 'active',
        });
        const latestAnnouncement = await GroupAnnouncement.findOne({
          group: m.group._id,
        })
          .sort({ createdAt: -1 })
          .select('title priority createdAt');

        return {
          _id: m.group._id,
          name: m.group.name,
          description: m.group.description,
          category: m.group.category,
          areaDescription: m.group.areaDescription,
          privacy: m.group.privacy,
          inviteCode: m.group.inviteCode,
          userRole: m.role,
          memberCount,
          latestAnnouncement,
          joinedAt: m.joinedAt,
          updatedAt: m.group.updatedAt,
        };
      })
    );

    const validGroups = groupsWithCounts.filter(Boolean);

    res.status(200).json({
      success: true,
      count: validGroups.length,
      groups: validGroups,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed view of a group
// @route   GET /api/groups/:groupId
// @access  Protected
export const getGroupDetails = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId).populate('createdBy', 'name email');
    if (!group) {
      return res.status(404).json({ success: false, message: 'Community group not found.' });
    }

    const membership = await GroupMembership.findOne({
      group: group._id,
      user: req.user._id,
      membershipStatus: 'active',
    });

    const isSystemCoordinator = req.user.role === 'coordinator' || req.user.role === 'admin';

    // Privacy guardrail: Private groups only accessible to members or system coordinators
    if (!membership && group.privacy === 'PRIVATE' && !isSystemCoordinator) {
      return res.status(403).json({
        success: false,
        message: 'This group is private. You must join using a valid invite code to view its details.',
      });
    }

    const memberCount = await GroupMembership.countDocuments({
      group: group._id,
      membershipStatus: 'active',
    });

    // Check-in voluntary roll-call breakdown
    const checkIns = await SafetyCheckIn.find({ group: group._id });
    const stats = {
      safe: checkIns.filter((c) => c.status === 'I_AM_SAFE').length,
      needAssistance: checkIns.filter((c) => c.status === 'I_NEED_ASSISTANCE').length,
      emergency: checkIns.filter((c) => c.status === 'EMERGENCY').length,
      unableToConfirm: checkIns.filter((c) => c.status === 'UNABLE_TO_CONFIRM').length,
    };
    stats.checkedInTotal = checkIns.length;
    stats.notCheckedIn = Math.max(0, memberCount - stats.checkedInTotal);

    const userCheckIn = await SafetyCheckIn.findOne({
      group: group._id,
      user: req.user._id,
    });

    res.status(200).json({
      success: true,
      group,
      membership: membership
        ? {
            role: membership.role,
            joinedAt: membership.joinedAt,
            status: membership.membershipStatus,
          }
        : null,
      memberCount,
      stats,
      userCheckIn,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update group settings
// @route   PATCH /api/groups/:groupId
// @access  Protected (Admin only)
export const updateGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { name, description, category, areaDescription, privacy } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    const membership = await GroupMembership.findOne({
      group: groupId,
      user: req.user._id,
      membershipStatus: 'active',
    });

    const isSystemAdmin = req.user.role === 'admin';
    if (!isSystemAdmin && (!membership || membership.role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Only group administrators can modify settings.' });
    }

    if (name && name.trim()) group.name = name.trim();
    if (description !== undefined) group.description = description.trim();
    if (category) group.category = category;
    if (areaDescription !== undefined) group.areaDescription = areaDescription.trim();
    if (privacy) group.privacy = privacy;

    await group.save();

    res.status(200).json({
      success: true,
      message: 'Group updated successfully.',
      group,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join a group with an invite code
// @route   POST /api/groups/join
// @access  Protected
export const joinGroup = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode || !inviteCode.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide an invite code.' });
    }

    const cleanCode = inviteCode.trim().toUpperCase();

    const group = await Group.findOne({ inviteCode: cleanCode });
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'This invite code is invalid, expired, or unavailable.',
      });
    }

    const existingMembership = await GroupMembership.findOne({
      group: group._id,
      user: req.user._id,
    });

    if (existingMembership && existingMembership.membershipStatus === 'active') {
      return res.status(400).json({
        success: false,
        message: `You are already an active member of "${group.name}".`,
        groupId: group._id,
      });
    }

    if (existingMembership) {
      existingMembership.membershipStatus = 'active';
      existingMembership.joinedAt = new Date();
      await existingMembership.save();
    } else {
      await GroupMembership.create({
        group: group._id,
        user: req.user._id,
        role: 'member',
        membershipStatus: 'active',
        joinedAt: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      message: 'You have joined the group successfully.',
      group: {
        _id: group._id,
        name: group.name,
        category: group.category,
        description: group.description,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get members of a group with their voluntary check-in status
// @route   GET /api/groups/:groupId/members
// @access  Protected
export const getGroupMembers = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const callerMembership = await GroupMembership.findOne({
      group: groupId,
      user: req.user._id,
      membershipStatus: 'active',
    });

    const isSystemCoordinator = req.user.role === 'coordinator' || req.user.role === 'admin';
    if (!callerMembership && !isSystemCoordinator) {
      return res.status(403).json({ success: false, message: 'You must be a member to inspect the group roster.' });
    }

    const memberships = await GroupMembership.find({
      group: groupId,
      membershipStatus: 'active',
    })
      .populate('user', 'name email role organization phone')
      .sort({ joinedAt: 1 });

    const checkIns = await SafetyCheckIn.find({ group: groupId });
    const checkInMap = new Map();
    checkIns.forEach((c) => checkInMap.set(c.user.toString(), c));

    const isGroupAdmin = callerMembership?.role === 'admin' || isSystemCoordinator;

    const members = memberships.map((m) => {
      const u = m.user;
      const c = u ? checkInMap.get(u._id.toString()) : null;

      return {
        membershipId: m._id,
        userId: u?._id,
        name: u?.name || 'Community Member',
        role: m.role,
        joinedAt: m.joinedAt,
        checkIn: c
          ? {
              status: c.status,
              message: c.message,
              note: c.message,
              updatedAt: c.updatedAt,
              // Privacy rule: Only reveal location if user checked the share location box or caller is admin
              approximateLocation: c.locationShared || isGroupAdmin ? c.approximateLocation : null,
              locationShared: c.locationShared,
            }
          : {
              status: 'NOT_CHECKED_IN',
              updatedAt: null,
            },
      };
    });

    const stats = {
      totalMembers: memberships.length,
      safe: 0,
      assistanceRequested: 0,
      emergency: 0,
      unableToConfirm: 0,
      notCheckedIn: 0,
    };
    members.forEach((m) => {
      const st = m.checkIn?.status;
      if (st === 'I_AM_SAFE') stats.safe++;
      else if (st === 'I_NEED_ASSISTANCE') stats.assistanceRequested++;
      else if (st === 'EMERGENCY') stats.emergency++;
      else if (st === 'UNABLE_TO_CONFIRM') stats.unableToConfirm++;
      else stats.notCheckedIn++;
    });

    res.status(200).json({
      success: true,
      count: members.length,
      stats,
      members,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit or update voluntary safety check-in
// @route   POST /api/groups/:groupId/check-ins
// @access  Protected
export const submitSafetyCheckIn = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { status, message, note, approximateLocation, locationShared } = req.body;
    const checkInText = (note || message || '').trim();

    const validStatuses = ['I_AM_SAFE', 'I_NEED_ASSISTANCE', 'EMERGENCY', 'UNABLE_TO_CONFIRM'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status required: I_AM_SAFE, I_NEED_ASSISTANCE, EMERGENCY, UNABLE_TO_CONFIRM.',
      });
    }

    const membership = await GroupMembership.findOne({
      group: groupId,
      user: req.user._id,
      membershipStatus: 'active',
    });

    if (!membership) {
      return res.status(403).json({ success: false, message: 'You must be a member of this group to check in.' });
    }

    const checkIn = await SafetyCheckIn.findOneAndUpdate(
      { group: groupId, user: req.user._id },
      {
        status,
        message: checkInText,
        approximateLocation: approximateLocation ? approximateLocation.trim() : '',
        locationShared: Boolean(locationShared),
      },
      { upsert: true, new: true, runValidators: true }
    );

    const checkInObj = checkIn.toObject();
    checkInObj.note = checkInObj.message;

    res.status(200).json({
      success: true,
      message: 'Voluntary safety check-in updated successfully.',
      checkIn: checkInObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get check-ins for a group
// @route   GET /api/groups/:groupId/check-ins
// @access  Protected
export const getGroupCheckIns = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const membership = await GroupMembership.findOne({
      group: groupId,
      user: req.user._id,
      membershipStatus: 'active',
    });

    const isSystemCoordinator = req.user.role === 'coordinator' || req.user.role === 'admin';
    if (!membership && !isSystemCoordinator) {
      return res.status(403).json({ success: false, message: 'You must be a member to view group check-ins.' });
    }

    const checkIns = await SafetyCheckIn.find({ group: groupId })
      .populate('user', 'name role')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: checkIns.length,
      checkIns,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get group announcements
// @route   GET /api/groups/:groupId/announcements
// @access  Protected
export const getGroupAnnouncements = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const announcements = await GroupAnnouncement.find({ group: groupId })
      .sort({ createdAt: -1 })
      .limit(30);

    res.status(200).json({
      success: true,
      count: announcements.length,
      announcements,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create an announcement for a group
// @route   POST /api/groups/:groupId/announcements
// @access  Protected (Admin / Moderator)
export const createGroupAnnouncement = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { title, content, message, priority } = req.body;
    const announcementText = (content || message || '').trim();

    if (!title || !title.trim() || !announcementText) {
      return res.status(400).json({ success: false, message: 'Please provide both title and content/message.' });
    }

    const membership = await GroupMembership.findOne({
      group: groupId,
      user: req.user._id,
      membershipStatus: 'active',
    });

    const isSystemCoordinator = req.user.role === 'coordinator' || req.user.role === 'admin';
    const isAuthorized = isSystemCoordinator || (membership && (membership.role === 'admin' || membership.role === 'moderator'));

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Only group admins and moderators can post announcements.',
      });
    }

    const announcement = await GroupAnnouncement.create({
      group: groupId,
      createdBy: req.user._id,
      authorName: req.user.name || 'Community Admin',
      title: title.trim(),
      content: announcementText,
      priority: priority || 'NORMAL',
    });

    res.status(201).json({
      success: true,
      message: 'Announcement published successfully.',
      announcement,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an announcement
// @route   DELETE /api/groups/:groupId/announcements/:announcementId
// @access  Protected
export const deleteGroupAnnouncement = async (req, res, next) => {
  try {
    const { groupId, announcementId } = req.params;

    const announcement = await GroupAnnouncement.findById(announcementId);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }

    const membership = await GroupMembership.findOne({
      group: groupId,
      user: req.user._id,
      membershipStatus: 'active',
    });

    const isAuthor = announcement.createdBy.toString() === req.user._id.toString();
    const isGroupAdmin = membership && membership.role === 'admin';
    const isSystemAdmin = req.user.role === 'admin';

    if (!isAuthor && !isGroupAdmin && !isSystemAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this announcement.' });
    }

    await announcement.deleteOne();

    res.status(200).json({ success: true, message: 'Announcement deleted.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get incidents linked to a group
// @route   GET /api/groups/:groupId/incidents
// @access  Protected
export const getGroupIncidents = async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const incidents = await Incident.find({ group: groupId })
      .sort({ createdAt: -1 })
      .select('incidentType description urgency status verificationStatus location createdAt affectedPeople');

    res.status(200).json({
      success: true,
      count: incidents.length,
      incidents,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent community activity for the homepage
// @route   GET /api/groups/activity
// @access  Public / Optional Auth
export const getRecentCommunityActivity = async (req, res, next) => {
  try {
    const activities = [];

    // If logged in, grab user's groups updates
    if (req.user) {
      const userMemberships = await GroupMembership.find({
        user: req.user._id,
        membershipStatus: 'active',
      }).select('group');
      const userGroupIds = userMemberships.map((m) => m.group);

      if (userGroupIds.length > 0) {
        const [recentAnnouncements, recentCheckIns, groupIncidents] = await Promise.all([
          GroupAnnouncement.find({ group: { $in: userGroupIds } })
            .populate('group', 'name category')
            .sort({ createdAt: -1 })
            .limit(5),
          SafetyCheckIn.find({ group: { $in: userGroupIds } })
            .populate('user', 'name')
            .populate('group', 'name')
            .sort({ updatedAt: -1 })
            .limit(6),
          Incident.find({ group: { $in: userGroupIds } })
            .populate('group', 'name')
            .sort({ createdAt: -1 })
            .limit(4),
        ]);

        recentAnnouncements.forEach((a) => {
          activities.push({
            id: `announcement-${a._id}`,
            type: 'ANNOUNCEMENT',
            title: a.title,
            description: a.content.length > 110 ? a.content.slice(0, 110) + '...' : a.content,
            groupName: a.group?.name || 'Community Group',
            groupId: a.group?._id,
            priority: a.priority,
            authorName: a.authorName,
            timestamp: a.createdAt,
          });
        });

        recentCheckIns.forEach((c) => {
          activities.push({
            id: `checkin-${c._id}`,
            type: 'SAFETY_CHECK_IN',
            title: `${c.user?.name || 'A member'} updated status`,
            status: c.status,
            description: c.message || 'Voluntary safety check-in recorded',
            groupName: c.group?.name || 'Community Group',
            groupId: c.group?._id,
            timestamp: c.updatedAt,
          });
        });

        groupIncidents.forEach((inc) => {
          activities.push({
            id: `group-inc-${inc._id}`,
            type: 'INCIDENT',
            title: `${inc.incidentType} Case Logged`,
            description: inc.description.length > 100 ? inc.description.slice(0, 100) + '...' : inc.description,
            groupName: inc.group?.name || 'Community Group',
            groupId: inc.group?._id,
            urgency: inc.urgency,
            status: inc.status,
            timestamp: inc.createdAt,
          });
        });
      }
    }

    // Also include verified public supplies and public incidents
    const [publicResources, publicIncidents] = await Promise.all([
      ResourceOffer.find({ verificationStatus: 'VERIFIED', availability: 'Available' })
        .sort({ createdAt: -1 })
        .limit(4),
      Incident.find({ verificationStatus: 'VERIFIED' })
        .sort({ createdAt: -1 })
        .limit(4),
    ]);

    publicResources.forEach((r) => {
      activities.push({
        id: `resource-${r._id}`,
        type: 'RESOURCE_AVAILABLE',
        title: `${r.resourceType}: ${r.title}`,
        description: r.quantity ? `Quantity: ${r.quantity}. Stored at ${r.location?.address}` : r.description,
        timestamp: r.createdAt,
      });
    });

    publicIncidents.forEach((inc) => {
      activities.push({
        id: `public-inc-${inc._id}`,
        type: 'VERIFIED_INCIDENT',
        title: `Verified ${inc.incidentType} Response`,
        description: `Coordinators verified incident near ${inc.location?.address}`,
        urgency: inc.urgency,
        status: inc.status,
        timestamp: inc.createdAt,
      });
    });

    // Sort combined activities by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const finalActivities = activities.slice(0, 12);
    res.status(200).json({
      success: true,
      count: finalActivities.length,
      activities: finalActivities,
      activity: finalActivities,
    });
  } catch (error) {
    next(error);
  }
};
