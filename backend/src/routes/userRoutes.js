import express from 'express';
import {
  getUsers,
  updateUserRole,
  updateUserStatus,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Strict Admin-only access
router.use(protect, authorize('ADMIN', 'admin'));

router.get('/', getUsers);
router.patch('/:id/role', updateUserRole);
router.patch('/:id/status', updateUserStatus);

export default router;
