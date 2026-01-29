/**
 * GenomeForge API Client
 *
 * Client SDK for interacting with GenomeForge services.
 */

import type {
  ApiConfig,
  ApiResponse,
  ApiError,
  ResponseMeta,
  AnalysisRequest,
  AnalysisResult,
  AnalysisOptions,
  ReportRequest,
  ReportResult,
  DatabaseQuery,
  DatabaseResult,
  PaginationParams,
  PaginatedResponse,
  RateLimitInfo,
  ApiEvent,
  ApiEventType,
  ApiEventListener,
} from './types';

/**
 * Default API configuration
 */
const DEFAULT_CONFIG: Required<Omit<ApiConfig, 'apiKey' | 'baseUrl'>> = {
  timeout: 30000,
  headers: {},
  debug: false,
  retry: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
  },
};

/**
 * GenomeForge API Client
 */
export class GenomeForgeClient {
  private config: ApiConfig & typeof DEFAULT_CONFIG;
  private listeners: Set<ApiEventListener> = new Set();
  private rateLimitInfo: RateLimitInfo | null = null;

  constructor(config: ApiConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Add an event listener
   */
  addEventListener(listener: ApiEventListener): void {
    this.listeners.add(listener);
  }

  /**
   * Remove an event listener
   */
  removeEventListener(listener: ApiEventListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Emit an event
   */
  private emit(type: ApiEventType, data?: Record<string, unknown>): void {
    const event: ApiEvent = {
      type,
      timestamp: new Date().toISOString(),
      data,
    };

    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('API event listener error:', error);
      }
    }
  }

  /**
   * Log debug message
   */
  private debug(message: string, data?: unknown): void {
    if (this.config.debug) {
      console.log(`[GenomeForge API] ${message}`, data || '');
    }
  }

  /**
   * Get current rate limit info
   */
  getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Create a response wrapper
   */
  private createResponse<T>(
    success: boolean,
    data?: T,
    error?: ApiError,
    processingTime?: number
  ): ApiResponse<T> {
    const meta: ResponseMeta = {
      requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      processingTime: processingTime || 0,
      apiVersion: '1.0.0',
      timestamp: new Date().toISOString(),
    };

    return { success, data, error, meta };
  }

  /**
   * Create an error response
   */
  private createError(
    code: string,
    message: string,
    status?: number,
    details?: Record<string, unknown>
  ): ApiError {
    return { code, message, status, details };
  }

  // ==================== Analysis Methods ====================

  /**
   * Start a new analysis
   */
  async startAnalysis(request: AnalysisRequest): Promise<ApiResponse<AnalysisResult>> {
    const startTime = Date.now();
    this.emit('request_start', { method: 'startAnalysis' });
    this.debug('Starting analysis', { format: request.format });

    try {
      // In a real implementation, this would call the backend API
      // For now, we simulate local processing using the core library
      const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      const result: AnalysisResult = {
        analysisId,
        status: 'pending',
        createdAt: new Date().toISOString(),
        progress: 0,
        stage: 'initializing',
      };

      this.emit('request_complete', {
        method: 'startAnalysis',
        analysisId,
        duration: Date.now() - startTime,
      });

      return this.createResponse(true, result, undefined, Date.now() - startTime);
    } catch (error) {
      const apiError = this.createError(
        'ANALYSIS_START_FAILED',
        error instanceof Error ? error.message : 'Failed to start analysis',
        500
      );
      this.emit('request_error', { method: 'startAnalysis', error: apiError });
      return this.createResponse<AnalysisResult>(false, undefined, apiError, Date.now() - startTime);
    }
  }

