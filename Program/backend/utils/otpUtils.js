import crypto from 'crypto';

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

/**
 * Generate a cryptographically secure 6-digit OTP using OS CSPRNG
 * @returns {string} 6-digit numeric string
 */
export function generateSecureOtp() {
  // randomInt in [100000, 1000000) generates uniform secure 6-digit integers
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Hash an OTP using HMAC-SHA256
 * @param {string} otp 
 * @returns {string} 64-char hex hash
 */
export function hashOtp(otp) {
  const secret = process.env.JWT_SECRET || 'securevault_otp_secret_key_salt';
  return crypto.createHmac('sha256', secret).update(otp.trim()).digest('hex');
}

/**
 * Verify submitted OTP against stored hash using timing-safe comparison
 * @param {string} submittedOtp 
 * @param {string} storedHash 
 * @returns {boolean}
 */
export function verifyOtpHash(submittedOtp, storedHash) {
  if (!submittedOtp || !storedHash) return false;
  if (typeof submittedOtp !== 'string' || submittedOtp.trim().length !== 6) return false;

  const submittedHash = hashOtp(submittedOtp);
  const bufA = Buffer.from(submittedHash, 'hex');
  const bufB = Buffer.from(storedHash, 'hex');

  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export { OTP_EXPIRY_MS, RESEND_COOLDOWN_MS };
