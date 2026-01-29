/**
 * Database Importer
 *
 * Import custom databases from various file formats.
 */

import type {
  DatabaseFileFormat,
  DatabaseSchema,
  DatabaseImportOptions,
  DatabaseImportProgress,
  DatabaseImportResult,
  CustomDatabase,
  PredefinedSchemaType,
} from './types';
import { getPredefinedSchema } from './schemas';
import { validateRecords, checkDuplicateKeys, autoDetectSchema, getValidationSummary } from './validator';

/**
 * Progress callback type
 */
export type ImportProgressCallback = (progress: DatabaseImportProgress) => void;

/**
 * Detect file format from content or extension
 */
export function detectFileFormat(
  content: string,
  filename?: string
): DatabaseFileFormat {
  // Check extension first
  if (filename) {
    const ext = filename.toLowerCase().split('.').pop();
    if (ext === 'csv') return 'csv';
    if (ext === 'tsv' || ext === 'txt') return 'tsv';
    if (ext === 'vcf') return 'vcf';
    if (ext === 'json') return 'json';
  }

  // Try to detect from content
  const firstLine = content.trim().split('\n')[0];

  // Check for JSON
  if (content.trim().startsWith('[') || content.trim().startsWith('{')) {
    return 'json';
  }

  // Check for VCF
  if (firstLine.startsWith('##fileformat=VCF') || firstLine.startsWith('#CHROM')) {
    return 'vcf';
  }

  // Check delimiter
  if (firstLine.includes('\t')) {
    return 'tsv';
  }

  return 'csv';
}

/**
 * Parse CSV/TSV content into records
 */
export function parseDelimited(
  content: string,
  options: {
    delimiter?: string;
    hasHeader?: boolean;
    commentChar?: string;
  } = {}
): { headers: string[]; records: Record<string, string>[] } {
  const delimiter = options.delimiter || ',';
  const hasHeader = options.hasHeader !== false;
  const commentChar = options.commentChar || '#';

  const lines = content.split(/\r?\n/).filter((line) => {
    const trimmed = line.trim();
    return trimmed && !trimmed.startsWith(commentChar);
  });

  if (lines.length === 0) {
    return { headers: [], records: [] };
  }

  // Parse header
  let headers: string[];
  let dataStartIndex: number;

  if (hasHeader) {
    headers = parseDelimitedLine(lines[0], delimiter);
    dataStartIndex = 1;
  } else {
    // Generate column names
    const firstRow = parseDelimitedLine(lines[0], delimiter);
    headers = firstRow.map((_, i) => `column_${i + 1}`);
    dataStartIndex = 0;
  }

  // Parse records
  const records: Record<string, string>[] = [];
  for (let i = dataStartIndex; i < lines.length; i++) {
    const values = parseDelimitedLine(lines[i], delimiter);
    const record: Record<string, string> = {};

    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = values[j] || '';
    }

    records.push(record);
  }

  return { headers, records };
}

/**
 * Parse a single delimited line handling quoted values
 */
function parseDelimitedLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

/**
 * Parse JSON content into records
 */
export function parseJSON(
  content: string
): Record<string, string | number | boolean | null>[] {
  const parsed = JSON.parse(content);

  if (Array.isArray(parsed)) {
    return parsed;
  }

  // If it's an object with a data array
  if (parsed.data && Array.isArray(parsed.data)) {
    return parsed.data;
  }

  // If it's an object with records array
  if (parsed.records && Array.isArray(parsed.records)) {
    return parsed.records;
  }

  // Wrap single object in array
  return [parsed];
}

/**
 * Parse VCF content into records
 */
