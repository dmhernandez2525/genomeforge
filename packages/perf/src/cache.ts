/**
 * Cache Utilities
 *
 * In-memory caching with LRU/FIFO/LFU eviction policies.
 */

import type { CacheConfig, CacheEntry, CacheStats } from './types';

/**
 * Default cache configuration
 */
const DEFAULT_CONFIG: Required<CacheConfig> = {
  maxSize: 100,
  ttl: 0, // 0 = no expiration
  evictionPolicy: 'lru',
  serialize: false,
};

/**
 * LRU/FIFO/LFU Cache implementation
 */
export class Cache<T = unknown> {
  private config: Required<CacheConfig>;
  private cache: Map<string, CacheEntry<T>> = new Map();
  private hits: number = 0;
  private misses: number = 0;
  private evictions: number = 0;

  constructor(config?: CacheConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get a value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return undefined;
    }

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return undefined;
    }

    // Update access metadata
    entry.lastAccessedAt = Date.now();
    entry.accessCount++;

    // Move to end for LRU (Map maintains insertion order)
    if (this.config.evictionPolicy === 'lru') {
      this.cache.delete(key);
      this.cache.set(key, entry);
    }

    this.hits++;
    return entry.value;
  }

  /**
   * Set a value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    // Evict if at capacity
    while (this.cache.size >= this.config.maxSize) {
      this.evict();
    }

    const now = Date.now();
    const effectiveTtl = ttl ?? this.config.ttl;

    const entry: CacheEntry<T> = {
      value: this.config.serialize ? JSON.parse(JSON.stringify(value)) : value,
      createdAt: now,
      lastAccessedAt: now,
      accessCount: 0,
      expiresAt: effectiveTtl > 0 ? now + effectiveTtl : undefined,
    };

    this.cache.set(key, entry);
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRatio: total > 0 ? this.hits / total : 0,
      evictions: this.evictions,
    };
  }

  /**
   * Evict entry based on policy
   */
  private evict(): void {
    if (this.cache.size === 0) return;

    let keyToEvict: string | null = null;

    switch (this.config.evictionPolicy) {
      case 'fifo':
        // First key is oldest (Map maintains insertion order)
        keyToEvict = this.cache.keys().next().value ?? null;
        break;

      case 'lfu':
        // Find least frequently used
        let minCount = Infinity;
        for (const [key, entry] of this.cache) {
          if (entry.accessCount < minCount) {
            minCount = entry.accessCount;
            keyToEvict = key;
          }
        }
        break;

      case 'lru':
      default:
        // First key is least recently used (due to reordering on access)
        keyToEvict = this.cache.keys().next().value ?? null;
        break;
    }

    if (keyToEvict) {
      this.cache.delete(keyToEvict);
      this.evictions++;
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get or set a value
   */
  getOrSet(key: string, factory: () => T, ttl?: number): T {
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = factory();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Get or set async value
   */
  async getOrSetAsync(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }
}

/**
 * Create a cache instance
 */
export function createCache<T = unknown>(config?: CacheConfig): Cache<T> {
  return new Cache<T>(config);
}

/**
 * Simple Map-based cache (no eviction)
 */
export class SimpleCache<T = unknown> {
  private cache: Map<string, T> = new Map();

  get(key: string): T | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: T): void {
    this.cache.set(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Create a simple cache instance
 */
export function createSimpleCache<T = unknown>(): SimpleCache<T> {
  return new SimpleCache<T>();
}

/**
 * WeakMap-based cache for object keys (auto garbage collection)
 */
export class WeakCache<K extends object, V> {
  private cache = new WeakMap<K, V>();

  get(key: K): V | undefined {
    return this.cache.get(key);
  }

  set(key: K, value: V): void {
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }
}

/**
 * Create a weak cache instance
 */
export function createWeakCache<K extends object, V>(): WeakCache<K, V> {
  return new WeakCache<K, V>();
}

/**
 * Async cache with deduplication of in-flight requests
 */
export class AsyncCache<T = unknown> {
  private cache: Cache<T>;
  private pending: Map<string, Promise<T>> = new Map();

  constructor(config?: CacheConfig) {
    this.cache = new Cache<T>(config);
  }

  /**
   * Get or fetch value with deduplication
   */
  async getOrFetch(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // Check if request is already pending
    const pending = this.pending.get(key);
    if (pending) {
      return pending;
    }

    // Create new request
    const promise = fetcher()
      .then((value) => {
        this.cache.set(key, value, ttl);
        this.pending.delete(key);
        return value;
      })
      .catch((error) => {
        this.pending.delete(key);
        throw error;
      });

    this.pending.set(key, promise);
    return promise;
  }

  /**
   * Invalidate a key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    this.pending.delete(key);
  }

  /**
   * Clear all
   */
  clear(): void {
    this.cache.clear();
    this.pending.clear();
  }

  /**
   * Get cache stats
   */
  getStats(): CacheStats & { pendingCount: number } {
    return {
      ...this.cache.getStats(),
      pendingCount: this.pending.size,
    };
  }
}

/**
 * Create an async cache instance
 */
export function createAsyncCache<T = unknown>(config?: CacheConfig): AsyncCache<T> {
  return new AsyncCache<T>(config);
}
