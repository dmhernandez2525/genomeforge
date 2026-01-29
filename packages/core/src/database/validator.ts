/**
 * Database Validator
 *
 * Validates database records against schema definitions.
 */

import type {
  DatabaseSchema,
  DatabaseField,
  DatabaseFieldType,
  RecordValidation,
  FieldValidationError,
  ValidationErrorCode,
} from './types';

/**
 * Validation patterns for different field types
 */
const TYPE_PATTERNS: Record<DatabaseFieldType, RegExp | null> = {
  string: null,
  number: /^-?\d*\.?\d+$/,
  boolean: /^(true|false|1|0|yes|no)$/i,
  rsid: /^rs\d+$/,
  chromosome: /^(1[0-9]|2[0-2]|[1-9]|X|Y|MT|chr(?:1[0-9]|2[0-2]|[1-9]|X|Y|M))$/i,
  position: /^\d+$/,
  genotype: /^[ACGT]{1,2}$/i,
  allele: /^[ACGT]+$/i,
  gene: /^[A-Z][A-Z0-9\-]+$/i,
  significance: /^(pathogenic|likely_pathogenic|uncertain_significance|likely_benign|benign|risk_factor|protective|drug_response|conflicting)$/i,
  frequency: /^(0(\.\d+)?|1(\.0+)?)$/,
};

/**
 * Convert string value to typed value based on field type
 */
export function convertValue(
  value: string | number | boolean | null | undefined,
  fieldType: DatabaseFieldType
): string | number | boolean | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const stringValue = String(value).trim();

  switch (fieldType) {
    case 'number':
    case 'position':
    case 'frequency':
      const num = parseFloat(stringValue);
      return isNaN(num) ? null : num;

    case 'boolean':
      const lower = stringValue.toLowerCase();
      if (lower === 'true' || lower === '1' || lower === 'yes') return true;
      if (lower === 'false' || lower === '0' || lower === 'no') return false;
      return null;

    case 'rsid':
      return stringValue.toLowerCase();

    case 'chromosome':
      const chr = stringValue.replace(/^chr/i, '').toUpperCase();
      return chr === 'M' ? 'MT' : chr;

    case 'genotype':
    case 'allele':
      return stringValue.toUpperCase();

    case 'gene':
      return stringValue.toUpperCase();

    case 'significance':
      return stringValue.toLowerCase().replace(/\s+/g, '_');

    default:
      return stringValue;
  }
}

/**
 * Validate a single field value
 */
export function validateField(
  value: string | number | boolean | null | undefined,
  field: DatabaseField
): { valid: boolean; error?: FieldValidationError; convertedValue: string | number | boolean | null } {
  // Check required
  if (field.required && (value === null || value === undefined || value === '')) {
    return {
      valid: false,
      error: {
        field: field.name,
        message: `Required field '${field.displayName}' is missing`,
        value,
        code: 'REQUIRED_FIELD_MISSING',
      },
      convertedValue: null,
    };
  }

  // Allow null/empty for non-required fields
  if (value === null || value === undefined || value === '') {
    return { valid: true, convertedValue: field.defaultValue ?? null };
  }

  const stringValue = String(value).trim();
  const convertedValue = convertValue(stringValue, field.type);

  // Check type pattern
  const pattern = TYPE_PATTERNS[field.type];
  if (pattern && !pattern.test(stringValue)) {
    return {
      valid: false,
      error: {
        field: field.name,
        message: `Invalid ${field.type} format for field '${field.displayName}'`,
        value: stringValue,
        code: 'INVALID_FORMAT',
      },
      convertedValue: null,
    };
  }

  // Check custom pattern
  if (field.pattern) {
    const customPattern = new RegExp(field.pattern, 'i');
    if (!customPattern.test(stringValue)) {
      return {
        valid: false,
        error: {
          field: field.name,
          message: `Value does not match expected pattern for '${field.displayName}'`,
          value: stringValue,
          code: 'PATTERN_MISMATCH',
        },
        convertedValue: null,
      };
    }
  }

  // Check allowed values
  if (field.allowedValues && field.allowedValues.length > 0) {
    const normalized = String(convertedValue).toLowerCase();
    const allowed = field.allowedValues.map((v) => v.toLowerCase());
    if (!allowed.includes(normalized)) {
      return {
        valid: false,
        error: {
          field: field.name,
          message: `Invalid value for '${field.displayName}'. Allowed values: ${field.allowedValues.join(', ')}`,
          value: stringValue,
          code: 'INVALID_VALUE',
        },
        convertedValue: null,
      };
    }
  }

  // Check frequency range
  if (field.type === 'frequency' && typeof convertedValue === 'number') {
    if (convertedValue < 0 || convertedValue > 1) {
      return {
        valid: false,
        error: {
          field: field.name,
          message: `Frequency must be between 0 and 1 for '${field.displayName}'`,
          value: convertedValue,
          code: 'VALUE_OUT_OF_RANGE',
        },
        convertedValue: null,
      };
    }
  }

  return { valid: true, convertedValue };
}

