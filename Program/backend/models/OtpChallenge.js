import mongoose from 'mongoose';

const otpChallengeSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['register', 'login'],
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    resendAvailableAt: {
      type: Date,
      required: true,
    },
    // For pending registration only: store pre-hashed password and name
    pendingUserData: {
      name: { type: String },
      passwordHash: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically remove expired challenges from database
otpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpChallengeSchema.index({ email: 1, purpose: 1 });

export const OtpChallenge = mongoose.model('OtpChallenge', otpChallengeSchema);
