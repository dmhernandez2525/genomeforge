/**
 * Custom Database Types
 *
 * Type definitions for custom variant annotation databases.
 */

/**
 * Supported database file formats
 */
export type DatabaseFileFormat = 'csv' | 'tsv' | 'vcf' | 'json';

/**
 * Database field/column types
 */
export type DatabaseFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'rsid'
  | 'chromosome'
  | 'position'
  | 'genotype'
  | 'allele'
  | 'gene'
  | 'significance'
  | 'frequency';

/**
 * Database field definition
 */
export interface DatabaseField {
  /** Field name in the database */
  name: string;
  /** Display name for UI */
  displayName: string;
  /** Field data type */
  type: DatabaseFieldType;
  /** Whether this field is required */
  required: boolean;
  /** Description of the field */
  description?: string;
  /** Default value if not provided */
  defaultValue?: string | number | boolean;
  /** Validation pattern (regex) */
  pattern?: string;
  /** Allowed values for enum-like fields */
  allowedValues?: string[];
}

/**
 * Database schema definition
 */
export interface DatabaseSchema {
  /** Unique identifier for the schema */
  id: string;
  /** Schema version */
  version: string;
  /** Human-readable name */
  name: string;
  /** Description of the schema */
  description?: string;
  /** Primary key field(s) */
  primaryKey: string[];
  /** All field definitions */
  fields: DatabaseField[];
  /** Index fields for faster lookups */
  indexFields?: string[];
}

/**
 * Predefined schema types
 */
export type PredefinedSchemaType =
  | 'variant_annotation'
  | 'drug_response'
  | 'trait_association'
  | 'clinical_significance'
  | 'population_frequency'
  | 'gene_function'
  | 'custom';

/**
 * Custom database metadata
 */
