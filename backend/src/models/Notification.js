import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification must have a recipient'],
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'RESOURCE_ASSIGNED',
        'RESOURCE_ASSIGNMENT_UPDATED',
        'HELP_REQUEST_STATUS_UPDATED',
        'RESOURCE_VERIFICATION_UPDATED',
        'NEW_COORDINATION_MESSAGE',
        'SYSTEM_NOTIFICATION',
      ],
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: 150,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: 1000,
    },
    relatedRequestId: {
      type: String,
      default: null,
      index: true,
    },
    relatedResourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ResourceOffer',
      default: null,
    },
    relatedAssignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
