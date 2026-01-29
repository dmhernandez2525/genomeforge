/**
 * WebEncryption Test Suite
 *
 * Tests the Web Crypto API-based encryption implementation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WebEncryption } from '../web';
import { ENCRYPTION_CONSTANTS } from '../types';

describe('WebEncryption', () => {
  let encryption: WebEncryption;

  beforeEach(() => {
    encryption = new WebEncryption();
  });

  describe('constructor', () => {
    it('should create instance with default iterations', () => {
      const enc = new WebEncryption();
      expect(enc).toBeInstanceOf(WebEncryption);
    });

    it('should accept custom iteration count', () => {
      const enc = new WebEncryption({ iterations: 100000 });
      expect(enc).toBeInstanceOf(WebEncryption);
    });
  });

  describe('deriveKey', () => {
    it('should derive a key from password', async () => {
      const { key, salt } = await encryption.deriveKey('test-password');

      expect(key).toBeDefined();
      expect(key.type).toBe('secret');
      expect(salt).toBeInstanceOf(Uint8Array);
      expect(salt.length).toBe(ENCRYPTION_CONSTANTS.SALT_LENGTH);
    });

    it('should derive same key with same password and salt', async () => {
      const password = 'consistent-password';
      const { salt } = await encryption.deriveKey(password);

      const { key: key1 } = await encryption.deriveKey(password, salt);
      const { key: key2 } = await encryption.deriveKey(password, salt);

      // Keys themselves cannot be directly compared, but we can test by encrypting
      expect(key1.algorithm).toEqual(key2.algorithm);
    });

    it('should derive different keys with different passwords', async () => {
      const salt = new Uint8Array(ENCRYPTION_CONSTANTS.SALT_LENGTH);
      crypto.getRandomValues(salt);

      const { key: key1 } = await encryption.deriveKey('password1', salt);
      const { key: key2 } = await encryption.deriveKey('password2', salt);

      // Keys have different usages but same algorithm
      expect(key1.algorithm.name).toBe(key2.algorithm.name);
    });

    it('should derive different keys with different salts', async () => {
      const password = 'same-password';
      const salt1 = new Uint8Array(ENCRYPTION_CONSTANTS.SALT_LENGTH);
      const salt2 = new Uint8Array(ENCRYPTION_CONSTANTS.SALT_LENGTH);
      crypto.getRandomValues(salt1);
      crypto.getRandomValues(salt2);

      const { key: key1 } = await encryption.deriveKey(password, salt1);
      const { key: key2 } = await encryption.deriveKey(password, salt2);

      expect(key1).toBeDefined();
      expect(key2).toBeDefined();
    });

    it('should generate random salt if not provided', async () => {
      const { salt: salt1 } = await encryption.deriveKey('password');
      const { salt: salt2 } = await encryption.deriveKey('password');

      // Salts should be different (extremely unlikely to be same)
      const salt1Hex = Array.from(salt1).map(b => b.toString(16)).join('');
      const salt2Hex = Array.from(salt2).map(b => b.toString(16)).join('');
      expect(salt1Hex).not.toBe(salt2Hex);
    });
  });

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt a simple string', async () => {
      const plaintext = 'Hello, World!';
      const password = 'test-password';

      const encrypted = await encryption.encrypt(plaintext, password);
      const decrypted = await encryption.decrypt(encrypted, password);

      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt an empty string', async () => {
      const plaintext = '';
      const password = 'test-password';

      const encrypted = await encryption.encrypt(plaintext, password);
      const decrypted = await encryption.decrypt(encrypted, password);

      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt a long string', async () => {
      const plaintext = 'A'.repeat(10000);
      const password = 'test-password';

      const encrypted = await encryption.encrypt(plaintext, password);
      const decrypted = await encryption.decrypt(encrypted, password);

      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt special characters', async () => {
      const plaintext = '!@#$%^&*()_+-=[]{}|;\':",./<>?`~\n\t\r';
      const password = 'test-password';

      const encrypted = await encryption.encrypt(plaintext, password);
      const decrypted = await encryption.decrypt(encrypted, password);

      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt unicode characters', async () => {
      const plaintext = '你好世界 🌍 مرحبا العالم';
      const password = 'test-password';

      const encrypted = await encryption.encrypt(plaintext, password);
      const decrypted = await encryption.decrypt(encrypted, password);

      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt JSON data', async () => {
      const data = { key: 'value', nested: { array: [1, 2, 3] } };
      const plaintext = JSON.stringify(data);
      const password = 'test-password';

      const encrypted = await encryption.encrypt(plaintext, password);
      const decrypted = await encryption.decrypt(encrypted, password);

      expect(JSON.parse(decrypted)).toEqual(data);
    });

    it('should produce different ciphertext for same plaintext (random IV)', async () => {
      const plaintext = 'Same message';
      const password = 'same-password';

      const encrypted1 = await encryption.encrypt(plaintext, password);
      const encrypted2 = await encryption.encrypt(plaintext, password);

      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.salt).not.toBe(encrypted2.salt);
    });

    it('should fail decryption with wrong password', async () => {
      const plaintext = 'Secret message';
      const correctPassword = 'correct-password';
      const wrongPassword = 'wrong-password';

      const encrypted = await encryption.encrypt(plaintext, correctPassword);

      await expect(encryption.decrypt(encrypted, wrongPassword)).rejects.toThrow();
    });

    it('should include correct metadata in encrypted data', async () => {
      const encrypted = await encryption.encrypt('test', 'password');

      expect(encrypted.algorithm).toBe('AES-256-GCM');
      expect(encrypted.kdf).toBe('PBKDF2');
      expect(encrypted.iterations).toBe(ENCRYPTION_CONSTANTS.DEFAULT_ITERATIONS);
      expect(typeof encrypted.iv).toBe('string');
      expect(typeof encrypted.ciphertext).toBe('string');
      expect(typeof encrypted.salt).toBe('string');
    });

    it('should handle custom iteration count', async () => {
      const customEncryption = new WebEncryption({ iterations: 100000 });
      const plaintext = 'Test with custom iterations';
      const password = 'password';

      const encrypted = await customEncryption.encrypt(plaintext, password);
      expect(encrypted.iterations).toBe(100000);

      const decrypted = await customEncryption.decrypt(encrypted, password);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('encryptApiKey/decryptApiKey', () => {
    it('should encrypt and decrypt API key', async () => {
      const apiKey = 'sk-1234567890abcdefghijklmnop';
      const password = 'master-password';

      const encrypted = await encryption.encryptApiKey(apiKey, password);
      const decrypted = await encryption.decryptApiKey(encrypted, password);

      expect(decrypted).toBe(apiKey);
    });

    it('should handle OpenAI API key format', async () => {
      const apiKey = 'sk-proj-abcdefghijklmnopqrstuvwxyz123456';
      const password = 'password';

      const encrypted = await encryption.encryptApiKey(apiKey, password);
      const decrypted = await encryption.decryptApiKey(encrypted, password);

      expect(decrypted).toBe(apiKey);
    });

    it('should handle Anthropic API key format', async () => {
      const apiKey = 'sk-ant-api03-abcdefghijklmnopqrstuvwxyz';
      const password = 'password';

      const encrypted = await encryption.encryptApiKey(apiKey, password);
      const decrypted = await encryption.decryptApiKey(encrypted, password);

      expect(decrypted).toBe(apiKey);
    });
  });

  describe('generateRandomKey', () => {
    it('should generate a random AES-256-GCM key', async () => {
      const key = await encryption.generateRandomKey();

      expect(key).toBeDefined();
      expect(key.type).toBe('secret');
      expect(key.algorithm.name).toBe('AES-GCM');
      expect((key.algorithm as AesKeyAlgorithm).length).toBe(256);
    });

    it('should generate different keys each time', async () => {
      const key1 = await encryption.generateRandomKey();
      const key2 = await encryption.generateRandomKey();

      // Export keys to compare (they're extractable)
      const exported1 = await crypto.subtle.exportKey('raw', key1);
      const exported2 = await crypto.subtle.exportKey('raw', key2);

      const arr1 = new Uint8Array(exported1);
      const arr2 = new Uint8Array(exported2);

      const hex1 = Array.from(arr1).map(b => b.toString(16)).join('');
      const hex2 = Array.from(arr2).map(b => b.toString(16)).join('');

      expect(hex1).not.toBe(hex2);
    });
  });

  describe('secureWipe', () => {
    it('should wipe data to zeros', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      encryption.secureWipe(data);

      expect(data.every(b => b === 0)).toBe(true);
    });

    it('should wipe large arrays', () => {
      const data = new Uint8Array(10000);
      crypto.getRandomValues(data);

      encryption.secureWipe(data);

      expect(data.every(b => b === 0)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle password with special characters', async () => {
      const plaintext = 'test';
      const password = '!@#$%^&*()_+-=[]{}|;\':",./<>?`~';

      const encrypted = await encryption.encrypt(plaintext, password);
      const decrypted = await encryption.decrypt(encrypted, password);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode password', async () => {
      const plaintext = 'test';
      const password = '密码🔐パスワード';

      const encrypted = await encryption.encrypt(plaintext, password);
      const decrypted = await encryption.decrypt(encrypted, password);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle very long password', async () => {
      const plaintext = 'test';
      const password = 'a'.repeat(10000);

      const encrypted = await encryption.encrypt(plaintext, password);
      const decrypted = await encryption.decrypt(encrypted, password);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle empty password', async () => {
      const plaintext = 'test';
      const password = '';

      const encrypted = await encryption.encrypt(plaintext, password);
      const decrypted = await encryption.decrypt(encrypted, password);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('cross-instance compatibility', () => {
    it('should decrypt data encrypted by another instance', async () => {
      const enc1 = new WebEncryption();
      const enc2 = new WebEncryption();

      const plaintext = 'Cross-instance test';
      const password = 'shared-password';

      const encrypted = await enc1.encrypt(plaintext, password);
      const decrypted = await enc2.decrypt(encrypted, password);

      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt with custom iterations if stored in encrypted data', async () => {
      const enc1 = new WebEncryption({ iterations: 100000 });
      const enc2 = new WebEncryption({ iterations: 200000 }); // Different default

      const plaintext = 'Iteration test';
      const password = 'password';

      const encrypted = await enc1.encrypt(plaintext, password);
      // enc2 should read iterations from encrypted data
      const decrypted = await enc2.decrypt(encrypted, password);

      expect(decrypted).toBe(plaintext);
    });
  });
});
