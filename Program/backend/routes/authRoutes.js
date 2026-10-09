import express from 'express';
import {
  register,
  verifyRegisterOtp,
  login,
  verifyLoginOtp,
  resendOtp,
  getMe,
  logout,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public OTP & Authentication routes with rate limiting
router.post('/register', authLimiter, register);
router.post('/verify-register-otp', authLimiter, verifyRegisterOtp);
router.post('/login', authLimiter, login);
router.post('/verify-login-otp', authLimiter, verifyLoginOtp);
router.post('/resend-otp', authLimiter, resendOtp);

// Authenticated session routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

export default router;
