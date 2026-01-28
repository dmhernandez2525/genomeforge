// Core encryption
export { WebEncryption } from './web';
export { MobileEncryption } from './mobile';

// Types
export type { EncryptedData, EncryptionConfig, KeyDerivationConfig } from './types';
export { ENCRYPTION_CONSTANTS } from './types';

// Password utilities
export {
  validatePassword,
  generatePassword,
  estimateEntropy,
  DEFAULT_PASSWORD_REQUIREMENTS,
  RELAXED_PASSWORD_REQUIREMENTS
} from './password';
export type {
  PasswordStrength,
  PasswordValidationResult,
  PasswordRequirements
} from './password';

// Encrypted storage
export { EncryptedStorage, ApiKeyStorage, MasterPasswordManager } from './storage';
export type { EncryptedStorageItem, StorageCategory } from './storage';
