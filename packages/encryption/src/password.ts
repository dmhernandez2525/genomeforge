/**
 * Password Strength Validation Module
 *
 * Provides password strength assessment and requirements validation
 * for GenomeForge's encryption features.
 *
 * @packageDocumentation
 */

/**
 * Password strength levels
 */
export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong' | 'very_strong';

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  /** Is the password valid (meets minimum requirements) */
  isValid: boolean;
  /** Strength assessment */
  strength: PasswordStrength;
  /** Numeric score (0-100) */
  score: number;
  /** Human-readable feedback messages */
  feedback: string[];
  /** Detailed requirement checks */
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
    noCommonPatterns: boolean;
  };
}

/**
 * Password requirements configuration
 */
export interface PasswordRequirements {
  /** Minimum password length */
  minLength: number;
  /** Require uppercase letters */
  requireUppercase: boolean;
  /** Require lowercase letters */
  requireLowercase: boolean;
  /** Require numbers */
  requireNumbers: boolean;
  /** Require special characters */
  requireSpecialChars: boolean;
  /** Check for common patterns */
  checkCommonPatterns: boolean;
}

/**
 * Default password requirements (strong security)
 */
export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  checkCommonPatterns: true
};

/**
 * Relaxed password requirements (minimum acceptable)
 */
export const RELAXED_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: false,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
  checkCommonPatterns: true
};

/**
 * Common password patterns to check against
 */
const COMMON_PATTERNS = [
  /^password/i,
  /^123456/,
  /^qwerty/i,
  /^letmein/i,
  /^welcome/i,
  /^admin/i,
  /^login/i,
  /^abc123/i,
  /^iloveyou/i,
  /^master/i,
  /^monkey/i,
  /^dragon/i,
  /^111111/,
  /^000000/,
  /^sunshine/i,
  /^princess/i,
  /^football/i,
  /^baseball/i,
  /^soccer/i,
  /^hockey/i,
  /(.)\1{3,}/, // Repeated characters (4+ times)
  /^[a-z]+$/i, // Only letters
  /^[0-9]+$/, // Only numbers
  /^(012|123|234|345|456|567|678|789|890)+$/, // Sequential numbers
  /^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)+$/i // Sequential letters
];

/**
 * Common keyboard patterns
 */
const KEYBOARD_PATTERNS = [
  'qwertyuiop',
  'asdfghjkl',
  'zxcvbnm',
  'qazwsx',
  'qweasdzxc',
  '1qaz2wsx',
  '!qaz@wsx'
];

/**
 * Validate password strength
 *
 * @param password - The password to validate
 * @param requirements - Optional custom requirements (defaults to DEFAULT_PASSWORD_REQUIREMENTS)
 * @returns Validation result with strength assessment
 */
export function validatePassword(
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): PasswordValidationResult {
  const feedback: string[] = [];
  let score = 0;

  // Check requirements
  const hasMinLength = password.length >= requirements.minLength;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password);
  const noCommonPatterns = !checkCommonPatterns(password);

  // Calculate base score from length
  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  if (password.length >= 20) score += 10;

  // Add points for character variety
  if (hasUppercase) score += 15;
  if (hasLowercase) score += 15;
  if (hasNumbers) score += 15;
  if (hasSpecialChars) score += 15;

  // Bonus for length with variety
  if (password.length >= 12 && hasUppercase && hasLowercase && hasNumbers) {
    score += 10;
  }

  // Penalty for common patterns
  if (!noCommonPatterns) {
    score = Math.max(0, score - 30);
  }

  // Penalty for no variety
  const uniqueChars = new Set(password).size;
  if (uniqueChars < password.length * 0.5) {
    score = Math.max(0, score - 10);
  }

  // Generate feedback
  if (!hasMinLength) {
    feedback.push(`Password must be at least ${requirements.minLength} characters`);
  }
  if (requirements.requireUppercase && !hasUppercase) {
    feedback.push('Add uppercase letters (A-Z)');
  }
  if (requirements.requireLowercase && !hasLowercase) {
    feedback.push('Add lowercase letters (a-z)');
  }
  if (requirements.requireNumbers && !hasNumbers) {
    feedback.push('Add numbers (0-9)');
  }
  if (requirements.requireSpecialChars && !hasSpecialChars) {
    feedback.push('Add special characters (!@#$%^&*)');
  }
  if (!noCommonPatterns) {
    feedback.push('Avoid common words and patterns');
  }

  // Positive feedback
  if (score >= 80 && feedback.length === 0) {
    feedback.push('Excellent password!');
  } else if (score >= 60 && feedback.length === 0) {
    feedback.push('Good password');
  }

  // Determine strength
  let strength: PasswordStrength;
  if (score >= 80) strength = 'very_strong';
  else if (score >= 60) strength = 'strong';
  else if (score >= 40) strength = 'good';
  else if (score >= 20) strength = 'fair';
  else strength = 'weak';

  // Check if valid (meets all required requirements)
  const isValid =
    hasMinLength &&
    (!requirements.requireUppercase || hasUppercase) &&
    (!requirements.requireLowercase || hasLowercase) &&
    (!requirements.requireNumbers || hasNumbers) &&
    (!requirements.requireSpecialChars || hasSpecialChars) &&
    (!requirements.checkCommonPatterns || noCommonPatterns);

  return {
    isValid,
    strength,
    score: Math.min(100, score),
    feedback,
    requirements: {
      minLength: hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumbers,
      hasSpecialChars,
      noCommonPatterns
    }
  };
}

