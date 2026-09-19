import mongoose from 'mongoose';

const groupAnnouncementSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: {
      type: String,
      default: 'Community Admin',
    },
    title: {
      type: String,
      required: [true, 'Please provide an announcement title'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    content: {
      type: String,
      required: [true, 'Please provide announcement content'],
      trim: true,
      maxlength: [1000, 'Content cannot exceed 1000 characters'],
    },
    priority: {
      type: String,
      enum: ['NORMAL', 'IMPORTANT', 'SAFETY_NOTICE'],
      default: 'NORMAL',
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

groupAnnouncementSchema.index({ group: 1, createdAt: -1 });

export const GroupAnnouncement = mongoose.model('GroupAnnouncement', groupAnnouncementSchema);
