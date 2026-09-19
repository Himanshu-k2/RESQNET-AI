import express from 'express';
import { getOverviewAnalytics } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/overview', getOverviewAnalytics);

export default router;
