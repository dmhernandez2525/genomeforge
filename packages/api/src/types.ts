/**
 * GenomeForge API Types
 *
 * Type definitions for the GenomeForge API.
 */

/**
 * API Configuration
 */
export interface ApiConfig {
  /** Base URL for API requests (for server integrations) */
  baseUrl?: string;
  /** API key for authentication */
  apiKey?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Custom headers to include in requests */
  headers?: Record<string, string>;
  /** Enable debug logging */
  debug?: boolean;
  /** Retry configuration */
  retry?: RetryConfig;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum number of retries */
  maxRetries: number;
  /** Initial delay in milliseconds */
  initialDelay: number;
  /** Maximum delay in milliseconds */
  maxDelay: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  /** Whether the request was successful */
  success: boolean;
  /** Response data */
  data?: T;
  /** Error information if unsuccessful */
  error?: ApiError;
  /** Response metadata */
  meta?: ResponseMeta;
}

/**
 * API Error
 */
export interface ApiError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Additional error details */
  details?: Record<string, unknown>;
  /** HTTP status code */
  status?: number;
}

/**
 * Response metadata
 */
export interface ResponseMeta {
  /** Request ID for tracking */
  requestId: string;
  /** Processing time in milliseconds */
  processingTime: number;
  /** API version */
  apiVersion: string;
  /** Timestamp */
  timestamp: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  /** Page number (1-indexed) */
  page?: number;
  /** Items per page */
  limit?: number;
  /** Sort field */
  sortBy?: string;
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  /** Items for current page */
  items: T[];
  /** Total number of items */
  total: number;
  /** Current page */
  page: number;
  /** Items per page */
  limit: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there are more pages */
  hasMore: boolean;
}

/**
 * Analysis request
 */
export interface AnalysisRequest {
  /** Genome data (file content or parsed data) */
  genomeData: string | ArrayBuffer;
  /** File format hint */
  format?: 'auto' | '23andme' | 'ancestry' | 'vcf';
  /** Analysis options */
  options?: AnalysisOptions;
}

/**
 * Analysis options
 */
export interface AnalysisOptions {
  /** Include clinical findings */
  includeClinical?: boolean;
  /** Include drug responses */
  includeDrugResponses?: boolean;
  /** Include trait associations */
  includeTraits?: boolean;
  /** Include ancestry analysis */
  includeAncestry?: boolean;
  /** Minimum evidence level to include */
  minEvidenceLevel?: string;
  /** Custom databases to use */
  customDatabases?: string[];
}

/**
 * Analysis result
 */
export interface AnalysisResult {
  /** Analysis ID */
  analysisId: string;
  /** Analysis status */
  status: AnalysisStatus;
  /** Created timestamp */
  createdAt: string;
  /** Completed timestamp */
  completedAt?: string;
  /** Summary statistics */
  summary?: AnalysisSummary;
  /** Detailed results (if complete) */
  results?: AnalysisResultData;
  /** Progress percentage */
  progress?: number;
  /** Current processing stage */
  stage?: string;
}

/**
 * Analysis status
 */
export type AnalysisStatus =
  | 'pending'
  | 'parsing'
  | 'analyzing'
  | 'complete'
  | 'failed'
  | 'cancelled';

/**
 * Analysis summary
 */
export interface AnalysisSummary {
  /** Total variants analyzed */
  totalVariants: number;
  /** Matched variants */
  matchedVariants: number;
  /** Clinical findings count */
  clinicalFindings: number;
  /** Drug responses count */
  drugResponses: number;
  /** Trait associations count */
  traitAssociations: number;
  /** File format detected */
  fileFormat: string;
  /** Genome build detected */
  genomeBuild: string;
}

/**
 * Full analysis result data
 */
export interface AnalysisResultData {
  /** Clinical findings */
  clinicalFindings: ClinicalFindingDto[];
  /** Drug responses */
  drugResponses: DrugResponseDto[];
  /** Trait associations */
  traitAssociations: TraitAssociationDto[];
  /** Ancestry information */
  ancestry?: AncestryDto;
}

/**
 * Clinical finding DTO
 */
