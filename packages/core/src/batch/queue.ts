/**
 * Batch Processing Queue
 *
 * Priority queue for managing batch jobs.
 */

import type { BatchJob, BatchJobPriority, BatchJobStatus } from './types';

/**
 * Priority queue for batch jobs
 */
export class BatchJobQueue {
  private jobs: Map<string, BatchJob> = new Map();
  private priorityOrder: BatchJobPriority[] = ['urgent', 'high', 'normal', 'low'];

  constructor(priorityOrder?: BatchJobPriority[]) {
    if (priorityOrder) {
      this.priorityOrder = priorityOrder;
    }
  }

  /**
   * Add a job to the queue
   */
  enqueue(job: BatchJob): void {
    this.jobs.set(job.id, job);
  }

  /**
   * Get the next job to process based on priority and status
   */
  dequeue(): BatchJob | null {
    const pendingJobs = this.getPendingJobs();
    if (pendingJobs.length === 0) return null;

    // Sort by priority
    pendingJobs.sort((a, b) => {
      const priorityA = this.priorityOrder.indexOf(a.priority);
      const priorityB = this.priorityOrder.indexOf(b.priority);
      return priorityA - priorityB;
    });

    const job = pendingJobs[0];
    job.status = 'queued';
    return job;
  }

  /**
   * Get a job by ID
   */
  get(jobId: string): BatchJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Update a job
   */
  update(jobId: string, updates: Partial<BatchJob>): BatchJob | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    const updated = { ...job, ...updates };
    this.jobs.set(jobId, updated);
    return updated;
  }

  /**
   * Remove a job from the queue
   */
  remove(jobId: string): boolean {
    return this.jobs.delete(jobId);
  }

  /**
   * Get all pending jobs
   */
  getPendingJobs(): BatchJob[] {
    return Array.from(this.jobs.values()).filter(
      (job) => job.status === 'pending'
    );
  }

  /**
   * Get all jobs with a specific status
   */
  getJobsByStatus(status: BatchJobStatus): BatchJob[] {
    return Array.from(this.jobs.values()).filter((job) => job.status === status);
  }

  /**
   * Get all jobs
   */
  getAllJobs(): BatchJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.jobs.size;
  }

  /**
   * Get count of pending jobs
   */
  pendingCount(): number {
    return this.getPendingJobs().length;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.jobs.size === 0;
  }

  /**
   * Check if there are pending jobs
   */
  hasPendingJobs(): boolean {
    return this.pendingCount() > 0;
  }

  /**
   * Clear all jobs
   */
  clear(): void {
    this.jobs.clear();
  }

  /**
   * Cancel all pending jobs
   */
  cancelAllPending(): number {
    let cancelled = 0;
    for (const job of this.jobs.values()) {
      if (job.status === 'pending' || job.status === 'queued') {
        job.status = 'cancelled';
        cancelled++;
      }
    }
    return cancelled;
  }

  /**
   * Get jobs for a specific batch
   */
  getJobsByBatch(batchId: string): BatchJob[] {
    return Array.from(this.jobs.values()).filter((job) => job.batchId === batchId);
  }

  /**
   * Requeue failed jobs for retry
   */
  requeueFailedJobs(batchId?: string): number {
    let requeued = 0;
    for (const job of this.jobs.values()) {
      if (batchId && job.batchId !== batchId) continue;
      if (job.status === 'failed' && job.retryCount < job.maxRetries) {
        job.status = 'pending';
        job.retryCount++;
        job.error = undefined;
        requeued++;
      }
    }
    return requeued;
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    total: number;
    pending: number;
    queued: number;
    parsing: number;
    analyzing: number;
    complete: number;
    failed: number;
    cancelled: number;
  } {
    const jobs = Array.from(this.jobs.values());
    return {
      total: jobs.length,
      pending: jobs.filter((j) => j.status === 'pending').length,
      queued: jobs.filter((j) => j.status === 'queued').length,
      parsing: jobs.filter((j) => j.status === 'parsing').length,
      analyzing: jobs.filter((j) => j.status === 'analyzing').length,
      complete: jobs.filter((j) => j.status === 'complete').length,
      failed: jobs.filter((j) => j.status === 'failed').length,
      cancelled: jobs.filter((j) => j.status === 'cancelled').length,
    };
  }
}
