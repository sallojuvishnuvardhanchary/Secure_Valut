import mongoose from 'mongoose';

export const CATEGORIES = [
  'Social Media',
  'Education',
  'Development',
  'Shopping',
  'Banking',
  'Work',
  'Other',
];

const credentialSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    websiteName: {
      type: String,
      required: [true, 'Website name is required'],
      trim: true,
      maxlength: [100, 'Website name cannot exceed 100 characters'],
    },
    websiteUrl: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Website URL cannot exceed 500 characters'],
    },
    username: {
      type: String,
      required: [true, 'Username or email is required'],
      trim: true,
      maxlength: [150, 'Username cannot exceed 150 characters'],
    },
    encryptedPassword: {
      type: String,
      required: [true, 'Encrypted password is required'],
    },
    iv: {
      type: String,
      required: true,
    },
    authTag: {
      type: String,
      required: true,
    },
    // Blinded HMAC fingerprint to safely check password reuse without decrypting
    passwordFingerprint: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: CATEGORIES,
      default: 'Other',
      index: true,
    },
    notes: {
      type: String,
      default: '',
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    isFavorite: {
      type: Boolean,
      default: false,
      index: true,
    },
    passwordStrength: {
      score: {
        type: Number,
        default: 0,
        min: 0,
        max: 4,
      },
      label: {
        type: String,
        default: 'Weak',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient user filtering & sorting
credentialSchema.index({ userId: 1, isFavorite: 1 });
credentialSchema.index({ userId: 1, category: 1 });
credentialSchema.index({ userId: 1, createdAt: -1 });

export const Credential = mongoose.model('Credential', credentialSchema);
