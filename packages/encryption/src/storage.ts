/**
 * Encrypted Storage Module
 *
 * Provides encrypted IndexedDB storage for sensitive data.
 * All data is encrypted client-side before storage.
 *
 * @packageDocumentation
 */

import { WebEncryption } from './web';
import type { EncryptedData, EncryptionConfig } from './types';

/**
 * Encrypted storage item
 */
export interface EncryptedStorageItem {
  /** Unique key for the item */
  key: string;
  /** Encrypted data */
  data: EncryptedData;
  /** Metadata (not encrypted) */
  metadata: {
    createdAt: string;
    updatedAt: string;
    category: string;
  };
}

/**
 * Storage categories for organization
 */
export type StorageCategory = 'api_keys' | 'genome_data' | 'settings' | 'cache' | 'other';

/**
 * Encrypted IndexedDB Storage
 *
 * Provides a secure storage layer using IndexedDB with AES-256-GCM encryption.
 * All data is encrypted before storage and decrypted after retrieval.
 */
export class EncryptedStorage {
  private dbName: string;
  private storeName: string;
  private encryption: WebEncryption;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Create a new EncryptedStorage instance
   *
   * @param dbName - IndexedDB database name
   * @param storeName - Object store name
   * @param config - Optional encryption configuration
   */
  constructor(
    dbName: string = 'GenomeForgeSecure',
    storeName: string = 'encrypted_data',
    config?: EncryptionConfig
  ) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.encryption = new WebEncryption(config);
  }

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store for encrypted data
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('category', 'metadata.category', { unique: false });
          store.createIndex('updatedAt', 'metadata.updatedAt', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Ensure database is initialized
   */
  private async ensureInit(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * Store encrypted data
   *
   * @param key - Unique identifier for the data
   * @param data - Data to encrypt and store (will be JSON stringified)
   * @param password - Encryption password
   * @param category - Storage category for organization
   */
  async setItem<T>(
    key: string,
    data: T,
    password: string,
    category: StorageCategory = 'other'
  ): Promise<void> {
    const db = await this.ensureInit();

    // Encrypt the data
    const serialized = JSON.stringify(data);
    const encrypted = await this.encryption.encrypt(serialized, password);

    const item: EncryptedStorageItem = {
      key,
      data: encrypted,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        category
      }
    };

    // Check if item exists to preserve createdAt
    const existing = await this.getItemRaw(key);
    if (existing) {
      item.metadata.createdAt = existing.metadata.createdAt;
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(item);

      request.onerror = () => reject(new Error(`Failed to store item: ${request.error?.message}`));
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Retrieve and decrypt data
   *
   * @param key - Unique identifier for the data
   * @param password - Decryption password
   * @returns Decrypted data or null if not found
   */
  async getItem<T>(key: string, password: string): Promise<T | null> {
    const item = await this.getItemRaw(key);
    if (!item) return null;

    try {
      const decrypted = await this.encryption.decrypt(item.data, password);
      return JSON.parse(decrypted) as T;
    } catch (error) {
      if (error instanceof Error && error.message.includes('decrypt')) {
        throw new Error('Invalid password');
      }
      throw error;
    }
  }

  /**
   * Get raw encrypted item (for metadata access)
   */
  private async getItemRaw(key: string): Promise<EncryptedStorageItem | null> {
    const db = await this.ensureInit();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => reject(new Error(`Failed to get item: ${request.error?.message}`));
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  /**
   * Check if an item exists
   *
   * @param key - Unique identifier for the data
   */
  async hasItem(key: string): Promise<boolean> {
    const item = await this.getItemRaw(key);
    return item !== null;
  }

  /**
   * Remove an item
   *
   * @param key - Unique identifier for the data
   */
  async removeItem(key: string): Promise<void> {
    const db = await this.ensureInit();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onerror = () => reject(new Error(`Failed to remove item: ${request.error?.message}`));
      request.onsuccess = () => resolve();
    });
  }

  /**
   * List all keys, optionally filtered by category
   *
   * @param category - Optional category filter
   */
  async listKeys(category?: StorageCategory): Promise<string[]> {
    const db = await this.ensureInit();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);

      let request: IDBRequest;
      if (category) {
        const index = store.index('category');
        request = index.getAllKeys(category);
      } else {
        request = store.getAllKeys();
      }

      request.onerror = () => reject(new Error(`Failed to list keys: ${request.error?.message}`));
      request.onsuccess = () => resolve((request.result as IDBValidKey[]).map((k: IDBValidKey) => String(k)));
    });
  }

  /**
   * Get metadata for an item
   *
   * @param key - Unique identifier for the data
   */
  async getMetadata(key: string): Promise<EncryptedStorageItem['metadata'] | null> {
    const item = await this.getItemRaw(key);
    return item?.metadata || null;
  }

  /**
   * Clear all data (use with caution!)
   */
  async clear(): Promise<void> {
    const db = await this.ensureInit();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(new Error(`Failed to clear storage: ${request.error?.message}`));
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Clear all data in a specific category
   *
   * @param category - Category to clear
   */
  async clearCategory(category: StorageCategory): Promise<void> {
    const keys = await this.listKeys(category);
    for (const key of keys) {
      await this.removeItem(key);
    }
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }

  /**
   * Delete the entire database
   */
  async deleteDatabase(): Promise<void> {
    this.close();

    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName);

      request.onerror = () => reject(new Error(`Failed to delete database: ${request.error?.message}`));
      request.onsuccess = () => resolve();
    });
  }
}

