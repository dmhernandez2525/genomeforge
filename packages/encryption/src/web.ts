import type { EncryptedData, EncryptionConfig } from './types';
import { ENCRYPTION_CONSTANTS } from './types';

/**
 * Web-based encryption using the Web Crypto API
 *
 * Implements AES-256-GCM with PBKDF2 key derivation.
 * PBKDF2 iterations set to 600,000 per OWASP 2023 recommendations.
 *
 * Used for:
 * - Encrypting API keys at rest
 * - Encrypting stored genome data (optional)
 * - Secure local storage
 *
 * Security notes:
 * - Keys are derived from user password using PBKDF2
 * - Each encryption operation uses a unique IV
 * - Salt is stored with ciphertext for key re-derivation
 */
export class WebEncryption {
  private iterations: number;

  constructor(config?: EncryptionConfig) {
    this.iterations = config?.iterations ?? ENCRYPTION_CONSTANTS.DEFAULT_ITERATIONS;
  }

  /**
   * Derive an AES-256-GCM key from a password
   *
   * @param password - User-provided password
   * @param salt - Random salt (will be generated if not provided)
   * @returns Derived CryptoKey and salt used
   */
  async deriveKey(
    password: string,
    salt?: Uint8Array
  ): Promise<{ key: CryptoKey; salt: Uint8Array }> {
    // Generate or use provided salt
    const actualSalt = salt ?? crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONSTANTS.SALT_LENGTH));

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Derive AES-GCM key using PBKDF2
    const key = await crypto.subtle.deriveKey(
      {
        name: ENCRYPTION_CONSTANTS.KDF,
        salt: this.toBufferSource(actualSalt),
        iterations: this.iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: ENCRYPTION_CONSTANTS.ALGORITHM,
        length: ENCRYPTION_CONSTANTS.KEY_LENGTH
      },
      false, // not extractable
      ['encrypt', 'decrypt']
    );

    return { key, salt: actualSalt };
  }

  /**
   * Encrypt data using AES-256-GCM
   *
   * @param data - String data to encrypt
   * @param password - Password for key derivation
   * @returns Encrypted data structure
   */
  async encrypt(data: string, password: string): Promise<EncryptedData> {
    // Derive key with new salt
    const { key, salt } = await this.deriveKey(password);

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONSTANTS.IV_LENGTH));

    // Encrypt
    const ciphertext = await crypto.subtle.encrypt(
      { name: ENCRYPTION_CONSTANTS.ALGORITHM, iv: this.toBufferSource(iv) },
      key,
      new TextEncoder().encode(data)
    );

    return {
      iv: this.base64Encode(iv),
      ciphertext: this.base64Encode(new Uint8Array(ciphertext)),
      salt: this.base64Encode(salt),
      algorithm: 'AES-256-GCM',
      kdf: 'PBKDF2',
      iterations: this.iterations
    };
  }

  /**
   * Decrypt data using AES-256-GCM
   *
   * @param encryptedData - Encrypted data structure
   * @param password - Password for key derivation
   * @returns Decrypted string
   */
  async decrypt(encryptedData: EncryptedData, password: string): Promise<string> {
    // Decode components
    const iv = this.base64Decode(encryptedData.iv);
    const ciphertext = this.base64Decode(encryptedData.ciphertext);
    const salt = this.base64Decode(encryptedData.salt);

    // Derive same key using stored salt and iterations
    const iterations = encryptedData.iterations ?? this.iterations;
    const { key } = await this.deriveKey(password, salt);

    // Override iterations if different from default
    if (iterations !== this.iterations) {
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
      );

      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: ENCRYPTION_CONSTANTS.KDF,
          salt: this.toBufferSource(salt),
          iterations,
          hash: 'SHA-256'
        },
        keyMaterial,
        {
          name: ENCRYPTION_CONSTANTS.ALGORITHM,
          length: ENCRYPTION_CONSTANTS.KEY_LENGTH
        },
        false,
        ['encrypt', 'decrypt']
      );

      const plaintext = await crypto.subtle.decrypt(
        { name: ENCRYPTION_CONSTANTS.ALGORITHM, iv: this.toBufferSource(iv) },
        derivedKey,
        this.toBufferSource(ciphertext)
      );

      return new TextDecoder().decode(plaintext);
    }

    // Decrypt
    const plaintext = await crypto.subtle.decrypt(
      { name: ENCRYPTION_CONSTANTS.ALGORITHM, iv: this.toBufferSource(iv) },
      key,
      this.toBufferSource(ciphertext)
    );

    return new TextDecoder().decode(plaintext);
  }

  /**
   * Encrypt an API key for secure storage
   *
   * @param apiKey - The API key to encrypt
   * @param password - User password or device-derived key
   * @returns Encrypted API key data
   */
  async encryptApiKey(apiKey: string, password: string): Promise<EncryptedData> {
    return this.encrypt(apiKey, password);
  }

  /**
   * Decrypt a stored API key
   *
   * @param encryptedKey - Encrypted API key data
   * @param password - User password or device-derived key
   * @returns Decrypted API key
   */
  async decryptApiKey(encryptedKey: EncryptedData, password: string): Promise<string> {
    return this.decrypt(encryptedKey, password);
  }

  /**
   * Generate a random encryption key (for session-based encryption)
   *
   * @returns Random AES-256-GCM key
   */
  async generateRandomKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      { name: ENCRYPTION_CONSTANTS.ALGORITHM, length: ENCRYPTION_CONSTANTS.KEY_LENGTH },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Securely wipe sensitive data from memory
   * Note: This is best-effort in JavaScript due to GC
   *
   * @param data - Uint8Array to wipe
   */
  secureWipe(data: Uint8Array): void {
    crypto.getRandomValues(data);
    data.fill(0);
  }

  // Base64 encoding utilities
  private base64Encode(data: Uint8Array): string {
    return btoa(String.fromCharCode(...data));
  }

  private base64Decode(encoded: string): Uint8Array {
    return Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  }

  /**
   * Convert Uint8Array to BufferSource for Web Crypto API compatibility
   * TypeScript strictness requires explicit typing for ArrayBuffer vs ArrayBufferLike
   */
  private toBufferSource(data: Uint8Array): Uint8Array<ArrayBuffer> {
    return data as Uint8Array<ArrayBuffer>;
  }
}
