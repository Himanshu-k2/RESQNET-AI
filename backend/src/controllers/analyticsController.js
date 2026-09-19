import { Incident } from '../models/Incident.js';
import { ResourceOffer } from '../models/ResourceOffer.js';
import { CoordinatorTask } from '../models/CoordinatorTask.js';

// @desc    Get dashboard overview analytics and recent activity
// @route   GET /api/analytics/overview
// @access  Public
export const getOverviewAnalytics = async (req, res, next) => {
  try {
    const [
      totalIncidents,
      pendingIncidents,
      verifiedIncidents,
      activeIncidents,
      assignedIncidents,
      resolvedIncidents,
      totalResources,
      availableResources,
      pendingResources,
      totalTasks,
      pendingTasks,
      recentIncidents,
      recentResources,
      simulatedIncidents,
      realIncidents,
    ] = await Promise.all([
      Incident.countDocuments(),
      Incident.countDocuments({ verificationStatus: 'PENDING_VERIFICATION' }),
      Incident.countDocuments({ verificationStatus: 'VERIFIED' }),
      Incident.countDocuments({ status: { $in: ['NEW', 'REPORTED', 'UNDER_REVIEW', 'PENDING_VERIFICATION', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS'] } }),
      Incident.countDocuments({ status: 'ASSIGNED' }),
      Incident.countDocuments({ status: { $in: ['RESOLVED', 'CLOSED'] } }),
      ResourceOffer.countDocuments(),
      ResourceOffer.countDocuments({ availability: 'Available' }),
      ResourceOffer.countDocuments({ verificationStatus: 'PENDING_VERIFICATION' }),
      CoordinatorTask.countDocuments(),
      CoordinatorTask.countDocuments({ status: { $in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] } }),
      Incident.find().sort({ createdAt: -1 }).limit(5),
      ResourceOffer.find().sort({ createdAt: -1 }).limit(5),
      Incident.countDocuments({ isSimulation: true }),
      Incident.countDocuments({ isSimulation: { $ne: true } }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalIncidents,
        pendingVerification: pendingIncidents,
        verifiedIncidents,
        activeIncidents,
        assignedIncidents,
        resolvedIncidents,
        totalResources,
        availableResources,
        pendingResources,
        totalTasks,
        pendingTasks,
        simulatedIncidents,
        realIncidents,
      },
      recentIncidents,
      recentResources,
    });
  } catch (error) {
    next(error);
  }
};