export interface ClinicalFindingDto {
  /** Finding ID */
  id: string;
  /** RS ID */
  rsid: string;
  /** Gene symbol */
  gene?: string;
  /** Condition name */
  condition: string;
  /** Clinical significance */
  significance: string;
  /** Risk level */
  riskLevel: string;
  /** Description */
  description: string;
  /** Evidence level */
  evidenceLevel: string;
  /** Source database */
  source: string;
}

/**
 * Drug response DTO
 */
export interface DrugResponseDto {
  /** Response ID */
  id: string;
  /** RS ID */
  rsid: string;
  /** Gene symbol */
  gene: string;
  /** Drug name */
  drugName: string;
  /** Metabolizer phenotype */
  phenotype: string;
  /** Recommendation */
  recommendation: string;
  /** Dosing guidance */
  dosingGuidance?: string;
  /** Evidence level */
  evidenceLevel: string;
}

/**
 * Trait association DTO
 */
export interface TraitAssociationDto {
  /** Association ID */
  id: string;
  /** RS ID */
  rsid: string;
  /** Gene symbol */
  gene?: string;
  /** Trait name */
  traitName: string;
  /** Category */
  category: string;
  /** Effect description */
  effect: string;
  /** Confidence level */
  confidence: string;
}

/**
 * Ancestry DTO
 */
export interface AncestryDto {
  /** Population breakdown */
  populations: {
    population: string;
    percentage: number;
  }[];
  /** Maternal haplogroup */
  maternalHaplogroup?: string;
  /** Paternal haplogroup */
  paternalHaplogroup?: string;
}

/**
 * Report request
 */
export interface ReportRequest {
  /** Analysis ID to generate report from */
  analysisId: string;
  /** Report template */
  template?: string;
  /** Report format */
  format?: 'html' | 'pdf' | 'json' | 'markdown';
  /** Custom configuration overrides */
  config?: Record<string, unknown>;
}

/**
 * Report result
 */
export interface ReportResult {
  /** Report ID */
  reportId: string;
  /** Report format */
  format: string;
  /** Report content (for text formats) */
  content?: string;
  /** Download URL (for binary formats) */
  downloadUrl?: string;
  /** Generated timestamp */
  generatedAt: string;
}

/**
 * Database query
 */
export interface DatabaseQuery {
  /** RS ID to look up */
  rsid?: string;
  /** Gene symbol to search */
  gene?: string;
  /** Condition to search */
  condition?: string;
  /** Drug name to search */
  drug?: string;
  /** Databases to search */
  databases?: string[];
}

/**
 * Database result
 */
export interface DatabaseResult {
  /** Query parameters */
  query: DatabaseQuery;
  /** Results from each database */
  results: {
    database: string;
    matches: DatabaseMatch[];
  }[];
  /** Total matches */
  totalMatches: number;
}

/**
 * Database match
 */
export interface DatabaseMatch {
  /** Match type */
  type: 'clinical' | 'drug' | 'trait' | 'frequency';
  /** Match data */
  data: Record<string, unknown>;
  /** Match score */
  score?: number;
}

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  /** Webhook URL */
  url: string;
  /** Events to trigger webhook */
  events: WebhookEvent[];
  /** Secret for signature verification */
  secret?: string;
  /** Whether webhook is active */
  active: boolean;
}

/**
 * Webhook events
 */
export type WebhookEvent =
  | 'analysis.started'
  | 'analysis.progress'
  | 'analysis.completed'
  | 'analysis.failed'
  | 'report.generated';

/**
 * Webhook payload
 */
export interface WebhookPayload {
  /** Event type */
  event: WebhookEvent;
  /** Event timestamp */
  timestamp: string;
  /** Event data */
  data: Record<string, unknown>;
  /** Signature for verification */
  signature?: string;
}

/**
 * Rate limit info
 */
export interface RateLimitInfo {
  /** Requests remaining in current window */
  remaining: number;
  /** Total requests allowed per window */
  limit: number;
  /** Window reset timestamp */
  resetAt: string;
}

/**
 * API event types for local usage
 */
export type ApiEventType =
  | 'request_start'
  | 'request_complete'
  | 'request_error'
  | 'analysis_progress'
  | 'rate_limit_warning';

/**
 * API event
 */
export interface ApiEvent {
  /** Event type */
  type: ApiEventType;
  /** Timestamp */
  timestamp: string;
  /** Event data */
  data?: Record<string, unknown>;
}

/**
 * API event listener
 */
export type ApiEventListener = (event: ApiEvent) => void;
