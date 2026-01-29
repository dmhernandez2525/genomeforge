/**
 * @genomeforge/perf
 *
 * Performance optimization utilities for GenomeForge.
 * Includes caching, memoization, timing, and performance tracking.
 */

// Types
export type {
  CacheConfig,
  CacheEntry,
  CacheStats,
  MemoizeOptions,
  PerformanceMark,
  PerformanceMeasurement,
  PerformanceMetrics,
  LazyLoadOptions,
  LazyStatus,
  LazyState,
  WorkerPoolConfig,
  WorkerTask,
  WorkerTaskResult,
  DebounceOptions,
  ThrottleOptions,
  BatchOptions,
  VirtualListOptions,
  VirtualListState,
  ResourceHintType,
  ResourceHint,
} from './types';

// Cache utilities
export {
  Cache,
  createCache,
  SimpleCache,
  createSimpleCache,
  WeakCache,
  createWeakCache,
  AsyncCache,
  createAsyncCache,
} from './cache';

// Memoization utilities
export {
  memoize,
  memoizeAsync,
  memoizeLast,
  memoizeByFirstArg,
  createSelector,
  memoizeMethod,
  createMemoizedGetter,
} from './memoize';

// Timing utilities
export {
  debounce,
  throttle,
  rafThrottle,
  PerformanceTracker,
  createPerformanceTracker,
  timeFunction,
  timeAsyncFunction,
  createTimer,
  delay,
  withTimeout,
  retryWithBackoff,
} from './timing';

// Lazy loading utilities
export {
  LazyLoader,
  createLazyLoader,
  lazyImport,
  preloadModules,
  LazyValue,
  createLazyValue,
  createIntersectionLazy,
} from './lazy';

// Batch processing utilities
export {
  BatchProcessor,
  createBatchProcessor,
  chunk,
  processBatches,
  parallelMap,
  sequentialMap,
  batchIterator,
  asyncBatchIterator,
  RateLimitedBatchProcessor,
  createRateLimitedProcessor,
} from './batch';

// Virtual list utilities
export {
  VirtualList,
  createVirtualList,
  calculateVisibleRange,
  FixedSizeVirtualList,
  createFixedSizeVirtualList,
  VirtualGrid,
  createVirtualGrid,
} from './virtual';
