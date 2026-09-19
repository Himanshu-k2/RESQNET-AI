import express from 'express';
import {
  guideChat,
  reportExtraction,
  resourceMatching,
  incidentSummary,
  approveAllocation,
  scenarioAnalysis,
} from '../controllers/aiController.js';
import {
  validateExtractionInput,
  validateGuideInput,
  validateResourceMatchingInput,
  validateIncidentSummaryInput,
} from '../validators/aiValidators.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/guide', validateGuideInput, guideChat);
router.post('/report-extraction', validateExtractionInput, reportExtraction);
router.post('/resource-matching', validateResourceMatchingInput, resourceMatching);
router.post('/incident-summary', validateIncidentSummaryInput, incidentSummary);
router.post('/scenario-analysis', protect, authorize('admin', 'coordinator', 'RESOURCE_PROVIDER', 'citizen'), scenarioAnalysis);
router.post('/approve-allocation', protect, authorize('coordinator', 'admin'), approveAllocation);

export default router;
