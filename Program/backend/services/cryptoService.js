import '../config/loadEnv.js';
import crypto from 'crypto';

/**
 * Key Management & AES-256-GCM Encryption Service
 * 
 * Production Security Considerations:
 * - Master encryption key is stored securely in environment variables (or AWS KMS / Vault in cloud setups).
 * - Never store the encryption key inside the database alongside encrypted records.
 * - HKDF (HMAC-based Extract-and-Expand Key Derivation) is used with the user's unique ID
 *   as salt/context to derive an isolated per-user 256-bit encryption key.
 * - AES-256-GCM provides both confidentiality and authenticated integrity (preventing bit-flipping attacks).
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM by NIST
const AUTH_TAG_LENGTH = 16; // 128 bits authentication tag

// Validate and load master key (must be 32 bytes / 64 hex characters)
function getMasterKey() {
  const hexKey = process.env.ENCRYPTION_KEY;
  if (!hexKey) {
    throw new Error('ENCRYPTION_KEY environment variable is missing.');
  }

  const keyBuffer = Buffer.from(hexKey, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters).');
  }

  return keyBuffer;
}

/**
 * Derive per-user encryption key using HKDF
 * Ensures user credential isolation cryptographically.
 */
function deriveUserKey(userId) {
  const masterKey = getMasterKey();
  const salt = Buffer.from(userId.toString(), 'utf8');
  const info = Buffer.from('SecureVault-User-Credential-Key-v1', 'utf8');

  return crypto.hkdfSync('sha256', masterKey, salt, info, 32);
}

/**
 * Encrypt plaintext password using AES-256-GCM
 * @param {string} plaintext - The website password
 * @param {string} userId - User identifier for isolated key derivation
 * @returns {object} { ciphertext, iv, authTag } in hex strings
 */
export function encryptPassword(plaintext, userId) {
  if (!plaintext || typeof plaintext !== 'string') {
    throw new Error('Plaintext string is required for encryption.');
  }
  if (!userId) {
    throw new Error('User ID is required for key derivation.');
  }

  const userKey = deriveUserKey(userId);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, userKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');

  return {
    encryptedPassword: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag,
  };
}

/**
 * Decrypt ciphertext using AES-256-GCM
 * @param {string} encryptedPassword - Ciphertext in hex
 * @param {string} ivHex - IV in hex
 * @param {string} authTagHex - Auth tag in hex
 * @param {string} userId - User identifier
 * @returns {string} Decrypted plaintext password
 */
export function decryptPassword(encryptedPassword, ivHex, authTagHex, userId) {
  if (!encryptedPassword || !ivHex || !authTagHex || !userId) {
    throw new Error('All encryption parameters (ciphertext, iv, authTag, userId) are required.');
  }

  const userKey = deriveUserKey(userId);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, userKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedPassword, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generates an HMAC-SHA256 fingerprint of the password using the user's isolated key.
 * Allows the Security Center to detect duplicate/reused passwords without storing plaintext.
 */
export function createPasswordFingerprint(plaintext, userId) {
  if (!plaintext || !userId) {
    throw new Error('Plaintext and userId are required to compute fingerprint.');
  }
  const userKey = deriveUserKey(userId);
  return crypto.createHmac('sha256', userKey).update(plaintext, 'utf8').digest('hex');
}

/**
 * Helper to generate a new cryptographically secure 256-bit key for setup/.env
 */
export function generateMasterKeyHex() {
  return crypto.randomBytes(32).toString('hex');
}