  /**
   * Get analysis status
   */
  async getAnalysis(analysisId: string): Promise<ApiResponse<AnalysisResult>> {
    const startTime = Date.now();
    this.emit('request_start', { method: 'getAnalysis', analysisId });
    this.debug('Getting analysis', { analysisId });

    try {
      // Simulated response
      const result: AnalysisResult = {
        analysisId,
        status: 'complete',
        createdAt: new Date(Date.now() - 60000).toISOString(),
        completedAt: new Date().toISOString(),
        progress: 100,
        stage: 'complete',
        summary: {
          totalVariants: 650000,
          matchedVariants: 12500,
          clinicalFindings: 25,
          drugResponses: 18,
          traitAssociations: 85,
          fileFormat: '23andme',
          genomeBuild: 'GRCh37',
        },
      };

      return this.createResponse(true, result, undefined, Date.now() - startTime);
    } catch (error) {
      const apiError = this.createError(
        'ANALYSIS_NOT_FOUND',
        `Analysis not found: ${analysisId}`,
        404
      );
      return this.createResponse<AnalysisResult>(false, undefined, apiError, Date.now() - startTime);
    }
  }

  /**
   * Get analysis results
   */
  async getAnalysisResults(
    analysisId: string,
    options?: {
      includeClinical?: boolean;
      includeDrugResponses?: boolean;
      includeTraits?: boolean;
      includeAncestry?: boolean;
    }
  ): Promise<ApiResponse<AnalysisResult>> {
    const startTime = Date.now();
    this.emit('request_start', { method: 'getAnalysisResults', analysisId });

    try {
      const result: AnalysisResult = {
        analysisId,
        status: 'complete',
        createdAt: new Date(Date.now() - 60000).toISOString(),
        completedAt: new Date().toISOString(),
        progress: 100,
        summary: {
          totalVariants: 650000,
          matchedVariants: 12500,
          clinicalFindings: 25,
          drugResponses: 18,
          traitAssociations: 85,
          fileFormat: '23andme',
          genomeBuild: 'GRCh37',
        },
        results: {
          clinicalFindings: options?.includeClinical !== false ? [] : [],
          drugResponses: options?.includeDrugResponses !== false ? [] : [],
          traitAssociations: options?.includeTraits !== false ? [] : [],
          ancestry: options?.includeAncestry !== false ? {
            populations: [
              { population: 'European', percentage: 65.2 },
              { population: 'East Asian', percentage: 20.1 },
              { population: 'African', percentage: 10.5 },
              { population: 'Native American', percentage: 4.2 },
            ],
          } : undefined,
        },
      };

      return this.createResponse(true, result, undefined, Date.now() - startTime);
    } catch (error) {
      const apiError = this.createError(
        'RESULTS_FETCH_FAILED',
        error instanceof Error ? error.message : 'Failed to fetch results',
        500
      );
      return this.createResponse<AnalysisResult>(false, undefined, apiError, Date.now() - startTime);
    }
  }

  /**
   * Cancel an analysis
   */
  async cancelAnalysis(analysisId: string): Promise<ApiResponse<{ cancelled: boolean }>> {
    const startTime = Date.now();
    this.emit('request_start', { method: 'cancelAnalysis', analysisId });

    try {
      return this.createResponse(true, { cancelled: true }, undefined, Date.now() - startTime);
    } catch (error) {
      const apiError = this.createError(
        'CANCEL_FAILED',
        'Failed to cancel analysis',
        500
      );
      return this.createResponse<{ cancelled: boolean }>(false, undefined, apiError, Date.now() - startTime);
    }
  }

