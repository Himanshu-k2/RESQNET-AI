import mongoose from 'mongoose';

const groupMembershipSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member',
    },
    membershipStatus: {
      type: String,
      enum: ['active', 'pending', 'declined'],
      default: 'active',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate membership for the same user in the same group
groupMembershipSchema.index({ group: 1, user: 1 }, { unique: true });
groupMembershipSchema.index({ user: 1, membershipStatus: 1 });

export const GroupMembership = mongoose.model('GroupMembership', groupMembershipSchema);
