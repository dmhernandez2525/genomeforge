/**
 * Batch Processor
 *
 * Process multiple genome files concurrently with progress tracking.
 */

import type {
  BatchJob,
  BatchJobResult,
  BatchConfig,
  BatchProgress,
  BatchSummary,
  BatchStatus,
  BatchStats,
  BatchEvent,
  BatchEventType,
  BatchEventListener,
  BatchFileInput,
  CreateBatchOptions,
  BatchJobPriority,
} from './types';
import { BatchJobQueue } from './queue';
import { generateBatchId, generateJobId, calculateEstimatedTime } from './utils';

/**
 * Default batch configuration
 */
export const DEFAULT_BATCH_CONFIG: BatchConfig = {
  concurrency: 4,
  maxRetries: 3,
  retryDelay: 1000,
  jobTimeout: 300000, // 5 minutes
  continueOnError: true,
  priorityOrder: ['urgent', 'high', 'normal', 'low'],
};

/**
 * Job processor function type
 */
export type JobProcessor = (job: BatchJob) => Promise<BatchJobResult>;

/**
 * Batch processor class
 */
export class BatchProcessor {
  private config: BatchConfig;
  private queue: BatchJobQueue;
  private batches: Map<string, BatchSummary> = new Map();
  private listeners: Set<BatchEventListener> = new Set();
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private runningJobs: Map<string, AbortController> = new Map();
  private jobProcessor: JobProcessor | null = null;
  private processingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<BatchConfig> = {}) {
    this.config = { ...DEFAULT_BATCH_CONFIG, ...config };
    this.queue = new BatchJobQueue(this.config.priorityOrder);
  }

  /**
   * Set the job processor function
   */
  setJobProcessor(processor: JobProcessor): void {
    this.jobProcessor = processor;
  }

  /**
   * Add an event listener
   */
  addEventListener(listener: BatchEventListener): void {
    this.listeners.add(listener);
  }

  /**
   * Remove an event listener
   */
  removeEventListener(listener: BatchEventListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Emit an event
   */
  private emit(type: BatchEventType, batchId: string, jobId?: string, data?: Record<string, unknown>): void {
    const event: BatchEvent = {
      type,
      batchId,
      jobId,
      timestamp: new Date().toISOString(),
      data,
    };

    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Batch event listener error:', error);
      }
    }
  }

  /**
   * Create a new batch from files
   */
  createBatch(files: BatchFileInput[], options: CreateBatchOptions = {}): BatchSummary {
    const batchId = generateBatchId();
    const priority: BatchJobPriority = options.priority || 'normal';
    const config = { ...this.config, ...options.config };

    // Create jobs for each file
    const jobs: BatchJob[] = files.map((file) => ({
      id: generateJobId(),
      batchId,
      filename: file.filename,
      filePath: file.path,
      fileSize: file.size || 0,
      status: 'pending' as const,
      priority,
      progress: 0,
      retryCount: 0,
      maxRetries: config.maxRetries,
    }));

    // Add jobs to queue
    for (const job of jobs) {
      this.queue.enqueue(job);
    }

    // Create batch summary
    const batch: BatchSummary = {
      batchId,
      name: options.name || `Batch ${new Date().toISOString()}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
      progress: this.calculateProgress(jobs),
      jobs,
      config,
      stats: this.calculateStats(jobs),
    };

    this.batches.set(batchId, batch);
    return batch;
  }

  /**
   * Start processing batches
   */
  start(): void {
    if (this.isRunning) return;
    if (!this.jobProcessor) {
      throw new Error('No job processor set. Call setJobProcessor() first.');
    }

    this.isRunning = true;
    this.isPaused = false;
    this.processQueue();
  }

  /**
   * Pause processing
   */
  pause(): void {
    this.isPaused = true;
    for (const batch of this.batches.values()) {
      if (batch.status === 'running') {
        batch.status = 'paused';
        this.emit('batch_paused', batch.batchId);
      }
    }
  }

  /**
   * Resume processing
   */
  resume(): void {
    this.isPaused = false;
    for (const batch of this.batches.values()) {
      if (batch.status === 'paused') {
        batch.status = 'running';
        this.emit('batch_resumed', batch.batchId);
      }
    }
    this.processQueue();
  }

  /**
   * Stop processing
   */
  stop(): void {
    this.isRunning = false;
    this.isPaused = false;

    // Cancel running jobs
    for (const [jobId, controller] of this.runningJobs) {
      controller.abort();
      this.runningJobs.delete(jobId);
    }

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Cancel a specific batch
   */
  cancelBatch(batchId: string): boolean {
    const batch = this.batches.get(batchId);
    if (!batch) return false;

    // Cancel all jobs in the batch
    for (const job of batch.jobs) {
      if (job.status === 'pending' || job.status === 'queued') {
        job.status = 'cancelled';
      } else if (job.status === 'parsing' || job.status === 'analyzing') {
        const controller = this.runningJobs.get(job.id);
        if (controller) {
          controller.abort();
          this.runningJobs.delete(job.id);
        }
        job.status = 'cancelled';
      }
    }

    batch.status = 'cancelled';
    this.updateBatchProgress(batchId);
    this.emit('batch_cancelled', batchId);

    return true;
  }

  /**
   * Get batch summary
   */
  getBatch(batchId: string): BatchSummary | undefined {
    return this.batches.get(batchId);
  }

  /**
   * Get all batches
   */
  getAllBatches(): BatchSummary[] {
    return Array.from(this.batches.values());
  }

  /**
   * Get batch progress
   */
  getProgress(batchId: string): BatchProgress | undefined {
    const batch = this.batches.get(batchId);
    if (!batch) return undefined;
    return batch.progress;
  }

  /**
   * Process the queue
   */
  private processQueue(): void {
    if (!this.isRunning || this.isPaused || !this.jobProcessor) return;

    // Start processing loop
    this.processingInterval = setInterval(() => {
      if (!this.isRunning || this.isPaused) return;

      const runningCount = this.runningJobs.size;
      const availableSlots = this.config.concurrency - runningCount;

      // Start new jobs if there are available slots
      for (let i = 0; i < availableSlots; i++) {
        const job = this.queue.dequeue();
        if (!job) break;

        this.processJob(job);
      }

      // Check if all batches are complete
      let allComplete = true;
      for (const batch of this.batches.values()) {
        if (batch.status === 'running' || batch.status === 'pending') {
          const hasIncomplete = batch.jobs.some(
            (j) => j.status === 'pending' || j.status === 'queued' || j.status === 'parsing' || j.status === 'analyzing'
          );
          if (!hasIncomplete) {
            this.completeBatch(batch.batchId);
          } else {
            allComplete = false;
          }
        }
      }

      if (allComplete && this.runningJobs.size === 0 && !this.queue.hasPendingJobs()) {
        this.stop();
      }
    }, 100);
  }

  /**
   * Process a single job
   */
  private async processJob(job: BatchJob): Promise<void> {
    if (!this.jobProcessor) return;

    const batch = this.batches.get(job.batchId);
    if (!batch) return;

    if (batch.status === 'pending') {
      batch.status = 'running';
      batch.startedAt = new Date().toISOString();
      this.emit('batch_started', job.batchId);
    }

    const controller = new AbortController();
    this.runningJobs.set(job.id, controller);

    job.status = 'parsing';
    job.startedAt = new Date().toISOString();
    this.emit('job_started', job.batchId, job.id);

    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Job timeout'));
        }, this.config.jobTimeout);
      });

      // Race between job processing and timeout
      const result = await Promise.race([
        this.jobProcessor(job),
        timeoutPromise,
      ]);

      job.status = 'complete';
      job.progress = 100;
      job.result = result;
      job.completedAt = new Date().toISOString();

      this.emit('job_completed', job.batchId, job.id, { result });
    } catch (error) {
      job.error = error instanceof Error ? error.message : 'Unknown error';

      if (job.retryCount < job.maxRetries && this.config.continueOnError) {
        job.retryCount++;
        job.status = 'pending';
        job.progress = 0;
        this.emit('job_retrying', job.batchId, job.id, {
          retry: job.retryCount,
          error: job.error,
        });

        // Delay before retry
        await new Promise((resolve) => setTimeout(resolve, this.config.retryDelay));
      } else {
        job.status = 'failed';
        job.completedAt = new Date().toISOString();
        this.emit('job_failed', job.batchId, job.id, { error: job.error });

        if (!this.config.continueOnError) {
          this.cancelBatch(job.batchId);
        }
      }
    } finally {
      this.runningJobs.delete(job.id);
      this.updateBatchProgress(job.batchId);
    }
  }

  /**
   * Update batch progress
   */
  private updateBatchProgress(batchId: string): void {
    const batch = this.batches.get(batchId);
    if (!batch) return;

    batch.progress = this.calculateProgress(batch.jobs);
    batch.stats = this.calculateStats(batch.jobs);
  }

  /**
   * Complete a batch
   */
  private completeBatch(batchId: string): void {
    const batch = this.batches.get(batchId);
    if (!batch) return;

    const hasFailures = batch.jobs.some((j) => j.status === 'failed');
    batch.status = hasFailures ? 'failed' : 'complete';
    batch.completedAt = new Date().toISOString();
    this.updateBatchProgress(batchId);

    this.emit(hasFailures ? 'batch_failed' : 'batch_completed', batchId, undefined, {
      stats: batch.stats,
    });
  }

  /**
   * Calculate progress for jobs
   */
  private calculateProgress(jobs: BatchJob[]): BatchProgress {
    const total = jobs.length;
    const completed = jobs.filter((j) => j.status === 'complete').length;
    const failed = jobs.filter((j) => j.status === 'failed').length;
    const cancelled = jobs.filter((j) => j.status === 'cancelled').length;
    const running = jobs.filter((j) => j.status === 'parsing' || j.status === 'analyzing').length;
    const pending = jobs.filter((j) => j.status === 'pending' || j.status === 'queued').length;

    const progress = jobs.reduce((sum, j) => sum + j.progress, 0) / total;

    // Calculate estimated time remaining
    const completedJobs = jobs.filter((j) => j.result?.duration);
    const avgDuration = completedJobs.length > 0
      ? completedJobs.reduce((sum, j) => sum + (j.result?.duration || 0), 0) / completedJobs.length
      : undefined;

    const estimatedTimeRemaining = avgDuration !== undefined
      ? calculateEstimatedTime(pending + running, avgDuration, this.config.concurrency)
      : undefined;

    return {
      batchId: jobs[0]?.batchId || '',
      totalJobs: total,
      completedJobs: completed,
      failedJobs: failed,
      cancelledJobs: cancelled,
      pendingJobs: pending,
      runningJobs: running,
      overallProgress: Math.round(progress),
      estimatedTimeRemaining,
    };
  }

  /**
   * Calculate statistics for jobs
   */
  private calculateStats(jobs: BatchJob[]): BatchStats {
    const completedJobs = jobs.filter((j) => j.status === 'complete' && j.result);

    return {
      totalVariants: completedJobs.reduce((sum, j) => sum + (j.result?.variantCount || 0), 0),
      totalClinicalFindings: completedJobs.reduce((sum, j) => sum + (j.result?.clinicalFindings || 0), 0),
      totalDrugResponses: completedJobs.reduce((sum, j) => sum + (j.result?.drugResponses || 0), 0),
      totalTraitAssociations: completedJobs.reduce((sum, j) => sum + (j.result?.traitAssociations || 0), 0),
      totalActionableFindings: completedJobs.reduce((sum, j) => sum + (j.result?.actionableFindings || 0), 0),
      averageProcessingTime: completedJobs.length > 0
        ? completedJobs.reduce((sum, j) => sum + (j.result?.duration || 0), 0) / completedJobs.length
        : 0,
      totalProcessingTime: completedJobs.reduce((sum, j) => sum + (j.result?.duration || 0), 0),
      filesProcessed: completedJobs.length,
      filesFailed: jobs.filter((j) => j.status === 'failed').length,
    };
  }

  /**
   * Update job progress
   */
  updateJobProgress(jobId: string, progress: number, message?: string): void {
    const job = this.queue.get(jobId);
    if (!job) return;

    job.progress = progress;
    if (message) job.message = message;

    if (progress >= 50 && job.status === 'parsing') {
      job.status = 'analyzing';
    }

    this.emit('job_progress', job.batchId, jobId, { progress, message });
  }

  /**
   * Get configuration
   */
  getConfig(): BatchConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<BatchConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if processor is running
   */
  isProcessorRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Check if processor is paused
   */
  isProcessorPaused(): boolean {
    return this.isPaused;
  }
}

/**
 * Create a singleton batch processor instance
 */
let defaultBatchProcessor: BatchProcessor | null = null;

export function getBatchProcessor(): BatchProcessor {
  if (!defaultBatchProcessor) {
    defaultBatchProcessor = new BatchProcessor();
  }
  return defaultBatchProcessor;
}

export function setBatchProcessor(processor: BatchProcessor): void {
  defaultBatchProcessor = processor;
}
