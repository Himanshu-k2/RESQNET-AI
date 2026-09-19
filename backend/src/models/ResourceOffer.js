import mongoose from 'mongoose';

const resourceOfferSchema = new mongoose.Schema(
  {
    resourceType: {
      type: String,
      required: [true, 'Please select a resource type'],
      enum: [
        'Food',
        'Water',
        'Medical kits',
        'Ambulance support',
        'Shelter',
        'Transport',
        'Rescue equipment',
        'Volunteers',
        'Other',
      ],
    },
    title: {
      type: String,
      required: [true, 'Please provide a title for this resource offer'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide details on what is available'],
      trim: true,
      maxlength: [1500, 'Description cannot exceed 1500 characters'],
    },
    quantity: {
      type: String,
      required: [true, 'Please specify quantity or capacity'],
      trim: true,
    },
    unit: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      address: {
        type: String,
        required: [true, 'Please specify resource location'],
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
    availability: {
      type: String,
      enum: ['Available', 'In Use', 'Standby', 'Allocated', 'Unavailable', 'Expired'],
      default: 'Available',
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING_VERIFICATION', 'VERIFIED', 'REJECTED'],
      default: 'PENDING_VERIFICATION',
    },
    contact: {
      name: { type: String, required: [true, 'Contact name is required'] },
      phone: { type: String, required: [true, 'Contact phone is required'] },
      email: { type: String, default: '' },
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    providedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedByName: {
      type: String,
      default: '',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const ResourceOffer = mongoose.model('ResourceOffer', resourceOfferSchema);