/**
 * Validate a complete record against a schema
 */
export function validateRecord(
  record: Record<string, string | number | boolean | null | undefined>,
  schema: DatabaseSchema,
  rowNumber: number,
  options: {
    strictFields?: boolean;
    fieldMapping?: Record<string, string>;
  } = {}
): RecordValidation {
  const errors: FieldValidationError[] = [];
  const warnings: string[] = [];
  const data: Record<string, string | number | boolean | null> = {};

  // Apply field mapping
  const mappedRecord: Record<string, string | number | boolean | null | undefined> = {};
  if (options.fieldMapping) {
    for (const [sourceField, schemaField] of Object.entries(options.fieldMapping)) {
      if (sourceField in record) {
        mappedRecord[schemaField] = record[sourceField];
      }
    }
    // Add unmapped fields
    for (const [key, value] of Object.entries(record)) {
      if (!Object.keys(options.fieldMapping).includes(key)) {
        mappedRecord[key] = value;
      }
    }
  } else {
    Object.assign(mappedRecord, record);
  }

  // Build field lookup
  const fieldLookup = new Map<string, DatabaseField>();
  for (const field of schema.fields) {
    fieldLookup.set(field.name.toLowerCase(), field);
  }

  // Validate each schema field
  for (const field of schema.fields) {
    // Try to find value (case-insensitive)
    let value: string | number | boolean | null | undefined;
    let foundKey: string | undefined;

    for (const key of Object.keys(mappedRecord)) {
      if (key.toLowerCase() === field.name.toLowerCase()) {
        value = mappedRecord[key];
        foundKey = key;
        break;
      }
    }

    const result = validateField(value, field);
    if (!result.valid && result.error) {
      errors.push(result.error);
    } else {
      data[field.name] = result.convertedValue;
    }
  }

  // Check for unknown fields (if strict mode)
  if (options.strictFields) {
    for (const key of Object.keys(mappedRecord)) {
      if (!fieldLookup.has(key.toLowerCase())) {
        warnings.push(`Unknown field '${key}' will be ignored`);
      }
    }
  }

  return {
    rowNumber,
    valid: errors.length === 0,
    errors,
    warnings,
    data: errors.length === 0 ? data : undefined,
  };
}

/**
 * Validate multiple records in batch
 */
export function validateRecords(
  records: Record<string, string | number | boolean | null | undefined>[],
  schema: DatabaseSchema,
  options: {
    strictFields?: boolean;
    fieldMapping?: Record<string, string>;
    startRowNumber?: number;
    onProgress?: (processed: number, total: number) => void;
  } = {}
): RecordValidation[] {
  const results: RecordValidation[] = [];
  const startRow = options.startRowNumber || 1;

  for (let i = 0; i < records.length; i++) {
    const result = validateRecord(records[i], schema, startRow + i, options);
    results.push(result);

    if (options.onProgress && i % 1000 === 0) {
      options.onProgress(i + 1, records.length);
    }
  }

  if (options.onProgress) {
    options.onProgress(records.length, records.length);
  }

  return results;
}

/**
 * Check for duplicate primary keys in records
 */
export function checkDuplicateKeys(
  records: RecordValidation[],
  schema: DatabaseSchema
): { hasDuplicates: boolean; duplicates: Map<string, number[]> } {
  const keyMap = new Map<string, number[]>();

  for (const record of records) {
    if (!record.valid || !record.data) continue;

    const keyValues = schema.primaryKey.map((k) => String(record.data![k] ?? ''));
    const key = keyValues.join('|');

    const rows = keyMap.get(key) || [];
    rows.push(record.rowNumber);
    keyMap.set(key, rows);
  }

  const duplicates = new Map<string, number[]>();
  for (const [key, rows] of keyMap) {
    if (rows.length > 1) {
      duplicates.set(key, rows);
    }
  }

  return { hasDuplicates: duplicates.size > 0, duplicates };
}

/**
 * Get validation summary
 */