export interface CustomDatabase {
  /** Unique identifier */
  id: string;
  /** Database name */
  name: string;
  /** Description */
  description?: string;
  /** Database version */
  version: string;
  /** Schema used by this database */
  schema: DatabaseSchema;
  /** Source information */
  source?: DatabaseSource;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Number of records */
  recordCount: number;
  /** File size in bytes */
  fileSize: number;
  /** Whether the database is enabled for matching */
  enabled: boolean;
  /** Priority for matching (higher = checked first) */
  priority: number;
  /** Tags for categorization */
  tags?: string[];
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Database source information
 */
export interface DatabaseSource {
  /** Source name (e.g., "ClinVar", "Custom Research") */
  name: string;
  /** Source URL */
  url?: string;
  /** Source version or release date */
  version?: string;
  /** License information */
  license?: string;
  /** Citation information */
  citation?: string;
  /** Contact information */
  contact?: string;
}

/**
 * Database record (single entry)
 */
export interface DatabaseRecord {
  /** Record identifier */
  id: string;
  /** Database ID this record belongs to */
  databaseId: string;
  /** Field values */
  data: Record<string, string | number | boolean | null>;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt?: string;
}

/**
 * Database import options
 */
export interface DatabaseImportOptions {
  /** File format (auto-detected if not specified) */
  format?: DatabaseFileFormat;
  /** Schema to use (or predefined schema type) */
  schema?: DatabaseSchema | PredefinedSchemaType;
  /** Field mapping (source field -> schema field) */
  fieldMapping?: Record<string, string>;
  /** Whether to validate all records before import */
  validateAll?: boolean;
  /** Skip invalid records instead of failing */
  skipInvalid?: boolean;
  /** Maximum number of records to import (for large files) */
  maxRecords?: number;
  /** Delimiter for CSV/TSV files */
  delimiter?: string;
  /** Whether the file has a header row */
  hasHeader?: boolean;
  /** Comment character to skip lines */
  commentChar?: string;
  /** Encoding (default UTF-8) */
  encoding?: string;
  /** Replace existing database with same name */
  replaceExisting?: boolean;
}

/**
 * Import validation result for a single record
 */
export interface RecordValidation {
  /** Row/record number */
  rowNumber: number;
  /** Whether the record is valid */
  valid: boolean;
  /** Validation errors */
  errors: FieldValidationError[];
  /** Validation warnings */
  warnings: string[];
  /** The record data (if valid) */
  data?: Record<string, string | number | boolean | null>;
}

/**
 * Field validation error
 */
export interface FieldValidationError {
  /** Field name */
  field: string;
  /** Error message */
  message: string;
  /** Invalid value */
  value: unknown;
  /** Error code */
  code: ValidationErrorCode;
}

/**
 * Validation error codes
 */
export type ValidationErrorCode =
  | 'REQUIRED_FIELD_MISSING'
  | 'INVALID_TYPE'
  | 'INVALID_FORMAT'
  | 'INVALID_VALUE'
  | 'VALUE_OUT_OF_RANGE'
  | 'PATTERN_MISMATCH'
  | 'DUPLICATE_KEY'
  | 'UNKNOWN_FIELD';

/**
 * Database import progress
 */
export interface DatabaseImportProgress {
  /** Import phase */
  phase: 'parsing' | 'validating' | 'indexing' | 'saving' | 'complete' | 'error';
  /** Total records to process */
  totalRecords: number;
  /** Records processed so far */
  processedRecords: number;
  /** Valid records */
  validRecords: number;
  /** Invalid records (skipped) */
  invalidRecords: number;
  /** Progress percentage (0-100) */
  progress: number;
  /** Current status message */
  message: string;
  /** Errors encountered */
  errors: string[];
  /** Warnings */
  warnings: string[];
}

/**
 * Database import result
 */
export interface DatabaseImportResult {
  /** Whether import was successful */
  success: boolean;
  /** Imported database (if successful) */
  database?: CustomDatabase;
  /** Import statistics */
  stats: {
    /** Total records in source file */
    totalRecords: number;
    /** Successfully imported records */
    importedRecords: number;
    /** Skipped invalid records */
    skippedRecords: number;
    /** Import duration in milliseconds */
    duration: number;
  };
  /** Validation errors (if any) */
  validationErrors?: RecordValidation[];
  /** Error message (if failed) */
  error?: string;
}

/**
 * Database query options
 */
export interface DatabaseQueryOptions {
  /** Field to query */
  field: string;
  /** Query value */
  value: string | number;
  /** Query operator */
  operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'gt' | 'lt' | 'gte' | 'lte';
  /** Case sensitive (for string queries) */
  caseSensitive?: boolean;
  /** Maximum results to return */
  limit?: number;
  /** Results offset for pagination */
  offset?: number;
  /** Sort field */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Database query result
 */
export interface DatabaseQueryResult {
  /** Matching records */
  records: DatabaseRecord[];
  /** Total matching records (before limit) */
  totalCount: number;
  /** Query execution time in milliseconds */
  executionTime: number;
}

/**
 * Database export options
 */
export interface DatabaseExportOptions {
  /** Export format */
  format: DatabaseFileFormat;
  /** Fields to include (all if not specified) */
  fields?: string[];
  /** Include header row */
  includeHeader?: boolean;
  /** Delimiter for CSV/TSV */
  delimiter?: string;
  /** Pretty print for JSON */
  prettyPrint?: boolean;
}

/**
 * Database statistics
 */
export interface DatabaseStats {
  /** Total number of databases */
  totalDatabases: number;
  /** Total records across all databases */
  totalRecords: number;
  /** Total storage used in bytes */
  totalSize: number;
  /** Databases by type */
  byType: Record<string, number>;
  /** Databases by tag */
  byTag: Record<string, number>;
}

/**
 * Database event types
 */
export type DatabaseEventType =
  | 'database_created'
  | 'database_updated'
  | 'database_deleted'
  | 'database_enabled'
  | 'database_disabled'
  | 'import_started'
  | 'import_progress'
  | 'import_completed'
  | 'import_failed'
  | 'query_executed';

/**
 * Database event
 */
export interface DatabaseEvent {
  /** Event type */
  type: DatabaseEventType;
  /** Database ID */
  databaseId?: string;
  /** Timestamp */
  timestamp: string;
  /** Event data */
  data?: Record<string, unknown>;
}

/**
 * Database event listener
 */
export type DatabaseEventListener = (event: DatabaseEvent) => void;
