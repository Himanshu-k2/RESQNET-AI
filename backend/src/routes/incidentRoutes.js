import express from 'express';
import {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncident,
  verifyIncident,
  assignCoordinator,
  addCoordinatorNote,
  getIncidentTimeline,
  trackIncident,
} from '../controllers/incidentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public emergency tracking route
router.post('/track', trackIncident);

// Optional user attachment for getIncidentById so coordinator/admin role is known
const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return protect(req, res, next);
  }
  next();
};

router.route('/').post(createIncident).get(getIncidents);
router.route('/:id').get(optionalAuth, getIncidentById).patch(protect, updateIncident);

// Human-in-the-loop coordinator endpoints (strictly protected with role authorization)
router.post('/:id/verify', protect, authorize('coordinator', 'admin'), verifyIncident);
router.post('/:id/assign', protect, authorize('coordinator', 'admin'), assignCoordinator);
router.post('/:id/notes', protect, authorize('coordinator', 'admin'), addCoordinatorNote);
router.get('/:id/timeline', getIncidentTimeline);

export default router;
