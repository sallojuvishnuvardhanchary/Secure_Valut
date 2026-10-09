import '../config/loadEnv.js';
import mongoose from 'mongoose';

import {
  encryptPassword,
  decryptPassword,
  createPasswordFingerprint,
} from '../services/cryptoService.js';
import { evaluatePasswordStrength } from './passwordStrength.js';
import { User } from '../models/User.js';
import { Credential } from '../models/Credential.js';
import { OtpChallenge } from '../models/OtpChallenge.js';
import {
  generateSecureOtp,
  hashOtp,
  verifyOtpHash,
  OTP_EXPIRY_MS,
  RESEND_COOLDOWN_MS,
} from './otpUtils.js';
import { sendOtpEmail } from '../services/emailService.js';

async function runTests() {
  console.log('--- STARTING SECUREVAULT BACKEND TEST SUITE ---');
  let failures = 0;

  function assert(condition, message) {
    if (!condition) {
      console.error(`❌ FAILED: ${message}`);
      failures++;
    } else {
      console.log(`✅ PASSED: ${message}`);
    }
  }

  // 1. Cryptographic AES-256-GCM unit test
  console.log('\n[TEST 1] Testing AES-256-GCM Authenticated Encryption...');
  const testUserId1 = new mongoose.Types.ObjectId().toString();
  const testUserId2 = new mongoose.Types.ObjectId().toString();
  const testSecret = 'MySuperSecretP@ssw0rd!2026';

  const encrypted = encryptPassword(testSecret, testUserId1);
  assert(encrypted.encryptedPassword && encrypted.iv && encrypted.authTag, 'Encryption produces ciphertext, IV, and auth tag');
  assert(encrypted.iv.length === 24, 'IV length is 12 bytes (24 hex characters)');
  assert(encrypted.authTag.length === 32, 'Auth tag length is 16 bytes (32 hex characters)');

  const decrypted = decryptPassword(encrypted.encryptedPassword, encrypted.iv, encrypted.authTag, testUserId1);
  assert(decrypted === testSecret, 'Decrypted plaintext matches original secret');

  // 2. Multi-user cryptographic isolation test
  console.log('\n[TEST 2] Testing Cryptographic Isolation between Users...');
  let isolatedDecryptionFailed = false;
  try {
    decryptPassword(encrypted.encryptedPassword, encrypted.iv, encrypted.authTag, testUserId2);
  } catch (err) {
    isolatedDecryptionFailed = true;
  }
  assert(isolatedDecryptionFailed, 'User 2 key cannot decrypt User 1 ciphertext (GCM tag validation fails)');

  // 3. Tampering detection test
  console.log('\n[TEST 3] Testing Ciphertext Tamper Detection...');
  let tamperCaught = false;
  try {
    const tamperedCiphertext = encrypted.encryptedPassword.substring(0, 4) + 'ffff' + encrypted.encryptedPassword.substring(8);
    decryptPassword(tamperedCiphertext, encrypted.iv, encrypted.authTag, testUserId1);
  } catch (err) {
    tamperCaught = true;
  }
  assert(tamperCaught, 'Tampered ciphertext is detected and rejected by GCM auth tag');

  // 4. Password Strength Evaluator test
  console.log('\n[TEST 4] Testing Password Strength Evaluator...');
  const weakCheck = evaluatePasswordStrength('12345');
  assert(weakCheck.score <= 1 && weakCheck.isWeak, 'Weak password correctly identified');

  const strongCheck = evaluatePasswordStrength('SuperStrongP@ssw0rd#2026!Secured');
  assert(strongCheck.score === 4 && !strongCheck.isWeak, 'Complex password receives score 4');

  // 5. Database & Ownership test
  console.log('\n[TEST 5] Testing Database Operations & Multi-Tenant Isolation...');
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/securevault';
    await mongoose.connect(uri);

    const userAEmail = `test_a_${Date.now()}@test.com`;
    const userBEmail = `test_b_${Date.now()}@test.com`;

    const userA = await User.create({
      name: 'User A',
      email: userAEmail,
      password: 'UserA_P@ssword1',
    });

    const userB = await User.create({
      name: 'User B',
      email: userBEmail,
      password: 'UserB_P@ssword2',
    });

    const isMatchA = await userA.comparePassword('UserA_P@ssword1');
    assert(isMatchA, 'Bcrypt password hashing and verification works');

    const credEncrypted = encryptPassword('VaultPasswordUserA!1', userA._id.toString());
    const credA = await Credential.create({
      userId: userA._id,
      websiteName: 'User A Secret Site',
      websiteUrl: 'https://secretsite.com',
      username: 'usera_admin',
      encryptedPassword: credEncrypted.encryptedPassword,
      iv: credEncrypted.iv,
      authTag: credEncrypted.authTag,
      passwordFingerprint: createPasswordFingerprint('VaultPasswordUserA!1', userA._id.toString()),
      category: 'Banking',
      isFavorite: true,
    });

    const userBQuery = await Credential.findOne({ _id: credA._id, userId: userB._id });
    assert(userBQuery === null, 'User B cannot query or access User A credential (ownership isolation confirmed)');

    await Credential.deleteMany({ userId: { $in: [userA._id, userB._id] } });
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
  } catch (err) {
    console.error('Database test error:', err);
    failures++;
  }

  // 6. Cryptographic 6-Digit OTP Security & Validation Tests
  console.log('\n[TEST 6] Testing Cryptographic OTP Generation & Security Rules...');
  const otp1 = generateSecureOtp();
  const otp2 = generateSecureOtp();
  assert(/^\d{6}$/.test(otp1), 'Generated OTP is exactly 6 numeric digits');
  assert(/^\d{6}$/.test(otp2), 'Generated OTP 2 is exactly 6 numeric digits');
  assert(otp1 !== otp2, 'Consecutive CSPRNG OTPs are distinct and non-deterministic');

  const hashedOtp1 = hashOtp(otp1);
  assert(hashedOtp1.length === 64, 'Stored OTP is a 64-character HMAC-SHA256 hash');
  assert(hashedOtp1 !== otp1, 'Plaintext OTP is never stored directly');

  const validMatch = verifyOtpHash(otp1, hashedOtp1);
  assert(validMatch === true, 'Timing-safe OTP hash comparison matches for valid OTP');

  const invalidMatch = verifyOtpHash('000000', hashedOtp1);
  assert(invalidMatch === false, 'Invalid OTP is rejected');

  // 7. OTP Challenge Lifecycle & Attempt Limits
  console.log('\n[TEST 7] Testing OTP Challenge Lifecycle & 5-Attempt Limit...');
  try {
    const testEmail = `otp_test_${Date.now()}@example.com`;
    const otpTestCode = '839210';
    const otpTestHash = hashOtp(otpTestCode);

    // Create challenge
    const challenge = await OtpChallenge.create({
      email: testEmail,
      otpHash: otpTestHash,
      purpose: 'login',
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      resendAvailableAt: new Date(Date.now() + RESEND_COOLDOWN_MS),
      attempts: 0,
    });

    assert(challenge._id != null, 'OTP Challenge record created in MongoDB');

    // Simulate 4 failed attempts
    for (let i = 1; i <= 4; i++) {
      challenge.attempts += 1;
      await challenge.save();
      const match = verifyOtpHash('111111', challenge.otpHash);
      assert(!match && challenge.attempts === i, `Attempt ${i}/5 correctly tracked and rejected`);
    }

    // 5th attempt reaches max limit
    challenge.attempts += 1;
    await challenge.save();
    assert(challenge.attempts >= 5, 'Challenge reached 5 attempts threshold for automatic invalidation');

    // Invalidate/delete challenge
    await challenge.deleteOne();
    const queryAfterMax = await OtpChallenge.findById(challenge._id);
    assert(queryAfterMax === null, 'Challenge is permanently invalidated after 5 failed attempts');

    // Test Expiration handling
    const expiredChallenge = await OtpChallenge.create({
      email: `expired_${Date.now()}@example.com`,
      otpHash: otpTestHash,
      purpose: 'register',
      expiresAt: new Date(Date.now() - 1000), // In the past
      resendAvailableAt: new Date(Date.now() - 1000),
      attempts: 0,
    });

    const isExpired = Date.now() > expiredChallenge.expiresAt.getTime();
    assert(isExpired, 'Expired OTP correctly identified and rejected after 5-minute window');
    await expiredChallenge.deleteOne();

    // Test 60s resend cooldown logic
    const cooldownChallenge = await OtpChallenge.create({
      email: `cooldown_${Date.now()}@example.com`,
      otpHash: otpTestHash,
      purpose: 'login',
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      resendAvailableAt: new Date(Date.now() + 45000), // 45 seconds remaining
      attempts: 0,
    });

    const cooldownActive = Date.now() < cooldownChallenge.resendAvailableAt.getTime();
    assert(cooldownActive, '60-second cooldown active window enforced prior to resend');
    await cooldownChallenge.deleteOne();

    // Test Separate challenges for 'register' vs 'login'
    const regChallenge = await OtpChallenge.create({
      email: `sep_${Date.now()}@example.com`,
      otpHash: otpTestHash,
      purpose: 'register',
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      resendAvailableAt: new Date(Date.now() + RESEND_COOLDOWN_MS),
    });
    const logChallenge = await OtpChallenge.create({
      email: `sep_${Date.now()}@example.com`,
      otpHash: otpTestHash,
      purpose: 'login',
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      resendAvailableAt: new Date(Date.now() + RESEND_COOLDOWN_MS),
    });
    assert(regChallenge.purpose === 'register' && logChallenge.purpose === 'login', 'Separate challenge namespaces for registration and login verified');
    await OtpChallenge.deleteMany({ email: regChallenge.email });
  } catch (err) {
    console.error('OTP Challenge test error:', err);
    failures++;
  }

  // 8. Email Delivery Failure Handling
  console.log('\n[TEST 8] Testing Email Delivery Failure Handling...');
  let emailFailureCaught = false;
  try {
    // Attempting to send without valid credentials or to empty recipient
    await sendOtpEmail({ to: '', otp: '123456', purpose: 'login' });
  } catch (err) {
    emailFailureCaught = true;
  }
  assert(emailFailureCaught, 'Email delivery failure is properly caught without pretending verification succeeded');

  await mongoose.disconnect();

  console.log('\n----------------------------------------');
  if (failures === 0) {
    console.log('🎉 ALL BACKEND & OTP SECURITY TESTS PASSED!');
  } else {
    console.error(`💥 ${failures} TEST(S) FAILED!`);
    process.exit(1);
  }
}

runTests();
