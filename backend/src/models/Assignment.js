import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    incident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      required: [true, 'Assignment must reference an emergency incident'],
      index: true,
    },
    requestId: {
      type: String,
      required: true,
      index: true,
    },
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ResourceOffer',
      required: [true, 'Assignment must reference a relief resource offer'],
      index: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assignment must identify the resource provider'],
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assignment must identify the allocating authority'],
    },
    assignedByName: {
      type: String,
      default: 'Authorized Coordinator',
    },
    status: {
      type: String,
      enum: ['PROPOSED', 'APPROVED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'ASSIGNED',
      index: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
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

assignmentSchema.index({ provider: 1, status: 1 });
assignmentSchema.index({ incident: 1, resource: 1 });

export const Assignment = mongoose.model('Assignment', assignmentSchema);