/**
 * Check if password contains common patterns
 *
 * @param password - Password to check
 * @returns true if common pattern found
 */
function checkCommonPatterns(password: string): boolean {
  const lowerPassword = password.toLowerCase();

  // Check against common patterns
  for (const pattern of COMMON_PATTERNS) {
    if (pattern.test(password)) {
      return true;
    }
  }

  // Check for keyboard patterns
  for (const pattern of KEYBOARD_PATTERNS) {
    if (lowerPassword.includes(pattern) || lowerPassword.includes(pattern.split('').reverse().join(''))) {
      return true;
    }
  }

  return false;
}

/**
 * Generate a cryptographically secure random password
 *
 * @param length - Password length (default 16)
 * @param options - Character set options
 * @returns Random password
 */
export function generatePassword(
  length: number = 16,
  options: {
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSpecialChars?: boolean;
    excludeAmbiguous?: boolean;
  } = {}
): string {
  const {
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSpecialChars = true,
    excludeAmbiguous = true
  } = options;

  let charset = '';

  if (includeLowercase) {
    charset += excludeAmbiguous ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
  }
  if (includeUppercase) {
    charset += excludeAmbiguous ? 'ABCDEFGHJKMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  }
  if (includeNumbers) {
    charset += excludeAmbiguous ? '23456789' : '0123456789';
  }
  if (includeSpecialChars) {
    charset += '!@#$%^&*_+-=';
  }

  if (charset.length === 0) {
    charset = 'abcdefghijklmnopqrstuvwxyz';
  }

  const randomBytes = new Uint8Array(length);
  crypto.getRandomValues(randomBytes);

  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }

  // Ensure at least one character from each required set
  const ensureChars: string[] = [];
  if (includeUppercase) ensureChars.push(getRandomChar(excludeAmbiguous ? 'ABCDEFGHJKMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'));
  if (includeLowercase) ensureChars.push(getRandomChar(excludeAmbiguous ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz'));
  if (includeNumbers) ensureChars.push(getRandomChar(excludeAmbiguous ? '23456789' : '0123456789'));
  if (includeSpecialChars) ensureChars.push(getRandomChar('!@#$%^&*_+-='));

  // Replace random positions with required characters
  const positions = new Set<number>();
  const posBytes = new Uint8Array(ensureChars.length);
  crypto.getRandomValues(posBytes);

  for (let i = 0; i < ensureChars.length; i++) {
    let pos = posBytes[i] % length;
    while (positions.has(pos)) {
      pos = (pos + 1) % length;
    }
    positions.add(pos);
    password = password.substring(0, pos) + ensureChars[i] + password.substring(pos + 1);
  }

  return password;
}

/**
 * Get a random character from a charset
 */
function getRandomChar(charset: string): string {
  const randomByte = new Uint8Array(1);
  crypto.getRandomValues(randomByte);
  return charset[randomByte[0] % charset.length];
}

/**
 * Estimate password entropy in bits
 *
 * @param password - Password to analyze
 * @returns Estimated entropy in bits
 */
export function estimateEntropy(password: string): number {
  let charsetSize = 0;

  if (/[a-z]/.test(password)) charsetSize += 26;
  if (/[A-Z]/.test(password)) charsetSize += 26;
  if (/[0-9]/.test(password)) charsetSize += 10;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) charsetSize += 32;

  if (charsetSize === 0) charsetSize = 26; // Assume lowercase if nothing detected

  return Math.log2(Math.pow(charsetSize, password.length));
}
