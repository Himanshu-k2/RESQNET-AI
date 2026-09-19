import express from 'express';
import {
  startScenario,
  resetSimulation,
  getSimulationStatus,
  advanceDemoStep,
  getScenarioDetails,
} from '../controllers/simulationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public / Optional: Read simulation telemetry and scenario catalog
router.get('/status', getSimulationStatus);
router.get('/scenarios/:id', protect, authorize('admin', 'coordinator', 'RESOURCE_PROVIDER', 'citizen'), getScenarioDetails);

// Protected: Coordinator and Admin actions for starting and resetting simulation scenarios
router.post('/start', protect, authorize('coordinator', 'admin'), startScenario);
router.post('/reset', protect, authorize('coordinator', 'admin'), resetSimulation);
router.post('/advance-step', protect, authorize('coordinator', 'admin'), advanceDemoStep);

export default router;
