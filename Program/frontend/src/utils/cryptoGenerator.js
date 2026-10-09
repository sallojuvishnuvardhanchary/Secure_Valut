/**
 * Cryptographically Secure Password Generator using Web Crypto API
 * Compliant with NIST SP 800-63B guidelines.
 */

const CHARSETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

/**
 * Returns a cryptographically secure random index within [0, max)
 */
function getSecureRandomInt(max) {
  if (max <= 0) return 0;
  const array = new Uint32Array(1);
  const maxUint32 = 0xffffffff;
  const limit = maxUint32 - (maxUint32 % max);

  let randomVal;
  do {
    window.crypto.getRandomValues(array);
    randomVal = array[0];
  } while (randomVal >= limit);

  return randomVal % max;
}

/**
 * Generates a cryptographically strong password
 */
export function generateSecurePassword({
  length = 16,
  uppercase = true,
  lowercase = true,
  numbers = true,
  symbols = true,
}) {
  let pool = '';
  const guaranteedChars = [];

  if (uppercase) {
    pool += CHARSETS.uppercase;
    guaranteedChars.push(CHARSETS.uppercase[getSecureRandomInt(CHARSETS.uppercase.length)]);
  }
  if (lowercase) {
    pool += CHARSETS.lowercase;
    guaranteedChars.push(CHARSETS.lowercase[getSecureRandomInt(CHARSETS.lowercase.length)]);
  }
  if (numbers) {
    pool += CHARSETS.numbers;
    guaranteedChars.push(CHARSETS.numbers[getSecureRandomInt(CHARSETS.numbers.length)]);
  }
  if (symbols) {
    pool += CHARSETS.symbols;
    guaranteedChars.push(CHARSETS.symbols[getSecureRandomInt(CHARSETS.symbols.length)]);
  }

  // Fallback to lowercase if nothing selected
  if (!pool) {
    pool = CHARSETS.lowercase;
    guaranteedChars.push(CHARSETS.lowercase[getSecureRandomInt(CHARSETS.lowercase.length)]);
  }

  const remainingLength = Math.max(0, length - guaranteedChars.length);
  const passwordChars = [...guaranteedChars];

  for (let i = 0; i < remainingLength; i++) {
    const randomIndex = getSecureRandomInt(pool.length);
    passwordChars.push(pool[randomIndex]);
  }

  // Fisher-Yates cryptographically secure shuffle
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.join('');
}

/**
 * Password strength checker in frontend for real-time visual feedback
 */
export function calculatePasswordStrength(password) {
  if (!password) {
    return { score: 0, label: 'None', color: '#9CA3AF', width: '0%' };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const variety = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;
  if (variety >= 3) score += 1;
  if (variety === 4 && password.length >= 12) score += 1;

  const normalized = Math.min(Math.max(score, 1), 5);

  const configs = [
    { score: 1, label: 'Very Weak', color: '#EF4444', width: '20%' },
    { score: 2, label: 'Weak', color: '#F97316', width: '40%' },
    { score: 3, label: 'Fair', color: '#EAB308', width: '60%' },
    { score: 4, label: 'Good', color: '#3B82F6', width: '80%' },
    { score: 5, label: 'Strong', color: '#10B981', width: '100%' },
  ];

  return configs[normalized - 1];
}
