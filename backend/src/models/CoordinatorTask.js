import mongoose from 'mongoose';

const coordinatorTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a task title'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    incident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident',
      default: null,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedToName: {
      type: String,
      default: 'Unassigned',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdByName: {
      type: String,
      default: 'Coordinator',
    },
    deadline: {
      type: Date,
      default: null,
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

coordinatorTaskSchema.index({ incident: 1, createdAt: -1 });
coordinatorTaskSchema.index({ status: 1 });

export const CoordinatorTask = mongoose.model('CoordinatorTask', coordinatorTaskSchema);
