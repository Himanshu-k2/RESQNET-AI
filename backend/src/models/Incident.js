import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema(
  {
    incidentType: {
      type: String,
      required: [true, 'Please specify an incident type'],
      enum: [
        'Flood',
        'Fire',
        'Building Collapse',
        'Medical Emergency',
        'Earthquake',
        'Extreme Weather',
        'Accident',
        'Missing Person',
        'Other',
      ],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description of the emergency'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    location: {
      address: {
        type: String,
        required: [true, 'Please provide an approximate location or address'],
        trim: true,
      },
      landmark: {
        type: String,
        default: '',
        trim: true,
      },
      coordinates: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
      },
    },
    affectedPeople: {
      type: String,
      default: 'Unknown',
    },
    safetyStatus: {
      type: String,
      enum: [
        'Safe',
        'In Immediate Danger',
        'Trapped',
        'Medical Attention Needed',
        'Unknown',
      ],
      default: 'Unknown',
    },
    requiredResources: {
      type: [String],
      default: [],
    },
    contact: {
      name: { type: String, default: 'Anonymous Citizen' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
    },
    requestId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    trackingPin: {
      type: String,
      default: '',
    },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    source: {
      type: String,
      enum: ['USER_REPORTED', 'OFFLINE_SYNC', 'SIMULATION', 'DISPATCH'],
      default: 'USER_REPORTED',
    },
    status: {
      type: String,
      enum: [
        'SUBMITTED',
        'NEW',
        'REPORTED',
        'UNDER_REVIEW',
        'PENDING_VERIFICATION',
        'NEEDS_MORE_INFORMATION',
        'VERIFIED',
        'RESOURCE_MATCHED',
        'ASSIGNED',
        'IN_PROGRESS',
        'RESOLVED',
        'REJECTED',
        'DUPLICATE',
        'CLOSED',
      ],
      default: 'PENDING_VERIFICATION',
    },
    verificationStatus: {
      type: String,
      enum: [
        'PENDING_VERIFICATION',
        'VERIFIED',
        'REJECTED',
        'NEEDS_MORE_INFORMATION',
      ],
      default: 'PENDING_VERIFICATION',
      index: true,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedByName: {
      type: String,
      default: '',
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    assignedCoordinator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedCoordinatorName: {
      type: String,
      default: '',
    },
    timeline: [
      {
        eventType: { type: String, required: true },
        description: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        performedBy: { type: String, default: 'System' },
        performedByRole: { type: String, default: 'system' },
      },
    ],
    urgency: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'High',
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
      index: true,
    },
    isSimulation: {
      type: Boolean,
      default: false,
    },
    simulationScenario: {
      type: String,
      default: null,
    },
    notes: {
      type: [String],
      default: [],
    },
    clientId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    offlineCreatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Incident = mongoose.model('Incident', incidentSchema);