  /**
   * List analyses
   */
  async listAnalyses(
    pagination?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<AnalysisResult>>> {
    const startTime = Date.now();
    this.emit('request_start', { method: 'listAnalyses' });

    try {
      const response: PaginatedResponse<AnalysisResult> = {
        items: [],
        total: 0,
        page: pagination?.page || 1,
        limit: pagination?.limit || 20,
        totalPages: 0,
        hasMore: false,
      };

      return this.createResponse(true, response, undefined, Date.now() - startTime);
    } catch (error) {
      const apiError = this.createError(
        'LIST_FAILED',
        'Failed to list analyses',
        500
      );
      return this.createResponse<PaginatedResponse<AnalysisResult>>(false, undefined, apiError, Date.now() - startTime);
    }
  }

  // ==================== Report Methods ====================

  /**
   * Generate a report
   */
  async generateReport(request: ReportRequest): Promise<ApiResponse<ReportResult>> {
    const startTime = Date.now();
    this.emit('request_start', { method: 'generateReport', analysisId: request.analysisId });

    try {
      const result: ReportResult = {
        reportId: `report_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        format: request.format || 'html',
        content: '<html><body><h1>Genetic Analysis Report</h1></body></html>',
        generatedAt: new Date().toISOString(),
      };

      return this.createResponse(true, result, undefined, Date.now() - startTime);
    } catch (error) {
      const apiError = this.createError(
        'REPORT_GENERATION_FAILED',
        'Failed to generate report',
        500
      );
      return this.createResponse<ReportResult>(false, undefined, apiError, Date.now() - startTime);
    }
  }

  /**
   * Get a generated report
   */
  async getReport(reportId: string): Promise<ApiResponse<ReportResult>> {
    const startTime = Date.now();
    this.emit('request_start', { method: 'getReport', reportId });

    try {
      const result: ReportResult = {
        reportId,
        format: 'html',
        content: '<html><body><h1>Genetic Analysis Report</h1></body></html>',
        generatedAt: new Date().toISOString(),
      };

      return this.createResponse(true, result, undefined, Date.now() - startTime);
    } catch (error) {
      const apiError = this.createError(
        'REPORT_NOT_FOUND',
        `Report not found: ${reportId}`,
        404
      );
      return this.createResponse<ReportResult>(false, undefined, apiError, Date.now() - startTime);
    }
  }

  // ==================== Database Methods ====================

  /**
   * Query databases
   */
  async queryDatabases(query: DatabaseQuery): Promise<ApiResponse<DatabaseResult>> {
    const startTime = Date.now();
    this.emit('request_start', { method: 'queryDatabases', query });

    try {
      const result: DatabaseResult = {
        query,
        results: [],
        totalMatches: 0,
      };

      return this.createResponse(true, result, undefined, Date.now() - startTime);
    } catch (error) {
      const apiError = this.createError(
        'QUERY_FAILED',
        'Database query failed',
        500
      );
      return this.createResponse<DatabaseResult>(false, undefined, apiError, Date.now() - startTime);
    }
  }

  /**
   * Lookup variant by RS ID
   */
  async lookupVariant(rsid: string): Promise<ApiResponse<DatabaseResult>> {
    return this.queryDatabases({ rsid });
  }

  /**
   * Search by gene
   */
  async searchByGene(gene: string): Promise<ApiResponse<DatabaseResult>> {
    return this.queryDatabases({ gene });
  }

  /**
   * Search by drug
   */
  async searchByDrug(drug: string): Promise<ApiResponse<DatabaseResult>> {
    return this.queryDatabases({ drug });
  }

  // ==================== Utility Methods ====================

  /**
   * Health check
   */
  async healthCheck(): Promise<ApiResponse<{ healthy: boolean; version: string }>> {
    const startTime = Date.now();

    try {
      return this.createResponse(
        true,
        { healthy: true, version: '1.0.0' },
        undefined,
        Date.now() - startTime
      );
    } catch (error) {
      return this.createResponse<{ healthy: boolean; version: string }>(
        false,
        undefined,
        this.createError('HEALTH_CHECK_FAILED', 'Service unhealthy', 503),
        Date.now() - startTime
      );
    }
  }

  /**
   * Get API version info
   */
  async getVersion(): Promise<ApiResponse<{
    version: string;
    apiVersion: string;
    buildDate: string;
  }>> {
    return this.createResponse(
      true,
      {
        version: '0.1.0',
        apiVersion: '1.0.0',
        buildDate: '2024-01-01',
      },
      undefined,
      0
    );
  }
}

/**
 * Create a new GenomeForge client
 */
export function createClient(config?: ApiConfig): GenomeForgeClient {
  return new GenomeForgeClient(config);
}

/**
 * Default client instance
 */
let defaultClient: GenomeForgeClient | null = null;

/**
 * Get the default client instance
 */
export function getClient(): GenomeForgeClient {
  if (!defaultClient) {
    defaultClient = new GenomeForgeClient();
  }
  return defaultClient;
}

/**
 * Set the default client instance
 */
export function setClient(client: GenomeForgeClient): void {
  defaultClient = client;
}
