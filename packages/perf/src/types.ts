/**
 * Performance Types
 *
 * Type definitions for performance optimization utilities.
 */

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Maximum number of items in cache */
  maxSize?: number;
  /** Time-to-live in milliseconds */
  ttl?: number;
  /** Cache eviction policy */
  evictionPolicy?: 'lru' | 'fifo' | 'lfu';
  /** Whether to serialize values */
  serialize?: boolean;
}

/**
 * Cache entry
 */
export interface CacheEntry<T> {
  /** Cached value */
  value: T;
  /** Creation timestamp */
  createdAt: number;
  /** Last access timestamp */
  lastAccessedAt: number;
  /** Access count */
  accessCount: number;
  /** Expiration timestamp */
  expiresAt?: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Number of items in cache */
  size: number;
  /** Number of cache hits */
  hits: number;
  /** Number of cache misses */
  misses: number;
  /** Hit ratio (0-1) */
  hitRatio: number;
  /** Total memory usage estimate (bytes) */
  memoryUsage?: number;
  /** Number of evictions */
  evictions: number;
}

/**
 * Memoization options
 */
export interface MemoizeOptions {
  /** Cache configuration */
  cache?: CacheConfig;
  /** Custom key generator */
  keyGenerator?: (...args: unknown[]) => string;
  /** Whether to memoize async results */
  async?: boolean;
}

/**
 * Performance mark
 */
export interface PerformanceMark {
  /** Mark name */
  name: string;
  /** Timestamp */
  timestamp: number;
  /** Custom data */
  data?: Record<string, unknown>;
}

/**
 * Performance measurement
 */
export interface PerformanceMeasurement {
  /** Measurement name */
  name: string;
  /** Start mark name */
  startMark: string;
  /** End mark name */
  endMark: string;
  /** Duration in milliseconds */
  duration: number;
  /** Custom data */
  data?: Record<string, unknown>;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  /** All marks */
  marks: PerformanceMark[];
  /** All measurements */
  measurements: PerformanceMeasurement[];
  /** Total duration */
  totalDuration: number;
  /** Average duration */
  averageDuration: number;
  /** Min duration */
  minDuration: number;
  /** Max duration */
  maxDuration: number;
}

/**
 * Lazy loading options
 */
export interface LazyLoadOptions {
  /** Timeout before loading (ms) */
  timeout?: number;
  /** Retry count on failure */
  retries?: number;
  /** Retry delay (ms) */
  retryDelay?: number;
  /** Priority level */
  priority?: 'high' | 'low' | 'auto';
  /** Preload hint */
  preload?: boolean;
}

/**
 * Lazy resource status
 */
export type LazyStatus = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Lazy resource state
 */
export interface LazyState<T> {
  /** Current status */
  status: LazyStatus;
  /** Loaded data */
  data?: T;
  /** Error if failed */
  error?: Error;
  /** Loading progress (0-100) */
  progress?: number;
}

/**
 * Worker pool configuration
 */
export interface WorkerPoolConfig {
  /** Number of workers */
  poolSize?: number;
  /** Task timeout (ms) */
  taskTimeout?: number;
  /** Worker initialization script */
  initScript?: string;
  /** Whether to terminate idle workers */
  terminateIdle?: boolean;
  /** Idle timeout before termination (ms) */
  idleTimeout?: number;
}

/**
 * Worker task
 */
export interface WorkerTask<T = unknown, R = unknown> {
  /** Task ID */
  id: string;
  /** Task type/name */
  type: string;
  /** Task data */
  data: T;
  /** Priority */
  priority?: number;
  /** Timeout (ms) */
  timeout?: number;
  /** Transfer list for structured cloning */
  transfer?: Transferable[];
}

/**
 * Worker task result
 */
export interface WorkerTaskResult<R = unknown> {
  /** Task ID */
  taskId: string;
  /** Whether task succeeded */
  success: boolean;
  /** Result data */
  result?: R;
  /** Error if failed */
  error?: string;
  /** Execution duration (ms) */
  duration: number;
}

/**
 * Debounce options
 */
export interface DebounceOptions {
  /** Delay in milliseconds */
  delay: number;
  /** Call on leading edge */
  leading?: boolean;
  /** Call on trailing edge */
  trailing?: boolean;
  /** Maximum wait time */
  maxWait?: number;
}

/**
 * Throttle options
 */
export interface ThrottleOptions {
  /** Interval in milliseconds */
  interval: number;
  /** Call on leading edge */
  leading?: boolean;
  /** Call on trailing edge */
  trailing?: boolean;
}

/**
 * Batch processing options
 */
export interface BatchOptions {
  /** Batch size */
  batchSize: number;
  /** Delay between batches (ms) */
  batchDelay?: number;
  /** Concurrency limit */
  concurrency?: number;
}

/**
 * Virtual list options
 */
export interface VirtualListOptions {
  /** Item height (pixels) */
  itemHeight: number;
  /** Overscan count (extra items to render) */
  overscan?: number;
  /** Container height */
  containerHeight?: number;
  /** Dynamic height calculation */
  estimateHeight?: (index: number) => number;
}

/**
 * Virtual list state
 */
export interface VirtualListState {
  /** Start index */
  startIndex: number;
  /** End index */
  endIndex: number;
  /** Visible items */
  visibleCount: number;
  /** Scroll offset */
  scrollOffset: number;
  /** Total height */
  totalHeight: number;
}

/**
 * Resource hint type
 */
export type ResourceHintType = 'preload' | 'prefetch' | 'preconnect' | 'dns-prefetch';

/**
 * Resource hint
 */
export interface ResourceHint {
  /** Hint type */
  type: ResourceHintType;
  /** Resource URL */
  href: string;
  /** Resource type (for preload) */
  as?: string;
  /** Cross-origin mode */
  crossOrigin?: 'anonymous' | 'use-credentials';
}
