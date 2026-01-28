/**
 * Encrypted data structure
 */
export interface EncryptedData {
  /** Base64-encoded initialization vector (12 bytes for AES-GCM) */
  iv: string;
  /** Base64-encoded ciphertext */
  ciphertext: string;
  /** Base64-encoded salt (32 bytes) - used for key derivation */
  salt: string;
  /** Algorithm identifier */
  algorithm: 'AES-256-GCM';
  /** Key derivation function */
  kdf: 'PBKDF2';
  /** Number of PBKDF2 iterations (OWASP 2023 recommends 600,000) */
  iterations: number;
}

/**
 * Configuration for encryption operations
 */
export interface EncryptionConfig {
  /** Optional custom iteration count (default: 600,000 per OWASP 2023) */
  iterations?: number;
}

/**
 * Configuration for key derivation
 */
export interface KeyDerivationConfig {
  /** Number of PBKDF2 iterations */
  iterations: number;
  /** Salt for key derivation */
  salt: Uint8Array;
}

/**
 * Constants for encryption
 */
export const ENCRYPTION_CONSTANTS = {
  /** AES-256-GCM key length in bits */
  KEY_LENGTH: 256,
  /** Initialization vector length in bytes (96 bits for AES-GCM) */
  IV_LENGTH: 12,
  /** Salt length in bytes */
  SALT_LENGTH: 32,
  /** OWASP 2023 recommended PBKDF2 iterations for password hashing */
  DEFAULT_ITERATIONS: 600000,
  /** Algorithm name */
  ALGORITHM: 'AES-GCM' as const,
  /** Key derivation function */
  KDF: 'PBKDF2' as const
} as const;
