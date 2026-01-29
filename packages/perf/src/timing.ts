/**
 * Timing Utilities
 *
 * Debounce, throttle, and timing measurement.
 */

import type {
  DebounceOptions,
  ThrottleOptions,
  PerformanceMark,
  PerformanceMeasurement,
  PerformanceMetrics,
} from './types';

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
  options?: Omit<DebounceOptions, 'delay'>
): T & { cancel: () => void; flush: () => void; pending: () => boolean } {
  const { leading = false, trailing = true, maxWait } = options || {};

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let maxTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: unknown = null;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;
  let isPending = false;

  const invoke = () => {
    const args = lastArgs;
    const thisArg = lastThis;
    lastArgs = null;
    lastThis = null;
    lastInvokeTime = Date.now();
    isPending = false;
    return fn.apply(thisArg, args as Parameters<T>);
  };

  const shouldInvoke = (time: number) => {
    const timeSinceLastCall = lastCallTime === undefined ? 0 : time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  };

  const trailingEdge = () => {
    timeoutId = null;
    if (trailing && lastArgs) {
      return invoke();
    }
    lastArgs = null;
    lastThis = null;
    return undefined;
  };

  const remainingWait = (time: number) => {
    const timeSinceLastCall = lastCallTime === undefined ? 0 : time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = delay - timeSinceLastCall;

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  };

  const timerExpired = () => {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge();
    }
    timeoutId = setTimeout(timerExpired, remainingWait(time));
    return undefined;
  };

  const leadingEdge = (time: number) => {
    lastInvokeTime = time;
    timeoutId = setTimeout(timerExpired, delay);
    return leading ? invoke() : undefined;
  };

  const debounced = function (this: unknown, ...args: Parameters<T>) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;
    isPending = true;

    if (isInvoking) {
      if (timeoutId === null) {
        return leadingEdge(time);
      }
      if (maxWait !== undefined) {
        timeoutId = setTimeout(timerExpired, delay);
        return invoke();
      }
    }

    if (timeoutId === null) {
      timeoutId = setTimeout(timerExpired, delay);
    }

    return undefined;
  } as T & { cancel: () => void; flush: () => void; pending: () => boolean };

  debounced.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (maxTimeoutId) clearTimeout(maxTimeoutId);
    timeoutId = null;
    maxTimeoutId = null;
    lastArgs = null;
    lastThis = null;
    lastCallTime = undefined;
    isPending = false;
  };

  debounced.flush = () => {
    if (timeoutId === null) return undefined;
    return trailingEdge();
  };

  debounced.pending = () => isPending;

  return debounced;
}

/**
 * Throttle a function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  interval: number,
  options?: Omit<ThrottleOptions, 'interval'>
): T & { cancel: () => void } {
  const { leading = true, trailing = true } = options || {};

  let lastCallTime: number | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: unknown = null;

  const invoke = () => {
    const args = lastArgs;
    const thisArg = lastThis;
    lastArgs = null;
    lastThis = null;
    lastCallTime = Date.now();
    return fn.apply(thisArg, args as Parameters<T>);
  };

  const throttled = function (this: unknown, ...args: Parameters<T>) {
    const now = Date.now();
    const elapsed = lastCallTime === undefined ? interval : now - lastCallTime;

    lastArgs = args;
    lastThis = this;

    if (elapsed >= interval) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (leading) {
        return invoke();
      }
    }

    if (!timeoutId && trailing) {
      const remaining = interval - elapsed;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        invoke();
      }, remaining);
    }

    return undefined;
  } as T & { cancel: () => void };

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastCallTime = undefined;
    lastArgs = null;
    lastThis = null;
  };

  return throttled;
}

/**
 * RAF-based throttle (once per animation frame)
 */
export function rafThrottle<T extends (...args: unknown[]) => unknown>(
  fn: T
): T & { cancel: () => void } {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: unknown = null;

  const throttled = function (this: unknown, ...args: Parameters<T>) {
    lastArgs = args;
    lastThis = this;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        rafId = null;
        fn.apply(lastThis, lastArgs as Parameters<T>);
      });
    }
  } as T & { cancel: () => void };

  throttled.cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  return throttled;
}

/**
 * Performance measurement utility
 */
export class PerformanceTracker {
  private marks: Map<string, PerformanceMark> = new Map();
  private measurements: PerformanceMeasurement[] = [];

  /**
   * Create a performance mark
   */
  mark(name: string, data?: Record<string, unknown>): void {
    this.marks.set(name, {
      name,
      timestamp: performance.now(),
      data,
    });
  }

  /**
   * Measure between two marks
   */
  measure(name: string, startMark: string, endMark: string): number | null {
    const start = this.marks.get(startMark);
    const end = this.marks.get(endMark);

    if (!start || !end) return null;

    const duration = end.timestamp - start.timestamp;

    this.measurements.push({
      name,
      startMark,
      endMark,
      duration,
    });

    return duration;
  }

  /**
   * Time a function execution
   */
  time<T>(name: string, fn: () => T): T {
    const startMark = `${name}_start`;
    const endMark = `${name}_end`;

    this.mark(startMark);
    const result = fn();
    this.mark(endMark);
    this.measure(name, startMark, endMark);

    return result;
  }

  /**
   * Time an async function execution
   */
  async timeAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startMark = `${name}_start`;
    const endMark = `${name}_end`;

    this.mark(startMark);
    const result = await fn();
    this.mark(endMark);
    this.measure(name, startMark, endMark);

    return result;
  }

  /**
   * Get metrics
   */
  getMetrics(): PerformanceMetrics {
    const durations = this.measurements.map((m) => m.duration);
    const total = durations.reduce((a, b) => a + b, 0);

    return {
      marks: Array.from(this.marks.values()),
      measurements: [...this.measurements],
      totalDuration: total,
      averageDuration: durations.length > 0 ? total / durations.length : 0,
      minDuration: Math.min(...durations, 0),
      maxDuration: Math.max(...durations, 0),
    };
  }

  /**
   * Get measurements by name
   */
  getMeasurementsByName(name: string): PerformanceMeasurement[] {
    return this.measurements.filter((m) => m.name === name);
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.marks.clear();
    this.measurements = [];
  }
}

/**
 * Create performance tracker instance
 */
export function createPerformanceTracker(): PerformanceTracker {
  return new PerformanceTracker();
}

/**
 * Simple timing function
 */
export function timeFunction<T>(fn: () => T): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  return { result, duration };
}

/**
 * Simple async timing function
 */
export async function timeAsyncFunction<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}

/**
 * Create a timer that can be started/stopped
 */
export function createTimer(): {
  start: () => void;
  stop: () => number;
  elapsed: () => number;
  reset: () => void;
} {
  let startTime: number | null = null;
  let totalElapsed = 0;

  return {
    start: () => {
      if (startTime === null) {
        startTime = performance.now();
      }
    },
    stop: () => {
      if (startTime !== null) {
        totalElapsed += performance.now() - startTime;
        startTime = null;
      }
      return totalElapsed;
    },
    elapsed: () => {
      if (startTime !== null) {
        return totalElapsed + (performance.now() - startTime);
      }
      return totalElapsed;
    },
    reset: () => {
      startTime = null;
      totalElapsed = 0;
    },
  };
}

/**
 * Delay execution
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Timeout wrapper for promises
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, ms);

    promise
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    factor = 2,
    onRetry,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delayMs = Math.min(initialDelay * Math.pow(factor, attempt), maxDelay);
        if (onRetry) {
          onRetry(lastError, attempt + 1);
        }
        await delay(delayMs);
      }
    }
  }

  throw lastError;
}
