import crypto from 'crypto';
import { Incident } from '../models/Incident.js';
import { AuditLog } from '../models/AuditLog.js';
import { Notification } from '../models/Notification.js';

// @desc    Create a new emergency incident report
// @route   POST /api/incidents
// @access  Public / Optional Auth
export const createIncident = async (req, res, next) => {
  try {
    const {
      incidentType,
      description,
      location,
      affectedPeople,
      safetyStatus,
      requiredResources,
      contact,
      urgency,
      isSimulation,
      clientId,
      offlineCreatedAt,
      groupId,
      group: groupPayloadId,
    } = req.body;

    const assignedGroup = groupId || groupPayloadId || null;

    if (!incidentType || !description || !location?.address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide incident type, description, and location address.',
      });
    }

    // Duplicate prevention: If a report with this clientId was already synced/created
    if (clientId) {
      const existing = await Incident.findOne({ clientId });
      if (existing) {
        return res.status(200).json({
          success: true,
          message: 'Incident already uploaded (deduplicated).',
          incidentId: existing._id,
          clientId,
          status: existing.status,
          verificationStatus: existing.verificationStatus,
          duplicate: true,
          incident: existing,
        });
      }
    }

    const initialTimeline = [
      {
        eventType: 'REPORT_CREATED',
        description: offlineCreatedAt
          ? `Report created offline on citizen device at ${new Date(offlineCreatedAt).toLocaleTimeString()}`
          : 'Report created by citizen',
        timestamp: offlineCreatedAt ? new Date(offlineCreatedAt) : new Date(),
        performedBy: contact?.name || req.user?.name || 'Anonymous Citizen',
        performedByRole: req.user?.role || 'citizen',
      },
      {
        eventType: 'REPORT_SUBMITTED',
        description: 'Incident transmitted to central emergency coordination network',
        timestamp: new Date(),
        performedBy: 'System Gateway',
        performedByRole: 'system',
      },
    ];

    // Generate unique Request ID and 6-digit Tracking PIN
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const generatedRequestId = `REQ-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;
    const generatedTrackingPin = Math.floor(100000 + Math.random() * 900000).toString();

    const incident = await Incident.create({
      incidentType,
      description,
      location: {
        address: location.address,
        landmark: location.landmark || '',
        coordinates: location.coordinates || { lat: null, lng: null },
      },
      affectedPeople: affectedPeople || 'Unknown',
      safetyStatus: safetyStatus || 'Unknown',
      requiredResources: Array.isArray(requiredResources) ? requiredResources : [],
      contact: {
        name: contact?.name || req.user?.name || 'Anonymous Citizen',
        phone: contact?.phone || req.user?.phone || '',
        email: contact?.email || req.user?.email || '',
      },
      requestId: req.body.requestId || generatedRequestId,
      trackingPin: req.body.trackingPin || generatedTrackingPin,
      requesterId: req.user?._id || null,
      source: req.body.source || 'USER_REPORTED',
      urgency: urgency || 'High',
      status: 'PENDING_VERIFICATION',
      verificationStatus: 'PENDING_VERIFICATION',
      reportedBy: req.user?._id || null,
      group: assignedGroup,
      isSimulation: Boolean(isSimulation),
      clientId: clientId || undefined,
      offlineCreatedAt: offlineCreatedAt ? new Date(offlineCreatedAt) : null,
      timeline: initialTimeline,
    });

    res.status(201).json({
      success: true,
      message: 'Incident uploaded successfully. Stored as PENDING_VERIFICATION.',
      incidentId: incident._id,
      requestId: incident.requestId,
      trackingPin: incident.trackingPin,
      clientId: clientId || null,
      status: 'PENDING_VERIFICATION',
      verificationStatus: 'PENDING_VERIFICATION',
      duplicate: false,
      incident,
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.clientId) {
      const existing = await Incident.findOne({ clientId: req.body.clientId });
      return res.status(200).json({
        success: true,
        message: 'Incident already uploaded (deduplicated).',
        incidentId: existing?._id,
        clientId: req.body.clientId,
        status: existing?.status || 'PENDING_VERIFICATION',
        verificationStatus: existing?.verificationStatus || 'PENDING_VERIFICATION',
        duplicate: true,
        incident: existing,
      });
    }
    next(error);
  }
};

// @desc    Get all incident reports with filtering, search, and pagination
// @route   GET /api/incidents
// @access  Public
export const getIncidents = async (req, res, next) => {
  try {
    const {
      status,
      verificationStatus,
      incidentType,
      urgency,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 50,
      page = 1,
      isSimulation,
      group,
      groupId,
    } = req.query;

    const filter = {};

    if (group || groupId) {
      filter.group = group || groupId;
    }

    if (isSimulation !== undefined && isSimulation !== 'ALL') {
      filter.isSimulation = isSimulation === 'true';
    }

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (verificationStatus && verificationStatus !== 'ALL') {
      filter.verificationStatus = verificationStatus;
    }

    if (incidentType && incidentType !== 'ALL') {
      filter.incidentType = incidentType;
    }

    if (urgency && urgency !== 'ALL') {
      filter.urgency = urgency;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { description: regex },
        { 'location.address': regex },
        { 'location.landmark': regex },
        { incidentType: regex },
        { requestId: regex },
      ];
    }

    const sortOption = {};
    sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (Number(page) - 1) * Number(limit);

    const [total, incidents] = await Promise.all([
      Incident.countDocuments(filter),
      Incident.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .populate('reportedBy', 'name email role organization')
        .populate('verifiedBy', 'name email role organization')
        .populate('assignedCoordinator', 'name email role organization'),
    ]);

    res.status(200).json({
      success: true,
      count: incidents.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)) || 1,
      incidents,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single incident report by ID with sanitized contact info based on auth
// @route   GET /api/incidents/:id
// @access  Public (Sanitized for unauthenticated/citizen; Full for coordinator/admin/owner)
export const getIncidentById = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('reportedBy', 'name email role organization')
      .populate('verifiedBy', 'name email role organization')
      .populate('assignedCoordinator', 'name email role organization');

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Emergency incident report not found',
      });
    }

    // Role-based privacy: Only coordinators, admins, or the original reporter can see direct phone/email
    const user = req.user;
    const isAuthorized =
      user &&
      (user.role === 'coordinator' ||
        user.role === 'admin' ||
        (incident.reportedBy && incident.reportedBy._id.toString() === user._id.toString()));

    const incidentData = incident.toObject();
    if (!isAuthorized) {
      incidentData.contact = {
        name: incidentData.contact?.name || 'Anonymous Citizen',
        phone: '[Protected - Coordinator Authorization Required]',
        email: '[Protected - Coordinator Authorization Required]',
      };
    }

    res.status(200).json({
      success: true,
      incident: incidentData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update incident report status or details
// @route   PATCH /api/incidents/:id
// @access  Protected (Coordinators or Reporter)
export const updateIncident = async (req, res, next) => {
  try {
    const { status, notes, urgency, requiredResources, safetyStatus, verificationStatus } = req.body;
    let incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Emergency incident report not found',
      });
    }

    const previousStatus = incident.status;

    if (status) incident.status = status;
    if (verificationStatus) incident.verificationStatus = verificationStatus;
    if (urgency) incident.urgency = urgency;
    if (safetyStatus) incident.safetyStatus = safetyStatus;
    if (requiredResources) incident.requiredResources = requiredResources;
    if (notes) {
      if (Array.isArray(notes)) {
        incident.notes.push(...notes);
      } else if (typeof notes === 'string') {
        incident.notes.push(notes);
      }
    }

    if (status && status !== previousStatus) {
      incident.timeline.push({
        eventType: 'STATUS_UPDATED',
        description: `Status updated from ${previousStatus} to ${status}`,
        timestamp: new Date(),
        performedBy: req.user?.name || 'Authorized Coordinator',
        performedByRole: req.user?.role || 'coordinator',
      });

      if (req.user) {
        await AuditLog.create({
          action: 'INCIDENT_STATUS_CHANGED',
          user: req.user._id,
          userName: req.user.name,
          userRole: req.user.role,
          targetType: 'Incident',
          targetId: incident._id,
          details: { previousStatus, newStatus: status },
        });
      }
    }

    await incident.save();

    res.status(200).json({
      success: true,
      message: 'Incident report updated successfully',
      incident,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify or reject an incident (Human-in-the-loop)
// @route   POST /api/incidents/:id/verify
// @access  Protected (Coordinator or Admin only)
export const verifyIncident = async (req, res, next) => {
  try {
    const { action, reason } = req.body; // action: 'VERIFY' | 'REJECT' | 'NEEDS_MORE_INFO'
    const coordinator = req.user;

    if (!['VERIFY', 'REJECT', 'NEEDS_MORE_INFO'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be 'VERIFY', 'REJECT', or 'NEEDS_MORE_INFO'.",
      });
    }

    if (action === 'REJECT' && (!reason || !reason.trim())) {
      return res.status(400).json({
        success: false,
        message: 'A detailed reason is strictly required when rejecting an emergency report.',
      });
    }

    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found',
      });
    }

    if (action === 'VERIFY') {
      incident.verificationStatus = 'VERIFIED';
      if (incident.status === 'PENDING_VERIFICATION' || incident.status === 'NEW' || incident.status === 'REPORTED') {
        incident.status = 'VERIFIED';
      }
      incident.verifiedBy = coordinator._id;
      incident.verifiedByName = coordinator.name;
      incident.verifiedAt = new Date();
      incident.rejectionReason = '';

      incident.timeline.push({
        eventType: 'INCIDENT_VERIFIED',
        description: `Verified by coordinator ${coordinator.name} (${coordinator.organization || 'Disaster Response'})`,
        timestamp: new Date(),
        performedBy: coordinator.name,
        performedByRole: coordinator.role,
      });

      await AuditLog.create({
        action: 'INCIDENT_VERIFIED',
        user: coordinator._id,
        userName: coordinator.name,
        userRole: coordinator.role,
        targetType: 'Incident',
        targetId: incident._id,
        details: { verificationStatus: 'VERIFIED', incidentStatus: incident.status },
        reason: reason || 'Incident authenticity validated via on-ground cross-check.',
      });
    } else if (action === 'REJECT') {
      incident.verificationStatus = 'REJECTED';
      incident.status = 'REJECTED';
      incident.verifiedBy = coordinator._id;
      incident.verifiedByName = coordinator.name;
      incident.verifiedAt = new Date();
      incident.rejectionReason = reason.trim();

      incident.timeline.push({
        eventType: 'INCIDENT_REJECTED',
        description: `Report rejected: "${reason.trim()}" by coordinator ${coordinator.name}`,
        timestamp: new Date(),
        performedBy: coordinator.name,
        performedByRole: coordinator.role,
      });

      await AuditLog.create({
        action: 'INCIDENT_REJECTED',
        user: coordinator._id,
        userName: coordinator.name,
        userRole: coordinator.role,
        targetType: 'Incident',
        targetId: incident._id,
        details: { verificationStatus: 'REJECTED', incidentStatus: 'REJECTED' },
        reason: reason.trim(),
      });
    } else if (action === 'NEEDS_MORE_INFO') {
      incident.verificationStatus = 'NEEDS_MORE_INFORMATION';
      incident.status = 'UNDER_REVIEW';

      const infoNote = `[MORE INFO REQUESTED by ${coordinator.name}]: ${reason || 'Awaiting additional telemetry/callback verification.'}`;
      incident.notes.push(infoNote);

      incident.timeline.push({
        eventType: 'NEEDS_MORE_INFORMATION',
        description: `Coordinator ${coordinator.name} flagged report for clarification: ${reason || 'Details pending verification.'}`,
        timestamp: new Date(),
        performedBy: coordinator.name,
        performedByRole: coordinator.role,
      });

    } else if (action === 'DUPLICATE') {
      incident.verificationStatus = 'REJECTED';
      incident.status = 'DUPLICATE';
      incident.verifiedBy = coordinator._id;
      incident.verifiedByName = coordinator.name;
      incident.verifiedAt = new Date();
      incident.rejectionReason = reason ? `DUPLICATE: ${reason.trim()}` : 'Marked as duplicate report of an existing active incident.';

      incident.timeline.push({
        eventType: 'INCIDENT_MARKED_DUPLICATE',
        description: `Marked as duplicate by coordinator ${coordinator.name}`,
        timestamp: new Date(),
        performedBy: coordinator.name,
        performedByRole: coordinator.role,
      });

      await AuditLog.create({
        action: 'INCIDENT_REJECTED',
        user: coordinator._id,
        userName: coordinator.name,
        userRole: coordinator.role,
        targetType: 'Incident',
        targetId: incident._id,
        details: { verificationStatus: 'REJECTED', incidentStatus: 'DUPLICATE' },
        reason: 'Marked as duplicate report',
      });
    }

    await incident.save();

    // If requester has an associated user account, create a notification
    const requesterUser = incident.requesterId || incident.reportedBy;
    if (requesterUser) {
      try {
        await Notification.create({
          recipientId: requesterUser,
          type: 'HELP_REQUEST_STATUS_UPDATED',
          title: `Help Request ${incident.requestId || ''} Updated`,
          message: `Your emergency request status has been updated to "${incident.status}" (Verification: ${incident.verificationStatus}).`,
          relatedRequestId: incident.requestId || incident._id.toString(),
          metadata: { incidentId: incident._id, verificationStatus: incident.verificationStatus },
        });
      } catch (notifErr) {
        console.warn('Could not create notification for requester:', notifErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: `Incident successfully updated with verification status: ${incident.verificationStatus}`,
      incident,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign an authorized coordinator to manage an incident
// @route   POST /api/incidents/:id/assign
// @access  Protected (Coordinator or Admin only)
export const assignCoordinator = async (req, res, next) => {
  try {
    const { coordinatorId, coordinatorName } = req.body;
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found',
      });
    }

    incident.assignedCoordinator = coordinatorId || req.user._id;
    incident.assignedCoordinatorName = coordinatorName || req.user.name;
    incident.status = 'ASSIGNED';

    incident.timeline.push({
      eventType: 'COORDINATOR_ASSIGNED',
      description: `Assigned to Lead Coordinator ${incident.assignedCoordinatorName}`,
      timestamp: new Date(),
      performedBy: req.user.name,
      performedByRole: req.user.role,
    });

    await AuditLog.create({
      action: 'INCIDENT_ASSIGNED',
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      targetType: 'Incident',
      targetId: incident._id,
      details: {
        assignedCoordinatorId: incident.assignedCoordinator,
        assignedCoordinatorName: incident.assignedCoordinatorName,
      },
    });

    await incident.save();

    res.status(200).json({
      success: true,
      message: `Incident assigned to ${incident.assignedCoordinatorName}`,
      incident,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a coordinator coordination note
// @route   POST /api/incidents/:id/notes
// @access  Protected (Coordinator or Admin only)
export const addCoordinatorNote = async (req, res, next) => {
  try {
    const { note } = req.body;
    if (!note || !note.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide note text.',
      });
    }

    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found',
      });
    }

    const formattedNote = `[${new Date().toLocaleTimeString()} by ${req.user.name} (${req.user.role})]: ${note.trim()}`;
    incident.notes.push(formattedNote);

    incident.timeline.push({
      eventType: 'COORDINATOR_NOTE',
      description: `Note added by ${req.user.name}: "${note.trim().slice(0, 80)}${note.trim().length > 80 ? '...' : ''}"`,
      timestamp: new Date(),
      performedBy: req.user.name,
      performedByRole: req.user.role,
    });

    await AuditLog.create({
      action: 'NOTE_ADDED',
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      targetType: 'Incident',
      targetId: incident._id,
      details: { noteText: note.trim() },
    });

    await incident.save();

    res.status(200).json({
      success: true,
      message: 'Coordinator note recorded successfully',
      incident,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get incident event timeline
// @route   GET /api/incidents/:id/timeline
// @access  Public
export const getIncidentTimeline = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id).select('timeline incidentType status verificationStatus');
    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found',
      });
    }

    res.status(200).json({
      success: true,
      timeline: incident.timeline || [],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Track emergency request status securely (Public / Anonymous)
// @route   POST /api/incidents/track
// @access  Public
export const trackIncident = async (req, res, next) => {
  try {
    const { requestId, trackingPin, phone } = req.body;

    if (!requestId || !requestId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Request ID.',
      });
    }

    const cleanRequestId = requestId.trim().toUpperCase();
    const incident = await Incident.findOne({
      $or: [
        { requestId: cleanRequestId },
        { _id: cleanRequestId.length === 24 ? cleanRequestId : null },
      ],
    });

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'No emergency request found with the provided identifier.',
      });
    }

    // Security check: require either matching trackingPin or matching phone (if requester provided one)
    const pinMatches = trackingPin && incident.trackingPin && trackingPin.trim() === incident.trackingPin;
    const phoneMatches = phone && incident.contact?.phone && phone.trim() === incident.contact.phone.trim();

    // If incident has trackingPin and requester provided neither or incorrect:
    if (incident.trackingPin && !pinMatches && !phoneMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Tracking PIN or Phone verification for this request.',
      });
    }

    // Return sanitized status information without leaking personal phone, exact home address, or coordinator contact
    res.status(200).json({
      success: true,
      request: {
        id: incident._id,
        requestId: incident.requestId || incident._id,
        incidentType: incident.incidentType,
        generalArea: incident.location?.landmark || incident.location?.address?.split(',')[0] || 'Reported Location',
        status: incident.status,
        verificationStatus: incident.verificationStatus,
        urgency: incident.urgency,
        createdAt: incident.createdAt,
        updatedAt: incident.updatedAt,
        timeline: (incident.timeline || []).map((entry) => ({
          eventType: entry.eventType,
          description: entry.description,
          timestamp: entry.timestamp,
        })),
        notes: (incident.notes || []).map((n) => {
          // Sanitized public notes
          return typeof n === 'string' ? n : (n.note || '');
        }),
      },
    });
  } catch (error) {
    next(error);
  }
};
