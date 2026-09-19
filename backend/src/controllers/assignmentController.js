import { Assignment } from '../models/Assignment.js';
import { Incident } from '../models/Incident.js';
import { ResourceOffer } from '../models/ResourceOffer.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';

// @desc    Create a verified resource assignment for an emergency request
// @route   POST /api/assignments
// @access  Protected (Admin, Coordinator)
export const createAssignment = async (req, res, next) => {
  try {
    const { incidentId, resourceId, notes } = req.body;

    if (!incidentId || !resourceId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both incidentId and resourceId to create an assignment.',
      });
    }

    const [incident, resource] = await Promise.all([
      Incident.findById(incidentId),
      ResourceOffer.findById(resourceId),
    ]);

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Emergency incident not found.' });
    }

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource offer not found.' });
    }

    // Validation: Resource must be verified
    if (resource.verificationStatus !== 'VERIFIED') {
      return res.status(400).json({
        success: false,
        message: `Resource "${resource.title}" is currently "${resource.verificationStatus}". Only VERIFIED resources can be assigned to relief requests.`,
      });
    }

    // Validation: Resource must be available
    if (resource.availability !== 'Available') {
      return res.status(400).json({
        success: false,
        message: `Resource is marked as "${resource.availability}" and cannot be newly assigned.`,
      });
    }

    const targetReqId = incident.requestId || `REQ-${incident._id.toString().slice(-6).toUpperCase()}`;
    const providerUser = resource.providedBy || req.user._id;

    // 1. Create Assignment record
    const assignment = await Assignment.create({
      incident: incident._id,
      requestId: targetReqId,
      resource: resource._id,
      provider: providerUser,
      assignedBy: req.user._id,
      assignedByName: req.user.name || 'Authorized Coordinator',
      status: 'ASSIGNED',
      notes: notes || '',
      isSimulation: Boolean(incident.isSimulation),
    });

    // 2. Update Incident status to ASSIGNED and append to timeline
    incident.status = 'ASSIGNED';
    incident.timeline.push({
      eventType: 'RESOURCE_ASSIGNED',
      description: `Resource "${resource.title}" assigned by ${req.user.name || 'Coordinator'}.`,
      timestamp: new Date(),
      performedBy: req.user.name || 'Coordinator',
      performedByRole: req.user.role || 'coordinator',
    });
    await incident.save();

    // 3. Update Resource availability to Allocated
    resource.availability = 'Allocated';
    await resource.save();

    // 4. Send Notification to Resource Provider
    if (resource.providedBy) {
      await Notification.create({
        recipientId: resource.providedBy,
        type: 'RESOURCE_ASSIGNED',
        title: 'Resource Assignment Received',
        message: `Your verified resource "${resource.title}" has been assigned to help request ${targetReqId}. Please review the assignment details.`,
        relatedRequestId: targetReqId,
        relatedResourceId: resource._id,
        relatedAssignmentId: assignment._id,
        metadata: {
          incidentId: incident._id,
          resourceTitle: resource.title,
          location: incident.location?.address,
        },
      });
    }

    // 5. Send Notification to Incident Requester if an authenticated account was attached
    if (incident.requesterId) {
      await Notification.create({
        recipientId: incident.requesterId,
        type: 'HELP_REQUEST_STATUS_UPDATED',
        title: 'Help Request Update: Resources Assigned',
        message: `Your request (${targetReqId}) has been assigned verified community relief resources.`,
        relatedRequestId: targetReqId,
        relatedResourceId: resource._id,
        relatedAssignmentId: assignment._id,
      });
    }

    // 6. Record Audit Log
    await AuditLog.create({
      action: 'RESOURCE_ALLOCATED',
      user: req.user._id,
      userName: req.user.name || 'Coordinator',
      userRole: req.user.role || 'coordinator',
      targetType: 'Incident',
      targetId: incident._id,
      isSimulation: Boolean(incident.isSimulation),
      details: {
        assignmentId: assignment._id,
        requestId: targetReqId,
        resourceId: resource._id,
        resourceTitle: resource.title,
        providerId: providerUser,
      },
      reason: notes || 'Admin/Coordinator confirmed verified resource assignment.',
    });

    res.status(201).json({
      success: true,
      message: `Resource "${resource.title}" assigned successfully to request ${targetReqId}.`,
      assignment,
      incident,
      resource,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get assignments (Role-aware: Admins/Coordinators get all, Providers get theirs)
// @route   GET /api/assignments
// @access  Protected
export const getAssignments = async (req, res, next) => {
  try {
    const userRole = (req.user?.role || '').toUpperCase();
    const filter = {};

    // Strict data isolation: Providers can only inspect assignments of their own resources
    if (userRole === 'RESOURCE_PROVIDER' || userRole === 'CITIZEN') {
      filter.provider = req.user._id;
    }

    const { status, requestId, isSimulation } = req.query;

    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (requestId) {
      filter.requestId = requestId;
    }
    if (isSimulation !== undefined && isSimulation !== 'ALL') {
      filter.isSimulation = isSimulation === 'true';
    }

    const assignments = await Assignment.find(filter)
      .sort({ assignedAt: -1 })
      .populate('incident', 'incidentType description location urgency status contact requestId')
      .populate('resource', 'title resourceType quantity unit availability location contact')
      .populate('provider', 'name email phone organization')
      .populate('assignedBy', 'name role');

    res.status(200).json({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update assignment status (Provider accept, or Admin complete/cancel)
// @route   PATCH /api/assignments/:id/status
// @access  Protected
export const updateAssignmentStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const { id } = req.params;
    const userRole = (req.user?.role || '').toUpperCase();

    const assignment = await Assignment.findById(id).populate('resource incident');
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    // Role verification
    const isOwner = assignment.provider.toString() === req.user._id.toString();
    const isStaff = userRole === 'ADMIN' || userRole === 'COORDINATOR';

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to update this assignment.',
      });
    }

    // Providers can transition to ACCEPTED
    if (isOwner && !isStaff && status !== 'ACCEPTED') {
      return res.status(403).json({
        success: false,
        message: 'Resource providers can only mark assignments as ACCEPTED.',
      });
    }

    const previousStatus = assignment.status;
    assignment.status = status;
    if (notes) assignment.notes = notes;
    await assignment.save();

    // If completed or cancelled, update resource availability
    if (status === 'COMPLETED' || status === 'CANCELLED') {
      if (assignment.resource) {
        assignment.resource.availability = 'Available';
        await assignment.resource.save();
      }
    }

    // Notify provider if status updated by coordinator
    if (isStaff && assignment.provider.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipientId: assignment.provider,
        type: 'RESOURCE_ASSIGNMENT_UPDATED',
        title: 'Assignment Status Updated',
        message: `Assignment for "${assignment.resource?.title || 'Relief supply'}" updated from ${previousStatus} to ${status}.`,
        relatedRequestId: assignment.requestId,
        relatedAssignmentId: assignment._id,
      });
    }

    res.status(200).json({
      success: true,
      message: `Assignment status updated to ${status}.`,
      assignment,
    });
  } catch (error) {
    next(error);
  }
};
