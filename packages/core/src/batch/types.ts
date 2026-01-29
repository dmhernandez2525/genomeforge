/**
 * Batch Processing Types
 */

/**
 * Status of a batch job
 */
export type BatchJobStatus =
  | 'pending'
  | 'queued'
  | 'parsing'
  | 'analyzing'
  | 'complete'
  | 'failed'
  | 'cancelled';

/**
 * Priority levels for batch jobs
 */
export type BatchJobPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Individual job in a batch
 */
export interface BatchJob {
  id: string;
  batchId: string;
  filename: string;
  filePath: string;
  fileSize: number;
  status: BatchJobStatus;
  priority: BatchJobPriority;
  progress: number;
  message?: string;
  error?: string;
  result?: BatchJobResult;
  startedAt?: string;
  completedAt?: string;
  retryCount: number;
  maxRetries: number;
}

/**
 * Result of a completed batch job
 */
export interface BatchJobResult {
  variantCount: number;
  clinicalFindings: number;
  drugResponses: number;
  traitAssociations: number;
  actionableFindings: number;
  analysisId: string;
  duration: number;
}

/**
 * Batch configuration
 */
export interface BatchConfig {
  /** Maximum concurrent jobs */
  concurrency: number;
  /** Maximum retries per job */
  maxRetries: number;
  /** Retry delay in milliseconds */
  retryDelay: number;
  /** Timeout per job in milliseconds */
  jobTimeout: number;
  /** Whether to continue on error */
  continueOnError: boolean;
  /** Priority order */
  priorityOrder: BatchJobPriority[];
}

/**
 * Batch progress information
 */
export interface BatchProgress {
  batchId: string;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  cancelledJobs: number;
  pendingJobs: number;
  runningJobs: number;
  overallProgress: number;
  estimatedTimeRemaining?: number;
  startedAt?: string;
  completedAt?: string;
}

/**
 * Batch summary
 */
export interface BatchSummary {
  batchId: string;
  name: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  status: BatchStatus;
  progress: BatchProgress;
  jobs: BatchJob[];
  config: BatchConfig;
  stats: BatchStats;
}

/**
 * Overall batch status
 */
export type BatchStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'complete'
  | 'failed'
  | 'cancelled';

/**
 * Batch statistics
 */
export interface BatchStats {
  totalVariants: number;
  totalClinicalFindings: number;
  totalDrugResponses: number;
  totalTraitAssociations: number;
  totalActionableFindings: number;
  averageProcessingTime: number;
  totalProcessingTime: number;
  filesProcessed: number;
  filesFailed: number;
}

/**
 * Event types for batch processing
 */
export type BatchEventType =
  | 'batch_started'
  | 'batch_completed'
  | 'batch_failed'
  | 'batch_paused'
  | 'batch_resumed'
  | 'batch_cancelled'
  | 'job_started'
  | 'job_progress'
  | 'job_completed'
  | 'job_failed'
  | 'job_retrying'
  | 'job_cancelled';

/**
 * Batch event
 */
export interface BatchEvent {
  type: BatchEventType;
  batchId: string;
  jobId?: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

/**
 * Batch event listener
 */
export type BatchEventListener = (event: BatchEvent) => void;

/**
 * File input for batch processing
 */
export interface BatchFileInput {
  path: string;
  filename: string;
  size?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Options for creating a batch
 */
export interface CreateBatchOptions {
  name?: string;
  priority?: BatchJobPriority;
  config?: Partial<BatchConfig>;
}
