/**
 * Batch Processing Utilities
 *
 * Efficient batch processing for large data sets.
 */

import type { BatchOptions } from './types';

/**
 * Batch processor for handling large arrays efficiently
 */
export class BatchProcessor<T, R = T> {
  private options: Required<BatchOptions>;
  private abortController: AbortController | null = null;

  constructor(options: BatchOptions) {
    this.options = {
      batchSize: options.batchSize,
      batchDelay: options.batchDelay ?? 0,
      concurrency: options.concurrency ?? 1,
    };
  }

  /**
   * Process items in batches
   */
  async process(
    items: T[],
    processor: (batch: T[], batchIndex: number) => Promise<R[]>,
    onProgress?: (progress: { current: number; total: number; percent: number }) => void
  ): Promise<R[]> {
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const batches = chunk(items, this.options.batchSize);
    const results: R[] = [];
    let processedBatches = 0;

    // Process batches with concurrency limit
    for (let i = 0; i < batches.length; i += this.options.concurrency) {
      if (signal.aborted) {
        throw new Error('Batch processing aborted');
      }

      const concurrentBatches = batches.slice(i, i + this.options.concurrency);
      const batchResults = await Promise.all(
        concurrentBatches.map((batch, idx) => processor(batch, i + idx))
      );

      for (const batchResult of batchResults) {
        results.push(...batchResult);
      }

      processedBatches += concurrentBatches.length;

      if (onProgress) {
        onProgress({
          current: processedBatches,
          total: batches.length,
          percent: Math.round((processedBatches / batches.length) * 100),
        });
      }

      // Add delay between batch groups
      if (this.options.batchDelay > 0 && i + this.options.concurrency < batches.length) {
        await this.delay(this.options.batchDelay);
      }
    }

    this.abortController = null;
    return results;
  }

  /**
   * Process items with transformation
   */
  async map(
    items: T[],
    transformer: (item: T, index: number) => Promise<R>,
    onProgress?: (progress: { current: number; total: number; percent: number }) => void
  ): Promise<R[]> {
    let globalIndex = 0;
    return this.process(
      items,
      async (batch) => {
        const results = await Promise.all(
          batch.map((item, localIndex) => {
            const idx = globalIndex + localIndex;
            return transformer(item, idx);
          })
        );
        globalIndex += batch.length;
        return results;
      },
      onProgress
    );
  }

  /**
   * Filter items in batches
   */
  async filter(
    items: T[],
    predicate: (item: T, index: number) => Promise<boolean>,
    onProgress?: (progress: { current: number; total: number; percent: number }) => void
  ): Promise<T[]> {
    let globalIndex = 0;
    const filtered: T[] = [];

    await this.process(
      items,
      async (batch) => {
        const results = await Promise.all(
          batch.map(async (item, localIndex) => {
            const idx = globalIndex + localIndex;
            const keep = await predicate(item, idx);
            return { item, keep };
          })
        );
        globalIndex += batch.length;

        for (const { item, keep } of results) {
          if (keep) {
            filtered.push(item);
          }
        }

        return [];
      },
      onProgress
    );

    return filtered;
  }

  /**
   * Reduce items in batches
   */
  async reduce<A>(
    items: T[],
    reducer: (accumulator: A, item: T, index: number) => Promise<A>,
    initialValue: A,
    onProgress?: (progress: { current: number; total: number; percent: number }) => void
  ): Promise<A> {
    let accumulator = initialValue;
    let globalIndex = 0;

    await this.process(
      items,
      async (batch) => {
        for (const item of batch) {
          accumulator = await reducer(accumulator, item, globalIndex++);
        }
        return [];
      },
      onProgress
    );

    return accumulator;
  }

  /**
   * Abort current processing
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create a batch processor
 */
export function createBatchProcessor<T, R = T>(
  options: BatchOptions
): BatchProcessor<T, R> {
  return new BatchProcessor<T, R>(options);
}

/**
 * Split array into chunks
 */
export function chunk<T>(array: T[], size: number): T[][] {
  if (size <= 0) {
    throw new Error('Chunk size must be positive');
  }

  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Process array in batches with callback
 */
export async function processBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[], batchIndex: number) => Promise<R[]>,
  options?: {
    delay?: number;
    onProgress?: (progress: { current: number; total: number; percent: number }) => void;
  }
): Promise<R[]> {
  const batches = chunk(items, batchSize);
  const results: R[] = [];

  for (let i = 0; i < batches.length; i++) {
    const batchResult = await processor(batches[i], i);
    results.push(...batchResult);

    if (options?.onProgress) {
      options.onProgress({
        current: i + 1,
        total: batches.length,
        percent: Math.round(((i + 1) / batches.length) * 100),
      });
    }

    if (options?.delay && i < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, options.delay));
    }
  }

  return results;
}

/**
 * Parallel map with concurrency limit
 */
export async function parallelMap<T, R>(
  items: T[],
  mapper: (item: T, index: number) => Promise<R>,
  concurrency: number = 4
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  async function worker(): Promise<void> {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      results[index] = await mapper(items[index], index);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () =>
    worker()
  );

  await Promise.all(workers);
  return results;
}

/**
 * Sequential map (one at a time)
 */
export async function sequentialMap<T, R>(
  items: T[],
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i++) {
    results.push(await mapper(items[i], i));
  }
  return results;
}

/**
 * Batch iterator
 */
export function* batchIterator<T>(items: T[], batchSize: number): Generator<T[]> {
  for (let i = 0; i < items.length; i += batchSize) {
    yield items.slice(i, i + batchSize);
  }
}

/**
 * Async batch iterator
 */
export async function* asyncBatchIterator<T>(
  items: T[],
  batchSize: number,
  delayMs: number = 0
): AsyncGenerator<T[]> {
  for (let i = 0; i < items.length; i += batchSize) {
    yield items.slice(i, i + batchSize);
    if (delayMs > 0 && i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

/**
 * Rate-limited batch processor
 */
export class RateLimitedBatchProcessor<T, R = T> {
  private queue: T[] = [];
  private processing = false;
  private results: R[] = [];
  private processor: (item: T) => Promise<R>;
  private rateLimit: number; // items per second
  private onComplete?: (results: R[]) => void;

  constructor(
    processor: (item: T) => Promise<R>,
    rateLimit: number,
    onComplete?: (results: R[]) => void
  ) {
    this.processor = processor;
    this.rateLimit = rateLimit;
    this.onComplete = onComplete;
  }

  /**
   * Add items to queue
   */
  add(...items: T[]): void {
    this.queue.push(...items);
    this.startProcessing();
  }

  /**
   * Get current queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Check if processing
   */
  isProcessing(): boolean {
    return this.processing;
  }

  /**
   * Get processed results
   */
  getResults(): R[] {
    return [...this.results];
  }

  /**
   * Clear queue and results
   */
  clear(): void {
    this.queue = [];
    this.results = [];
  }

  /**
   * Start processing queue
   */
  private async startProcessing(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    const intervalMs = 1000 / this.rateLimit;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      const result = await this.processor(item);
      this.results.push(result);

      if (this.queue.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }

    this.processing = false;
    if (this.onComplete) {
      this.onComplete(this.results);
    }
  }
}

/**
 * Create a rate-limited batch processor
 */
export function createRateLimitedProcessor<T, R = T>(
  processor: (item: T) => Promise<R>,
  rateLimit: number,
  onComplete?: (results: R[]) => void
): RateLimitedBatchProcessor<T, R> {
  return new RateLimitedBatchProcessor(processor, rateLimit, onComplete);
}
