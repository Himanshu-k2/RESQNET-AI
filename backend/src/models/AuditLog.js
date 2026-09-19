import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'INCIDENT_VERIFIED',
        'INCIDENT_REJECTED',
        'INCIDENT_STATUS_CHANGED',
        'INCIDENT_ASSIGNED',
        'NOTE_ADDED',
        'RESOURCE_VERIFIED',
        'RESOURCE_REJECTED',
        'RESOURCE_ALLOCATED',
        'TASK_CREATED',
        'TASK_UPDATED',
        'SIMULATION_SCENARIO_STARTED',
        'SIMULATION_RESET',
        'SIMULATION_STEP_ADVANCED',
        'USER_ROLE_UPDATED',
        'USER_ACTIVATED',
        'USER_DEACTIVATED',
      ],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      default: 'Authorized Coordinator',
    },
    userRole: {
      type: String,
      default: 'coordinator',
    },
    targetType: {
      type: String,
      enum: ['Incident', 'ResourceOffer', 'CoordinatorTask', 'Simulation', 'User'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    reason: {
      type: String,
      default: '',
    },
    isSimulation: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ targetId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
