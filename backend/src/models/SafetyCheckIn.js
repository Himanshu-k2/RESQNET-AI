import mongoose from 'mongoose';

const safetyCheckInSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ['I_AM_SAFE', 'I_NEED_ASSISTANCE', 'EMERGENCY', 'UNABLE_TO_CONFIRM'],
      required: [true, 'Please provide a check-in status'],
    },
    message: {
      type: String,
      trim: true,
      maxlength: [250, 'Message cannot exceed 250 characters'],
      default: '',
    },
    approximateLocation: {
      type: String,
      trim: true,
      maxlength: [100, 'Approximate location cannot exceed 100 characters'],
      default: '',
    },
    locationShared: {
      type: Boolean,
      default: false,
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

// Each user maintains their latest check-in record per group
safetyCheckInSchema.index({ group: 1, user: 1 }, { unique: true });
safetyCheckInSchema.index({ group: 1, status: 1 });

export const SafetyCheckIn = mongoose.model('SafetyCheckIn', safetyCheckInSchema);