export function getValidationSummary(validations: RecordValidation[]): {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  errorsByField: Map<string, number>;
  errorsByCode: Map<ValidationErrorCode, number>;
  warningCount: number;
} {
  const errorsByField = new Map<string, number>();
  const errorsByCode = new Map<ValidationErrorCode, number>();
  let validRecords = 0;
  let invalidRecords = 0;
  let warningCount = 0;

  for (const validation of validations) {
    if (validation.valid) {
      validRecords++;
    } else {
      invalidRecords++;
    }

    for (const error of validation.errors) {
      errorsByField.set(error.field, (errorsByField.get(error.field) || 0) + 1);
      errorsByCode.set(error.code, (errorsByCode.get(error.code) || 0) + 1);
    }

    warningCount += validation.warnings.length;
  }

  return {
    totalRecords: validations.length,
    validRecords,
    invalidRecords,
    errorsByField,
    errorsByCode,
    warningCount,
  };
}

/**
 * Infer field type from sample values
 */
export function inferFieldType(values: (string | number | boolean | null)[]): DatabaseFieldType {
  const nonNullValues = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (nonNullValues.length === 0) return 'string';

  const stringValues = nonNullValues.map(String);

  // Check specific types in order of specificity
  if (stringValues.every((v) => /^rs\d+$/i.test(v))) return 'rsid';
  if (stringValues.every((v) => /^(1[0-9]|2[0-2]|[1-9]|X|Y|MT)$/i.test(v.replace(/^chr/i, '')))) return 'chromosome';
  if (stringValues.every((v) => /^[ACGT]{1,2}$/i.test(v) && v.length <= 2)) return 'genotype';
  if (stringValues.every((v) => /^[ACGT]+$/i.test(v))) return 'allele';
  if (stringValues.every((v) => /^[A-Z][A-Z0-9\-]+$/i.test(v) && v.length <= 20)) return 'gene';
  if (stringValues.every((v) => /^(true|false|1|0|yes|no)$/i.test(v))) return 'boolean';

  // Check for numbers
  const numericValues = stringValues.map(Number);
  if (numericValues.every((n) => !isNaN(n))) {
    // Check if frequency (0-1)
    if (numericValues.every((n) => n >= 0 && n <= 1)) {
      const hasDecimals = stringValues.some((v) => v.includes('.'));
      if (hasDecimals) return 'frequency';
    }
    // Check if position (large integers)
    if (numericValues.every((n) => Number.isInteger(n) && n > 0 && n > 1000)) {
      return 'position';
    }
    return 'number';
  }

  return 'string';
}

/**
 * Auto-detect schema from sample records
 */
export function autoDetectSchema(
  records: Record<string, string | number | boolean | null>[],
  options: { name?: string; sampleSize?: number } = {}
): DatabaseSchema {
  const sampleSize = Math.min(options.sampleSize || 100, records.length);
  const sampleRecords = records.slice(0, sampleSize);

  // Collect all field names
  const fieldNames = new Set<string>();
  for (const record of sampleRecords) {
    for (const key of Object.keys(record)) {
      fieldNames.add(key);
    }
  }

  // Infer field types
  const fields: DatabaseField[] = [];
  for (const name of fieldNames) {
    const values = sampleRecords.map((r) => r[name] ?? null);
    const type = inferFieldType(values);
    const nonNullCount = values.filter((v) => v !== null && v !== undefined && v !== '').length;

    fields.push({
      name,
      displayName: name
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .trim()
        .replace(/^\w/, (c) => c.toUpperCase()),
      type,
      required: nonNullCount === values.length,
    });
  }

  // Detect primary key (prefer rsid or first unique string field)
  let primaryKey: string[] = [];
  const rsidField = fields.find((f) => f.type === 'rsid');
  if (rsidField) {
    primaryKey = [rsidField.name];
  } else {
    const stringField = fields.find((f) => f.type === 'string' && f.required);
    if (stringField) {
      primaryKey = [stringField.name];
    } else if (fields.length > 0) {
      primaryKey = [fields[0].name];
    }
  }

  // Detect index fields
  const indexFields = fields
    .filter((f) => ['rsid', 'gene', 'chromosome'].includes(f.type))
    .map((f) => f.name);

  return {
    id: `auto_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    version: '1.0.0',
    name: options.name || 'Auto-detected Schema',
    description: 'Automatically detected schema from sample data',
    primaryKey,
    fields,
    indexFields: indexFields.length > 0 ? indexFields : undefined,
  };
}
