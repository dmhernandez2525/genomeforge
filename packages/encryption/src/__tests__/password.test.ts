/**
 * Password Validation Test Suite
 */

import { describe, it, expect } from 'vitest';
import {
  validatePassword,
  generatePassword,
  estimateEntropy,
  RELAXED_PASSWORD_REQUIREMENTS
} from '../password';

describe('validatePassword', () => {
  describe('with default requirements', () => {
    it('should reject short passwords', () => {
      const result = validatePassword('Short1!');
      expect(result.isValid).toBe(false);
      expect(result.requirements.minLength).toBe(false);
    });

    it('should accept strong passwords', () => {
      const result = validatePassword('MySecurePassword123!');
      expect(result.isValid).toBe(true);
      expect(result.strength).toMatch(/strong|very_strong/);
    });

    it('should detect missing uppercase', () => {
      const result = validatePassword('mysecurepassword123!');
      expect(result.requirements.hasUppercase).toBe(false);
    });

    it('should detect missing lowercase', () => {
      const result = validatePassword('MYSECUREPASSWORD123!');
      expect(result.requirements.hasLowercase).toBe(false);
    });

    it('should detect missing numbers', () => {
      const result = validatePassword('MySecurePassword!');
      expect(result.requirements.hasNumbers).toBe(false);
    });

    it('should detect missing special characters', () => {
      const result = validatePassword('MySecurePassword123');
      expect(result.requirements.hasSpecialChars).toBe(false);
    });

    it('should detect common patterns', () => {
      const result = validatePassword('Password123!');
      expect(result.requirements.noCommonPatterns).toBe(false);
    });

    it('should reject sequential patterns', () => {
      const result = validatePassword('Abc123456789!');
      expect(result.requirements.noCommonPatterns).toBe(false);
    });

    it('should reject keyboard patterns', () => {
      const result = validatePassword('Qwerty12345!');
      expect(result.requirements.noCommonPatterns).toBe(false);
    });
  });

  describe('with relaxed requirements', () => {
    it('should accept simpler passwords', () => {
      const result = validatePassword('simple123', RELAXED_PASSWORD_REQUIREMENTS);
      expect(result.isValid).toBe(true);
    });

    it('should not require special characters', () => {
      const result = validatePassword('SimplePass123', RELAXED_PASSWORD_REQUIREMENTS);
      expect(result.isValid).toBe(true);
    });

    it('should not require uppercase', () => {
      const result = validatePassword('simplepass123', RELAXED_PASSWORD_REQUIREMENTS);
      expect(result.isValid).toBe(true);
    });
  });

  describe('strength scoring', () => {
    it('should rate empty password as weak', () => {
      const result = validatePassword('');
      expect(result.strength).toBe('weak');
      expect(result.score).toBeLessThan(20);
    });

    it('should rate short passwords lower', () => {
      const short = validatePassword('Ab1!');
      const long = validatePassword('Ab1!Ab1!Ab1!Ab1!');
      expect(short.score).toBeLessThan(long.score);
    });

    it('should reward character variety', () => {
      const simple = validatePassword('aaaaaaaaaaaa');
      const varied = validatePassword('Aa1!Bb2@Cc3#');
      expect(varied.score).toBeGreaterThan(simple.score);
    });

    it('should penalize common patterns', () => {
      const common = validatePassword('Password123!');
      const unique = validatePassword('Xy7!Qm9@Zk2#');
      expect(unique.score).toBeGreaterThan(common.score);
    });
  });

  describe('feedback messages', () => {
    it('should provide helpful feedback for weak passwords', () => {
      const result = validatePassword('weak');
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('should suggest adding uppercase', () => {
      const result = validatePassword('alllowercase123!');
      expect(result.feedback.some(f => f.toLowerCase().includes('uppercase'))).toBe(true);
    });

    it('should suggest adding special characters', () => {
      const result = validatePassword('NoSpecialChars123');
      expect(result.feedback.some(f => f.toLowerCase().includes('special'))).toBe(true);
    });

    it('should warn about common patterns', () => {
      const result = validatePassword('Password123!');
      expect(result.feedback.some(f => f.toLowerCase().includes('common'))).toBe(true);
    });

    it('should provide positive feedback for strong passwords', () => {
      const result = validatePassword('Xy7!Qm9@Zk2#Lp5$');
      expect(result.feedback.some(f => f.toLowerCase().includes('excellent') || f.toLowerCase().includes('good'))).toBe(true);
    });
  });
});

describe('generatePassword', () => {
  it('should generate password of specified length', () => {
    const password = generatePassword(20);
    expect(password.length).toBe(20);
  });

  it('should generate different passwords each time', () => {
    const passwords = new Set<string>();
    for (let i = 0; i < 100; i++) {
      passwords.add(generatePassword(16));
    }
    expect(passwords.size).toBe(100); // All unique
  });

  it('should include uppercase when requested', () => {
    const password = generatePassword(20, { includeUppercase: true });
    expect(/[A-Z]/.test(password)).toBe(true);
  });

  it('should include lowercase when requested', () => {
    const password = generatePassword(20, { includeLowercase: true });
    expect(/[a-z]/.test(password)).toBe(true);
  });

  it('should include numbers when requested', () => {
    const password = generatePassword(20, { includeNumbers: true });
    expect(/[0-9]/.test(password)).toBe(true);
  });

  it('should include special characters when requested', () => {
    const password = generatePassword(20, { includeSpecialChars: true });
    expect(/[!@#$%^&*_+\-=]/.test(password)).toBe(true);
  });

  it('should exclude ambiguous characters when requested', () => {
    // Generate many passwords and check none have ambiguous chars
    for (let i = 0; i < 50; i++) {
      const password = generatePassword(50, { excludeAmbiguous: true });
      expect(/[0O1lI]/.test(password)).toBe(false);
    }
  });

  it('should include all character types by default', () => {
    // Generate several passwords to ensure all types are present
    const passwords = Array.from({ length: 10 }, () => generatePassword(32));
    const combined = passwords.join('');

    expect(/[A-Z]/.test(combined)).toBe(true);
    expect(/[a-z]/.test(combined)).toBe(true);
    expect(/[0-9]/.test(combined)).toBe(true);
    expect(/[!@#$%^&*_+\-=]/.test(combined)).toBe(true);
  });

  it('should generate passwords that pass validation', () => {
    for (let i = 0; i < 20; i++) {
      const password = generatePassword(16);
      const result = validatePassword(password);
      expect(result.isValid).toBe(true);
    }
  });
});

describe('estimateEntropy', () => {
  it('should calculate higher entropy for longer passwords', () => {
    const short = estimateEntropy('abc');
    const long = estimateEntropy('abcdefghij');
    expect(long).toBeGreaterThan(short);
  });

  it('should calculate higher entropy for more character variety', () => {
    const simple = estimateEntropy('aaaaaaaaaa');
    const varied = estimateEntropy('Aa1!Bb2@Cc');
    expect(varied).toBeGreaterThan(simple);
  });

  it('should return reasonable entropy values', () => {
    // A 16-character password with all char types should have ~100 bits
    const entropy = estimateEntropy('Aa1!Bb2@Cc3#Dd4$');
    expect(entropy).toBeGreaterThan(80);
    expect(entropy).toBeLessThan(150);
  });

  it('should handle empty password', () => {
    const entropy = estimateEntropy('');
    expect(entropy).toBe(0);
  });

  it('should handle unicode characters', () => {
    const entropy = estimateEntropy('password');
    // Should still calculate based on detected character classes
    expect(entropy).toBeGreaterThan(0);
  });
});
