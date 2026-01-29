/**
 * Batch Processing Utilities
 *
 * Helper functions for batch processing operations.
 */

/**
 * Generate a unique batch ID
 */
export function generateBatchId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `batch_${timestamp}_${random}`;
}

/**
 * Generate a unique job ID
 */
export function generateJobId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `job_${timestamp}_${random}`;
}

/**
 * Calculate estimated time remaining for batch processing
 *
 * @param remainingJobs - Number of jobs remaining
 * @param avgDuration - Average duration per job in milliseconds
 * @param concurrency - Number of concurrent jobs
 * @returns Estimated time remaining in milliseconds
 */
export function calculateEstimatedTime(
  remainingJobs: number,
  avgDuration: number,
  concurrency: number
): number {
  if (remainingJobs <= 0 || avgDuration <= 0 || concurrency <= 0) {
    return 0;
  }

  // Calculate how many "rounds" of concurrent processing are needed
  const rounds = Math.ceil(remainingJobs / concurrency);
  return rounds * avgDuration;
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${seconds}s`;
}

/**
 * Format file size in bytes to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}

/**
 * Calculate processing rate (jobs per second)
 */
export function calculateProcessingRate(
  completedJobs: number,
  elapsedTimeMs: number
): number {
  if (elapsedTimeMs <= 0) return 0;
  return completedJobs / (elapsedTimeMs / 1000);
}

/**
 * Validate batch configuration
 */
export function validateBatchConfig(config: {
  concurrency?: number;
  maxRetries?: number;
  retryDelay?: number;
  jobTimeout?: number;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.concurrency !== undefined) {
    if (config.concurrency < 1) {
      errors.push('Concurrency must be at least 1');
    }
    if (config.concurrency > 32) {
      errors.push('Concurrency should not exceed 32 for optimal performance');
    }
  }

  if (config.maxRetries !== undefined) {
    if (config.maxRetries < 0) {
      errors.push('Max retries cannot be negative');
    }
    if (config.maxRetries > 10) {
      errors.push('Max retries should not exceed 10');
    }
  }

  if (config.retryDelay !== undefined) {
    if (config.retryDelay < 0) {
      errors.push('Retry delay cannot be negative');
    }
    if (config.retryDelay > 60000) {
      errors.push('Retry delay should not exceed 60 seconds');
    }
  }

  if (config.jobTimeout !== undefined) {
    if (config.jobTimeout < 1000) {
      errors.push('Job timeout must be at least 1 second');
    }
    if (config.jobTimeout > 3600000) {
      errors.push('Job timeout should not exceed 1 hour');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Create a throttled function that limits execution rate
 */
export function createThrottle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= limitMs) {
      lastCall = now;
      fn(...args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        lastCall = Date.now();
        timeout = null;
        fn(...args);
      }, limitMs - timeSinceLastCall);
    }
  };
}

/**
 * Create a debounced function that delays execution
 */
export function createDebounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      timeout = null;
      fn(...args);
    }, delayMs);
  };
}

/**
 * Chunk an array into smaller arrays
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  if (size <= 0) return [array];

  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Create an exponential backoff delay calculator
 */
export function createExponentialBackoff(
  baseDelay: number,
  maxDelay: number,
  factor: number = 2
): (attempt: number) => number {
  return (attempt: number) => {
    const delay = baseDelay * Math.pow(factor, attempt);
    return Math.min(delay, maxDelay);
  };
}

/**
 * Calculate batch statistics summary
 */
export function calculateBatchSummary(jobs: {
  status: string;
  result?: { duration?: number };
}[]): {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  successRate: number;
  avgDuration: number;
} {
  const total = jobs.length;
  const completed = jobs.filter((j) => j.status === 'complete').length;
  const failed = jobs.filter((j) => j.status === 'failed').length;
  const pending = jobs.filter(
    (j) => j.status === 'pending' || j.status === 'queued'
  ).length;

  const completedWithDuration = jobs.filter(
    (j) => j.status === 'complete' && j.result?.duration
  );
  const avgDuration =
    completedWithDuration.length > 0
      ? completedWithDuration.reduce((sum, j) => sum + (j.result?.duration || 0), 0) /
        completedWithDuration.length
      : 0;

  return {
    total,
    completed,
    failed,
    pending,
    successRate: total > 0 ? (completed / total) * 100 : 0,
    avgDuration,
  };
}
