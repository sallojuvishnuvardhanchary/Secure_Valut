import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { OtpChallenge } from '../models/OtpChallenge.js';
import { generateToken } from '../utils/jwt.js';
import {
  generateSecureOtp,
  hashOtp,
  verifyOtpHash,
  OTP_EXPIRY_MS,
  RESEND_COOLDOWN_MS,
} from '../utils/otpUtils.js';
import { sendOtpEmail } from '../services/emailService.js';
import { encryptPassword, decryptPassword } from '../services/cryptoService.js';

/**
 * Step 1: Initiate New User Registration
 * Validates inputs, creates registration OTP challenge, and sends 6-digit OTP via Gmail SMTP.
 * POST /api/auth/register
 */
export async function register(req, res, next) {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Field presence validations
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, and password.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.',
      });
    }

    // Check resend cooldown if an active challenge exists
    const existingChallenge = await OtpChallenge.findOne({ email: cleanEmail, purpose: 'register' });
    if (existingChallenge && Date.now() < existingChallenge.resendAvailableAt.getTime()) {
      const waitSeconds = Math.ceil((existingChallenge.resendAvailableAt.getTime() - Date.now()) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds} seconds before requesting a new verification code.`,
        cooldownSeconds: waitSeconds,
      });
    }

    // Invalidate any previous registration OTP challenge
    await OtpChallenge.deleteMany({ email: cleanEmail, purpose: 'register' });

    // Generate cryptographically secure 6-digit OTP and secure hash
    const otp = generateSecureOtp();
    const otpHash = hashOtp(otp);

    // Encrypt password securely for pending registration challenge
    const encryptedPwd = encryptPassword(password, 'pending_user_registration_context');

    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    const resendAvailableAt = new Date(Date.now() + RESEND_COOLDOWN_MS);

    // Send OTP via Gmail SMTP first
    await sendOtpEmail({
      to: cleanEmail,
      otp,
      purpose: 'register',
      name: name.trim(),
    });

    // Store OTP challenge in database
    await OtpChallenge.create({
      email: cleanEmail,
      otpHash,
      purpose: 'register',
      expiresAt,
      resendAvailableAt,
      pendingUserData: {
        name: name.trim(),
        passwordHash: JSON.stringify(encryptedPwd),
      },
    });

    return res.status(200).json({
      success: true,
      requireOtp: true,
      purpose: 'register',
      email: cleanEmail,
      message: `A 6-digit verification code has been sent to ${cleanEmail}. Please enter it to complete registration.`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Step 2: Verify Registration OTP & Activate Account
 * POST /api/auth/verify-register-otp
 */
export async function verifyRegisterOtp(req, res, next) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and 6-digit OTP code are required.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const challenge = await OtpChallenge.findOne({ email: cleanEmail, purpose: 'register' });

    if (!challenge) {
      return res.status(400).json({
        success: false,
        message: 'No pending registration request found or code has expired. Please register again.',
      });
    }

    // Check expiration (5 minutes)
    if (Date.now() > challenge.expiresAt.getTime()) {
      await challenge.deleteOne();
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please register again or request a new code.',
      });
    }

    // Check maximum attempts (5 attempts limit)
    if (challenge.attempts >= 5) {
      await challenge.deleteOne();
      return res.status(400).json({
        success: false,
        message: 'Maximum verification attempts exceeded. Please register again.',
      });
    }

    // Increment attempts
    challenge.attempts += 1;
    await challenge.save();

    // Verify OTP using timing-safe comparison
    const isMatch = verifyOtpHash(otp, challenge.otpHash);
    if (!isMatch) {
      const remainingAttempts = 5 - challenge.attempts;
      return res.status(400).json({
        success: false,
        message:
          remainingAttempts > 0
            ? `Invalid verification code. ${remainingAttempts} attempt(s) remaining.`
            : 'Maximum attempts exceeded. This verification code has been invalidated.',
      });
    }

    // Prevent OTP reuse: Delete challenge immediately upon successful match
    await challenge.deleteOne();

    // Ensure account does not already exist
    const userAlreadyExists = await User.findOne({ email: cleanEmail });
    if (userAlreadyExists) {
      return res.status(400).json({
        success: false,
        message: 'Account already registered. Please proceed to login.',
      });
    }

    // Decrypt pending password and create User account
    const encryptedPwdObj = JSON.parse(challenge.pendingUserData.passwordHash);
    const plaintextPassword = decryptPassword(
      encryptedPwdObj.encryptedPassword,
      encryptedPwdObj.iv,
      encryptedPwdObj.authTag,
      'pending_user_registration_context'
    );

    // Create user (password is salted and hashed via User model pre-save hook)
    const newUser = await User.create({
      name: challenge.pendingUserData.name,
      email: cleanEmail,
      password: plaintextPassword,
    });

    return res.status(201).json({
      success: true,
      message: 'Account successfully verified and activated! Please sign in with your master credentials.',
      email: newUser.email,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Step 1: Initiate Login Authentication
 * Validates master credentials, creates login OTP challenge, and sends 6-digit OTP to user's Gmail.
 * Does NOT issue JWT or session until OTP is verified.
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and master password.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Find user and select password field
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    // Credentials verified! Check resend cooldown if an active challenge exists
    const existingChallenge = await OtpChallenge.findOne({ email: cleanEmail, purpose: 'login' });
    if (existingChallenge && Date.now() < existingChallenge.resendAvailableAt.getTime()) {
      const waitSeconds = Math.ceil((existingChallenge.resendAvailableAt.getTime() - Date.now()) / 1000);
      return res.status(429).json({
        success: false,
        message: `A verification code was recently sent. Please wait ${waitSeconds} seconds before requesting another.`,
        cooldownSeconds: waitSeconds,
      });
    }

    // Invalidate any previous login OTP challenge
    await OtpChallenge.deleteMany({ email: cleanEmail, purpose: 'login' });

    // Generate cryptographically secure 6-digit OTP
    const otp = generateSecureOtp();
    const otpHash = hashOtp(otp);

    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    const resendAvailableAt = new Date(Date.now() + RESEND_COOLDOWN_MS);

    // Send OTP email via Gmail SMTP
    await sendOtpEmail({
      to: cleanEmail,
      otp,
      purpose: 'login',
      name: user.name,
    });

    // Store login challenge
    await OtpChallenge.create({
      email: cleanEmail,
      otpHash,
      purpose: 'login',
      expiresAt,
      resendAvailableAt,
    });

    // Return response requiring OTP verification. NO token or session issued!
    return res.status(200).json({
      success: true,
      requireOtp: true,
      purpose: 'login',
      email: cleanEmail,
      message: `A 6-digit verification code has been sent to ${cleanEmail}. Please enter it to authorize your session.`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Step 2: Verify Login OTP & Issue Authenticated Session
 * POST /api/auth/verify-login-otp
 */
export async function verifyLoginOtp(req, res, next) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and 6-digit verification code are required.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const challenge = await OtpChallenge.findOne({ email: cleanEmail, purpose: 'login' });

    if (!challenge) {
      return res.status(400).json({
        success: false,
        message: 'No active login verification request found or code has expired. Please sign in again.',
      });
    }

    // Check expiration (5 minutes)
    if (Date.now() > challenge.expiresAt.getTime()) {
      await challenge.deleteOne();
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please sign in again.',
      });
    }

    // Check attempts limit (5 attempts max)
    if (challenge.attempts >= 5) {
      await challenge.deleteOne();
      return res.status(400).json({
        success: false,
        message: 'Maximum verification attempts exceeded. Please sign in again.',
      });
    }

    // Increment attempts
    challenge.attempts += 1;
    await challenge.save();

    // Verify OTP using timing-safe comparison
    const isMatch = verifyOtpHash(otp, challenge.otpHash);
    if (!isMatch) {
      const remainingAttempts = 5 - challenge.attempts;
      return res.status(400).json({
        success: false,
        message:
          remainingAttempts > 0
            ? `Invalid verification code. ${remainingAttempts} attempt(s) remaining.`
            : 'Maximum attempts exceeded. This verification code has been invalidated.',
      });
    }

    // Consume challenge immediately (prevent reuse)
    await challenge.deleteOne();

    // Find user and update last login
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account no longer exists.',
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Issue JWT token only after successful OTP verification
    const token = generateToken(user._id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: 'OTP verified. Welcome back to SecureVault!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Resend OTP Code with 60-second cooldown enforcement
 * POST /api/auth/resend-otp
 */
export async function resendOtp(req, res, next) {
  try {
    const { email, purpose } = req.body;

    if (!email || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Email and purpose are required to resend verification code.',
      });
    }

    if (!['register', 'login'].includes(purpose)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification purpose.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const challenge = await OtpChallenge.findOne({ email: cleanEmail, purpose });

    if (!challenge) {
      return res.status(400).json({
        success: false,
        message: 'No active verification session found. Please start over.',
      });
    }

    // Enforce 60-second cooldown
    const now = Date.now();
    if (now < challenge.resendAvailableAt.getTime()) {
      const waitSeconds = Math.ceil((challenge.resendAvailableAt.getTime() - now) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds} seconds before requesting a new code.`,
        cooldownSeconds: waitSeconds,
      });
    }

    // Determine recipient name
    let recipientName = 'Valued User';
    if (purpose === 'register') {
      recipientName = challenge.pendingUserData?.name || 'Valued User';
    } else {
      const user = await User.findOne({ email: cleanEmail });
      if (user) recipientName = user.name;
    }

    // Invalidate previous OTP and generate a new cryptographically secure 6-digit OTP
    const newOtp = generateSecureOtp();
    const newOtpHash = hashOtp(newOtp);

    // Send email via Gmail SMTP first
    await sendOtpEmail({
      to: cleanEmail,
      otp: newOtp,
      purpose,
      name: recipientName,
    });

    // Update challenge with new hash, reset attempts, 5-min expiry, and fresh 60s cooldown
    challenge.otpHash = newOtpHash;
    challenge.attempts = 0;
    challenge.expiresAt = new Date(now + OTP_EXPIRY_MS);
    challenge.resendAvailableAt = new Date(now + RESEND_COOLDOWN_MS);
    await challenge.save();

    return res.status(200).json({
      success: true,
      message: `A new 6-digit verification code has been sent to ${cleanEmail}.`,
      cooldownSeconds: 60,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
export async function getMe(req, res) {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      preferences: req.user.preferences,
      lastLogin: req.user.lastLogin,
      createdAt: req.user.createdAt,
    },
  });
}

/**
 * Log out user & clear session
 * POST /api/auth/logout
 */
export async function logout(req, res) {
  res.clearCookie('token');
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
}
