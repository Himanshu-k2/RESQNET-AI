import express from 'express';
import {
  createGroup,
  getMyGroups,
  getGroupDetails,
  updateGroup,
  joinGroup,
  getGroupMembers,
  submitSafetyCheckIn,
  getGroupCheckIns,
  getGroupAnnouncements,
  createGroupAnnouncement,
  deleteGroupAnnouncement,
  getGroupIncidents,
  getRecentCommunityActivity,
} from '../controllers/groupController.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public / Optional: Community activity feed for homepage
router.get('/activity', optionalAuth, getRecentCommunityActivity);

// Protected routes for group management
router.post('/', protect, createGroup);
router.get('/my', protect, getMyGroups);
router.post('/join', protect, joinGroup);

router.get('/:groupId', protect, getGroupDetails);
router.patch('/:groupId', protect, updateGroup);

router.get('/:groupId/members', protect, getGroupMembers);
router.post('/:groupId/check-ins', protect, submitSafetyCheckIn);
router.get('/:groupId/check-ins', protect, getGroupCheckIns);

router.get('/:groupId/announcements', protect, getGroupAnnouncements);
router.post('/:groupId/announcements', protect, createGroupAnnouncement);
router.delete('/:groupId/announcements/:announcementId', protect, deleteGroupAnnouncement);

router.get('/:groupId/incidents', protect, getGroupIncidents);

export default router;