/**
 * API Key Storage
 *
 * Specialized storage for AI provider API keys with encryption.
 */
export class ApiKeyStorage {
  private storage: EncryptedStorage;

  constructor(config?: EncryptionConfig) {
    this.storage = new EncryptedStorage('GenomeForgeSecure', 'api_keys', config);
  }

  /**
   * Store an API key
   *
   * @param provider - AI provider name (e.g., 'openai', 'anthropic')
   * @param apiKey - The API key to store
   * @param password - Master password for encryption
   */
  async storeKey(provider: string, apiKey: string, password: string): Promise<void> {
    const key = `apikey_${provider}`;
    await this.storage.setItem(
      key,
      { provider, apiKey, storedAt: new Date().toISOString() },
      password,
      'api_keys'
    );
  }

  /**
   * Retrieve an API key
   *
   * @param provider - AI provider name
   * @param password - Master password for decryption
   * @returns The API key or null if not found
   */
  async retrieveKey(provider: string, password: string): Promise<string | null> {
    const key = `apikey_${provider}`;
    const data = await this.storage.getItem<{ provider: string; apiKey: string; storedAt: string }>(
      key,
      password
    );
    return data?.apiKey || null;
  }

  /**
   * Check if a provider has a stored API key
   *
   * @param provider - AI provider name
   */
  async hasKey(provider: string): Promise<boolean> {
    const key = `apikey_${provider}`;
    return this.storage.hasItem(key);
  }

  /**
   * Remove an API key
   *
   * @param provider - AI provider name
   */
  async removeKey(provider: string): Promise<void> {
    const key = `apikey_${provider}`;
    await this.storage.removeItem(key);
  }

  /**
   * List all providers with stored keys
   */
  async listProviders(): Promise<string[]> {
    const keys = await this.storage.listKeys('api_keys');
    return keys
      .filter((k) => k.startsWith('apikey_'))
      .map((k) => k.replace('apikey_', ''));
  }

  /**
   * Clear all stored API keys
   */
  async clearAll(): Promise<void> {
    await this.storage.clearCategory('api_keys');
  }
}

/**
 * Master Password Manager
 *
 * Manages the master password verification using a password-derived verification token.
 * Does NOT store the actual password - only a verification hash.
 */
export class MasterPasswordManager {
  private storage: EncryptedStorage;
  private static readonly VERIFICATION_KEY = 'master_password_verification';
  private static readonly VERIFICATION_PLAINTEXT = 'GENOMEFORGE_PASSWORD_VERIFICATION_TOKEN_v1';

  constructor(config?: EncryptionConfig) {
    this.storage = new EncryptedStorage('GenomeForgeSecure', 'password_verification', config);
  }

  /**
   * Check if a master password has been set up
   */
  async isSetUp(): Promise<boolean> {
    return this.storage.hasItem(MasterPasswordManager.VERIFICATION_KEY);
  }

  /**
   * Set up the master password
   *
   * @param password - The master password to set up
   */
  async setUp(password: string): Promise<void> {
    if (await this.isSetUp()) {
      throw new Error('Master password already set up. Use changePassword() to change it.');
    }

    // Store encrypted verification token
    await this.storage.setItem(
      MasterPasswordManager.VERIFICATION_KEY,
      { token: MasterPasswordManager.VERIFICATION_PLAINTEXT, version: 1 },
      password,
      'settings'
    );
  }

  /**
   * Verify the master password
   *
   * @param password - Password to verify
   * @returns true if password is correct
   */
  async verify(password: string): Promise<boolean> {
    if (!(await this.isSetUp())) {
      throw new Error('Master password not set up');
    }

    try {
      const data = await this.storage.getItem<{ token: string; version: number }>(
        MasterPasswordManager.VERIFICATION_KEY,
        password
      );
      return data?.token === MasterPasswordManager.VERIFICATION_PLAINTEXT;
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid password') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Change the master password
   *
   * Note: This requires re-encrypting all stored data with the new password.
   * For now, this only updates the verification token.
   *
   * @param oldPassword - Current password
   * @param newPassword - New password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    // Verify old password first
    if (!(await this.verify(oldPassword))) {
      throw new Error('Invalid current password');
    }

    // Update verification token with new password
    await this.storage.setItem(
      MasterPasswordManager.VERIFICATION_KEY,
      { token: MasterPasswordManager.VERIFICATION_PLAINTEXT, version: 1 },
      newPassword,
      'settings'
    );
  }

  /**
   * Reset the master password (clears all encrypted data!)
   */
  async reset(): Promise<void> {
    await this.storage.deleteDatabase();
  }
}
