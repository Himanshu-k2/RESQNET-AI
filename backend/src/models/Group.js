import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a group name'],
      trim: true,
      maxlength: [60, 'Group name cannot exceed 60 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
      default: '',
    },
    category: {
      type: String,
      enum: [
        'Family', 'Hostel', 'College', 'Apartment', 'Office', 'Community', 'Other',
        'APARTMENT', 'NEIGHBORHOOD', 'WORKPLACE', 'SCHOOL_COLLEGE', 'VOLUNTEER_ORG', 'FAMILY_FRIENDS', 'OTHER'
      ],
      default: 'Community',
    },
    areaDescription: {
      type: String,
      trim: true,
      maxlength: [100, 'Area description cannot exceed 100 characters'],
      default: '',
    },
    privacy: {
      type: String,
      enum: ['PRIVATE', 'INVITE_ONLY'],
      default: 'PRIVATE',
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

groupSchema.index({ createdBy: 1, createdAt: -1 });

export const Group = mongoose.model('Group', groupSchema);
