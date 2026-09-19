import { ResourceOffer } from '../models/ResourceOffer.js';
import { AuditLog } from '../models/AuditLog.js';

// @desc    Register a new resource offer
// @route   POST /api/resources
// @access  Public / Optional Auth
export const createResource = async (req, res, next) => {
  try {
    const {
      resourceType,
      title,
      description,
      quantity,
      unit,
      location,
      availability,
      contact,
      expiryDate,
      isSimulation,
    } = req.body;

    if (!resourceType || !title || !description || !quantity || !location?.address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide resource type, title, description, quantity, and location address.',
      });
    }

    const resource = await ResourceOffer.create({
      resourceType,
      title,
      description,
      quantity,
      unit: unit || '',
      location: {
        address: location.address,
        landmark: location.landmark || '',
        coordinates: location.coordinates || { lat: null, lng: null },
      },
      availability: availability || 'Available',
      verificationStatus: 'PENDING_VERIFICATION',
      contact: {
        name: contact?.name || req.user?.name || 'Community Provider',
        phone: contact?.phone || req.user?.phone || 'Contact via ResQNet',
        email: contact?.email || req.user?.email || '',
      },
      expiryDate: expiryDate || null,
      providedBy: req.user?._id || null,
      isSimulation: Boolean(isSimulation),
    });

    res.status(201).json({
      success: true,
      message: 'Resource offer registered successfully. Stored as PENDING_VERIFICATION.',
      resource,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all resource offers with filters
// @route   GET /api/resources
// @access  Public
export const getResources = async (req, res, next) => {
  try {
    const {
      resourceType,
      availability,
      verificationStatus,
      search,
      limit = 50,
      page = 1,
      isSimulation,
    } = req.query;

    const filter = {};

    if (isSimulation !== undefined && isSimulation !== 'ALL') {
      filter.isSimulation = isSimulation === 'true';
    }

    if (resourceType && resourceType !== 'ALL') {
      filter.resourceType = resourceType;
    }

    if (availability && availability !== 'ALL') {
      filter.availability = availability;
    }

    if (verificationStatus && verificationStatus !== 'ALL') {
      filter.verificationStatus = verificationStatus;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: regex },
        { description: regex },
        { 'location.address': regex },
        { resourceType: regex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [total, resources] = await Promise.all([
      ResourceOffer.countDocuments(filter),
      ResourceOffer.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('providedBy', 'name email role organization')
        .populate('verifiedBy', 'name email role organization'),
    ]);

    res.status(200).json({
      success: true,
      count: resources.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)) || 1,
      resources,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get resources owned by the logged-in user
// @route   GET /api/resources/my
// @access  Protected
export const getMyResources = async (req, res, next) => {
  try {
    const resources = await ResourceOffer.find({ providedBy: req.user._id })
      .sort({ createdAt: -1 })
      .populate('verifiedBy', 'name email role organization');

    res.status(200).json({
      success: true,
      count: resources.length,
      resources,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update resource availability or verification status
// @route   PATCH /api/resources/:id
// @access  Protected
export const updateResource = async (req, res, next) => {
  try {
    const { availability, verificationStatus, quantity, unit, description, notes } = req.body;
    let resource = await ResourceOffer.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource offer not found',
      });
    }

    const role = (req.user?.role || '').toUpperCase();
    const isStaff = role === 'ADMIN' || role === 'COORDINATOR';

    // If regular provider or citizen, enforce ownership
    if (!isStaff) {
      if (!resource.providedBy || resource.providedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only edit resources that you own.',
        });
      }

      // Providers CANNOT modify verificationStatus or verifiedBy
      if (verificationStatus !== undefined) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Resource providers cannot modify verification status.',
        });
      }
    }

    if (availability !== undefined) resource.availability = availability;
    if (quantity !== undefined) resource.quantity = quantity;
    if (unit !== undefined) resource.unit = unit;
    if (description !== undefined) resource.description = description;

    if (isStaff && verificationStatus !== undefined) {
      resource.verificationStatus = verificationStatus;
    }

    if (notes) {
      if (Array.isArray(notes)) {
        resource.notes.push(...notes);
      } else if (typeof notes === 'string') {
        resource.notes.push(notes);
      }
    }

    await resource.save();

    res.status(200).json({
      success: true,
      message: 'Resource offer updated successfully',
      resource,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify or reject a resource offer (Human-in-the-loop coordinator action)
// @route   POST /api/resources/:id/verify
// @access  Protected (Coordinator or Admin only)
export const verifyResource = async (req, res, next) => {
  try {
    const { action, reason } = req.body; // action: 'VERIFY' | 'REJECT'
    const coordinator = req.user;

    if (!['VERIFY', 'REJECT'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be 'VERIFY' or 'REJECT'.",
      });
    }

    if (action === 'REJECT' && (!reason || !reason.trim())) {
      return res.status(400).json({
        success: false,
        message: 'A reason is required when rejecting a resource offer.',
      });
    }

    const resource = await ResourceOffer.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource offer not found',
      });
    }

    if (action === 'VERIFY') {
      resource.verificationStatus = 'VERIFIED';
      resource.verifiedBy = coordinator._id;
      resource.verifiedByName = coordinator.name;
      resource.rejectionReason = '';

      const verifyNote = `[VERIFIED at ${new Date().toLocaleTimeString()} by Coordinator ${coordinator.name}]`;
      resource.notes.push(verifyNote);

      await AuditLog.create({
        action: 'RESOURCE_VERIFIED',
        user: coordinator._id,
        userName: coordinator.name,
        userRole: coordinator.role,
        targetType: 'ResourceOffer',
        targetId: resource._id,
        details: { verificationStatus: 'VERIFIED' },
        reason: reason || 'Resource specifications and provider contacted & verified.',
      });
    } else if (action === 'REJECT') {
      resource.verificationStatus = 'REJECTED';
      resource.availability = 'Unavailable';
      resource.verifiedBy = coordinator._id;
      resource.verifiedByName = coordinator.name;
      resource.rejectionReason = reason.trim();

      const rejectNote = `[REJECTED at ${new Date().toLocaleTimeString()} by Coordinator ${coordinator.name}]: ${reason.trim()}`;
      resource.notes.push(rejectNote);

      await AuditLog.create({
        action: 'RESOURCE_REJECTED',
        user: coordinator._id,
        userName: coordinator.name,
        userRole: coordinator.role,
        targetType: 'ResourceOffer',
        targetId: resource._id,
        details: { verificationStatus: 'REJECTED', availability: 'Unavailable' },
        reason: reason.trim(),
      });
    }

    await resource.save();

    res.status(200).json({
      success: true,
      message: `Resource offer ${action === 'VERIFY' ? 'verified' : 'rejected'} successfully`,
      resource,
    });
  } catch (error) {
    next(error);
  }
};