export function parseVCF(
  content: string
): { headers: string[]; records: Record<string, string>[] } {
  const lines = content.split(/\r?\n/);
  const records: Record<string, string>[] = [];
  let headers: string[] = [];
  let infoFields: string[] = [];

  for (const line of lines) {
    if (line.startsWith('##INFO=')) {
      // Extract INFO field names
      const match = line.match(/ID=([^,]+)/);
      if (match) {
        infoFields.push(match[1]);
      }
    } else if (line.startsWith('#CHROM')) {
      // Parse header line
      headers = line.substring(1).split('\t');
    } else if (line && !line.startsWith('#')) {
      // Parse data line
      const values = line.split('\t');
      const record: Record<string, string> = {};

      for (let i = 0; i < headers.length; i++) {
        record[headers[i]] = values[i] || '';
      }

      // Parse INFO field into separate columns
      if (record.INFO) {
        const infoPairs = record.INFO.split(';');
        for (const pair of infoPairs) {
          const [key, value] = pair.split('=');
          if (key && value) {
            record[`INFO_${key}`] = value;
          }
        }
      }

      // Generate rsid from ID if available
      if (record.ID && record.ID !== '.') {
        record.rsid = record.ID;
      }

      // Map standard VCF columns
      if (record.CHROM) {
        record.chromosome = record.CHROM.replace(/^chr/i, '');
      }
      if (record.POS) {
        record.position = record.POS;
      }
      if (record.REF) {
        record.refAllele = record.REF;
      }
      if (record.ALT) {
        record.altAllele = record.ALT;
      }

      records.push(record);
    }
  }

  return { headers, records };
}

/**
 * Import database from content
 */
