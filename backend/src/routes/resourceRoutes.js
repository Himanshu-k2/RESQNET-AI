import express from 'express';
import {
  createResource,
  getResources,
  getMyResources,
  updateResource,
  verifyResource,
} from '../controllers/resourceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return protect(req, res, next);
  }
  next();
};

router.route('/').post(optionalAuth, createResource).get(getResources);
router.route('/my').get(protect, getMyResources);
router.route('/:id').patch(protect, updateResource);
router.route('/:id/verify').post(protect, authorize('coordinator', 'admin'), verifyResource);

export default router;
