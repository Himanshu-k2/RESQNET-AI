import express from 'express';
import {
  createAssignment,
  getAssignments,
  updateAssignmentStatus,
} from '../controllers/assignmentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', authorize('admin', 'coordinator'), createAssignment);
router.get('/', getAssignments);
router.patch('/:id/status', updateAssignmentStatus);

export default router;