export async function importDatabase(
  content: string,
  options: DatabaseImportOptions & {
    name: string;
    filename?: string;
    onProgress?: ImportProgressCallback;
  }
): Promise<DatabaseImportResult> {
  const startTime = Date.now();
  const progress: DatabaseImportProgress = {
    phase: 'parsing',
    totalRecords: 0,
    processedRecords: 0,
    validRecords: 0,
    invalidRecords: 0,
    progress: 0,
    message: 'Starting import...',
    errors: [],
    warnings: [],
  };

  const updateProgress = (updates: Partial<DatabaseImportProgress>) => {
    Object.assign(progress, updates);
    if (options.onProgress) {
      options.onProgress({ ...progress });
    }
  };

  try {
    // Detect format
    const format = options.format || detectFileFormat(content, options.filename);
    updateProgress({ message: `Detected format: ${format.toUpperCase()}` });

    // Parse content
    let records: Record<string, string | number | boolean | null>[];

    if (format === 'json') {
      records = parseJSON(content);
    } else if (format === 'vcf') {
      const result = parseVCF(content);
      records = result.records;
    } else {
      const delimiter = format === 'tsv' ? '\t' : (options.delimiter || ',');
      const result = parseDelimited(content, {
        delimiter,
        hasHeader: options.hasHeader,
        commentChar: options.commentChar,
      });
      records = result.records;
    }

    // Check max records limit
    if (options.maxRecords && records.length > options.maxRecords) {
      records = records.slice(0, options.maxRecords);
      progress.warnings.push(`Limited to ${options.maxRecords} records`);
    }

    updateProgress({
      phase: 'validating',
      totalRecords: records.length,
      message: `Validating ${records.length} records...`,
    });

    // Get schema
    let schema: DatabaseSchema;
    if (options.schema) {
      if (typeof options.schema === 'string') {
        const predefined = getPredefinedSchema(options.schema as PredefinedSchemaType);
        if (!predefined) {
          schema = autoDetectSchema(records, { name: options.name });
        } else {
          schema = predefined;
        }
      } else {
        schema = options.schema;
      }
    } else {
      // Auto-detect schema
      schema = autoDetectSchema(records, { name: options.name });
      progress.warnings.push('Schema auto-detected from data');
    }

    // Validate records
    const validationOptions = {
      fieldMapping: options.fieldMapping,
      onProgress: (processed: number, total: number) => {
        updateProgress({
          processedRecords: processed,
          progress: Math.round((processed / total) * 50),
          message: `Validating record ${processed} of ${total}...`,
        });
      },
    };

    const validations = validateRecords(records, schema, validationOptions);

    // Check for duplicates
    const duplicateCheck = checkDuplicateKeys(validations, schema);
    if (duplicateCheck.hasDuplicates) {
      const dupCount = duplicateCheck.duplicates.size;
      progress.warnings.push(`Found ${dupCount} duplicate primary key(s)`);
    }

    // Get validation summary
    const summary = getValidationSummary(validations);
    updateProgress({
      validRecords: summary.validRecords,
      invalidRecords: summary.invalidRecords,
      progress: 60,
    });

    // Handle invalid records
    if (summary.invalidRecords > 0) {
      if (!options.skipInvalid) {
        const invalidSample = validations
          .filter((v) => !v.valid)
          .slice(0, 5)
          .map((v) => `Row ${v.rowNumber}: ${v.errors.map((e) => e.message).join(', ')}`);

        return {
          success: false,
          stats: {
            totalRecords: records.length,
            importedRecords: 0,
            skippedRecords: summary.invalidRecords,
            duration: Date.now() - startTime,
          },
          validationErrors: validations.filter((v) => !v.valid).slice(0, 100),
          error: `Validation failed: ${summary.invalidRecords} invalid records. First errors: ${invalidSample.join('; ')}`,
        };
      }

      progress.warnings.push(`Skipped ${summary.invalidRecords} invalid records`);
    }

    // Get valid records only
    const validRecordData = validations
      .filter((v) => v.valid && v.data)
      .map((v) => v.data!);

    updateProgress({
      phase: 'indexing',
      progress: 70,
      message: 'Building indexes...',
    });

    // Create database object
    const database: CustomDatabase = {
      id: `db_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      name: options.name,
      description: `Imported from ${options.filename || 'file'}`,
      version: '1.0.0',
      schema,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recordCount: validRecordData.length,
      fileSize: new TextEncoder().encode(content).length,
      enabled: true,
      priority: 0,
    };

    updateProgress({
      phase: 'saving',
      progress: 90,
      message: 'Saving database...',
    });

    // Note: Actual storage is handled by the DatabaseManager
    // This importer just prepares the data

    updateProgress({
      phase: 'complete',
      progress: 100,
      message: `Successfully imported ${validRecordData.length} records`,
    });

    return {
      success: true,
      database,
      stats: {
        totalRecords: records.length,
        importedRecords: validRecordData.length,
        skippedRecords: summary.invalidRecords,
        duration: Date.now() - startTime,
      },
    };
  } catch (error) {
    updateProgress({
      phase: 'error',
      message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });

    return {
      success: false,
      stats: {
        totalRecords: progress.totalRecords,
        importedRecords: 0,
        skippedRecords: 0,
        duration: Date.now() - startTime,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validate import options
 */
export function validateImportOptions(options: DatabaseImportOptions): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (options.format && !['csv', 'tsv', 'vcf', 'json'].includes(options.format)) {
    errors.push(`Invalid format: ${options.format}`);
  }

  if (options.maxRecords !== undefined && options.maxRecords < 1) {
    errors.push('maxRecords must be at least 1');
  }

  if (options.delimiter && options.delimiter.length > 1) {
    errors.push('Delimiter must be a single character');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Preview import without actually importing
 */
export async function previewImport(
  content: string,
  options: DatabaseImportOptions & {
    filename?: string;
    previewRows?: number;
  } = {}
): Promise<{
  format: DatabaseFileFormat;
  headers: string[];
  rowCount: number;
  sampleRows: Record<string, string | number | boolean | null>[];
  inferredSchema: DatabaseSchema;
  warnings: string[];
}> {
  const format = options.format || detectFileFormat(content, options.filename);
  const previewRows = options.previewRows || 10;
  const warnings: string[] = [];

  let records: Record<string, string | number | boolean | null>[];
  let headers: string[] = [];

  if (format === 'json') {
    records = parseJSON(content);
    if (records.length > 0) {
      headers = Object.keys(records[0]);
    }
  } else if (format === 'vcf') {
    const result = parseVCF(content);
    records = result.records;
    headers = result.headers;
  } else {
    const delimiter = format === 'tsv' ? '\t' : (options.delimiter || ',');
    const result = parseDelimited(content, {
      delimiter,
      hasHeader: options.hasHeader,
      commentChar: options.commentChar,
    });
    records = result.records;
    headers = result.headers;
  }

  const inferredSchema = autoDetectSchema(records, {
    sampleSize: Math.min(100, records.length),
  });

  return {
    format,
    headers,
    rowCount: records.length,
    sampleRows: records.slice(0, previewRows),
    inferredSchema,
    warnings,
  };
}
