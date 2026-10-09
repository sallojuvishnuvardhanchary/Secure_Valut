/**
 * Password Strength Evaluator
 * Assesses complexity and returns score (0 to 4) and recommendations.
 */
export function evaluatePasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    return { score: 0, label: 'Very Weak', color: '#EF4444', suggestions: ['Enter a password'] };
  }

  let score = 0;
  const suggestions = [];

  // Length checks
  if (password.length >= 8) score += 1;
  else suggestions.push('Use at least 8 characters');

  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character variety checks
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const varietyCount = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;
  if (varietyCount >= 3) score += 1;
  if (varietyCount === 4 && password.length >= 12) score += 1;

  if (!hasLower) suggestions.push('Add lowercase letters');
  if (!hasUpper) suggestions.push('Add uppercase letters');
  if (!hasDigit) suggestions.push('Add numbers');
  if (!hasSymbol) suggestions.push('Add special symbols');

  // Penalize sequential repeats, common patterns, or very predictable words
  const commonPatterns = /^(password|123456|admin|welcome|qwerty|letmein|pass|master)/i;
  if (/^[a-zA-Z]+$/.test(password) || /^[0-9]+$/.test(password) || commonPatterns.test(password)) {
    score = Math.min(score, 1);
  }

  // If missing symbols and under 12 characters, cap at 1 (Weak)
  if (!hasSymbol && password.length < 12) {
    score = Math.min(score, 1);
  }

  // Normalize score between 0 and 4
  const finalScore = Math.min(Math.max(score, 0), 4);

  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['#EF4444', '#F97316', '#EAB308', '#3B82F6', '#10B981'];

  return {
    score: finalScore,
    label: labels[finalScore],
    color: colors[finalScore],
    suggestions,
    isWeak: finalScore < 2,
  };
}
