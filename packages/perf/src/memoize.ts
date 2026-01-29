/**
 * Memoization Utilities
 *
 * Function result caching with various strategies.
 */

import type { MemoizeOptions, CacheConfig } from './types';
import { Cache, createCache } from './cache';

/**
 * Default key generator - JSON stringify args
 */
function defaultKeyGenerator(...args: unknown[]): string {
  return JSON.stringify(args);
}

/**
 * Memoize a function
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options?: MemoizeOptions
): T & { cache: Cache<ReturnType<T>>; clear: () => void } {
  const cache = createCache<ReturnType<T>>(options?.cache);
  const keyGen = options?.keyGenerator || defaultKeyGenerator;

  const memoized = function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
    const key = keyGen(...args);

    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = fn.apply(this, args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  } as T & { cache: Cache<ReturnType<T>>; clear: () => void };

  memoized.cache = cache;
  memoized.clear = () => cache.clear();

  return memoized;
}

/**
 * Memoize an async function
 */
export function memoizeAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options?: MemoizeOptions
): T & { cache: Cache<Awaited<ReturnType<T>>>; clear: () => void } {
  const cache = createCache<Awaited<ReturnType<T>>>(options?.cache);
  const keyGen = options?.keyGenerator || defaultKeyGenerator;
  const pending = new Map<string, Promise<Awaited<ReturnType<T>>>>();

  const memoized = async function (
    this: unknown,
    ...args: Parameters<T>
  ): Promise<Awaited<ReturnType<T>>> {
    const key = keyGen(...args);

    // Check cache
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // Check pending
    const pendingResult = pending.get(key);
    if (pendingResult) {
      return pendingResult;
    }

    // Execute and cache
    const promise = (async () => {
      const result = (await fn.apply(this, args)) as Awaited<ReturnType<T>>;
      cache.set(key, result);
      pending.delete(key);
      return result;
    })();

    pending.set(key, promise);

    try {
      return await promise;
    } catch (error) {
      pending.delete(key);
      throw error;
    }
  } as T & { cache: Cache<Awaited<ReturnType<T>>>; clear: () => void };

  memoized.cache = cache;
  memoized.clear = () => {
    cache.clear();
    pending.clear();
  };

  return memoized;
}

/**
 * Memoize with a single cached value (most recent call)
 */
export function memoizeLast<T extends (...args: unknown[]) => unknown>(
  fn: T
): T & { clear: () => void } {
  let lastArgs: Parameters<T> | null = null;
  let lastResult: ReturnType<T> | undefined;

  const memoized = function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
    if (lastArgs && argsEqual(lastArgs, args)) {
      return lastResult as ReturnType<T>;
    }

    lastArgs = args;
    lastResult = fn.apply(this, args) as ReturnType<T>;
    return lastResult;
  } as T & { clear: () => void };

  memoized.clear = () => {
    lastArgs = null;
    lastResult = undefined;
  };

  return memoized;
}

/**
 * Check if two argument arrays are equal
 */
function argsEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
}

/**
 * Memoize by first argument (common pattern)
 */
export function memoizeByFirstArg<T extends (first: unknown, ...rest: unknown[]) => unknown>(
  fn: T,
  cacheConfig?: CacheConfig
): T & { cache: Cache<ReturnType<T>>; clear: () => void } {
  return memoize(fn, {
    cache: cacheConfig,
    keyGenerator: (first) => String(first),
  });
}

/**
 * Create a memoized selector (for computed values)
 */
export function createSelector<
  TArgs extends unknown[],
  TDeps extends unknown[],
  TResult
>(
  dependencies: { [K in keyof TDeps]: (...args: TArgs) => TDeps[K] },
  resultFn: (...deps: TDeps) => TResult
): (...args: TArgs) => TResult {
  let lastDeps: TDeps | null = null;
  let lastResult: TResult | undefined;

  return (...args: TArgs): TResult => {
    const deps = dependencies.map((dep) => dep(...args)) as TDeps;

    if (lastDeps && depsEqual(lastDeps, deps)) {
      return lastResult as TResult;
    }

    lastDeps = deps;
    lastResult = resultFn(...deps);
    return lastResult;
  };
}

/**
 * Check if dependency arrays are equal
 */
function depsEqual<T extends unknown[]>(a: T, b: T): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
}

/**
 * Memoize a method (decorator-style)
 */
export function memoizeMethod<T extends (...args: unknown[]) => unknown>(
  target: object,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<T>
): TypedPropertyDescriptor<T> {
  const originalMethod = descriptor.value;
  if (!originalMethod) return descriptor;

  const cacheKey = Symbol(`memoized_${propertyKey}`);

  descriptor.value = function (this: Record<symbol, Cache<ReturnType<T>>>, ...args: Parameters<T>) {
    if (!this[cacheKey]) {
      this[cacheKey] = createCache<ReturnType<T>>();
    }

    const key = JSON.stringify(args);
    const cached = this[cacheKey].get(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = originalMethod.apply(this, args) as ReturnType<T>;
    this[cacheKey].set(key, result);
    return result;
  } as T;

  return descriptor;
}

/**
 * Create a memoized getter (computed property)
 */
export function createMemoizedGetter<T>(
  getter: () => T
): { get: () => T; invalidate: () => void } {
  let cached: T | undefined;
  let hasCached = false;

  return {
    get: () => {
      if (!hasCached) {
        cached = getter();
        hasCached = true;
      }
      return cached as T;
    },
    invalidate: () => {
      cached = undefined;
      hasCached = false;
    },
  };
}
