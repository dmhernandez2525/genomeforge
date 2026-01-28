/**
 * Genome-related type definitions
 * @packageDocumentation
 */

export type Chromosome =
  | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10'
  | '11' | '12' | '13' | '14' | '15' | '16' | '17' | '18' | '19' | '20'
  | '21' | '22' | 'X' | 'Y' | 'MT';

export type Allele = 'A' | 'T' | 'C' | 'G' | '-' | 'I' | 'D';

export type GenomeBuild = 'GRCh36' | 'GRCh37' | 'GRCh38' | 'unknown';

export type FileFormat =
  | '23andme_v5'
  | '23andme_v4'
  | '23andme_v3'
  | 'ancestrydna'
  | 'myheritage'
  | 'ftdna'
  | 'livingdna'
  | 'vcf'
  | 'unknown';

/**
 * Single Nucleotide Polymorphism representation
 */
export interface SNP {
  /** rsID (e.g., "rs1234567") or internal ID */
  rsid: string;
  /** Chromosome number or letter */
  chromosome: Chromosome;
  /** Base pair position */
  position: number;
  /** Diploid genotype (e.g., "AA", "AT", "TT") */
  genotype: string;
  /** First allele */
  allele1: Allele;
  /** Second allele */
  allele2: Allele;
}

/**
 * Parsed genome file representation
 */
export interface ParsedGenome {
  /** Unique identifier */
  id: string;
  /** Original file name */
  fileName: string;
  /** Detected file format */
  format: FileFormat;
  /** Detected genome build */
  build: GenomeBuild;
  /** Build detection confidence (0-1) */
  buildConfidence: number;
  /** Total number of SNPs */
  snpCount: number;
  /** SNP data indexed by rsID */
  snps: Map<string, SNP>;
  /** File metadata */
  metadata: GenomeMetadata;
  /** Validation results */
  validation: ValidationResult;
  /** Parse timestamp */
  parsedAt: Date;
}

export interface GenomeMetadata {
  /** Source provider name */
  source?: string;
  /** Chip or sequencing version */
  chipVersion?: string;
  /** Sample collection date */
  sampleDate?: Date;
  /** Original file size in bytes */
  rawFileSize: number;
}

export interface ValidationResult {
  /** Overall validity */
  valid: boolean;
  /** Number of SNPs successfully processed */
  snpsProcessed: number;
  /** Number of SNPs skipped due to errors */
  snpsSkipped: number;
  /** Warning messages */
  warnings: ValidationWarning[];
  /** Error messages */
  errors: ValidationError[];
}

export interface ValidationWarning {
  /** Warning code */
  code: string;
  /** Human-readable message */
  message: string;
  /** Line number in source file */
  line?: number;
  /** Related rsID */
  rsid?: string;
}

export interface ValidationError {
  /** Error code */
  code: string;
  /** Human-readable message */
  message: string;
  /** Line number in source file */
  line?: number;
  /** Whether this error prevents processing */
  fatal: boolean;
}

/**
 * Parse progress information for UI updates
 */
export interface ParseProgress {
  /** Current parsing phase */
  phase: 'detecting' | 'parsing' | 'validating' | 'complete';
  /** Number of lines processed */
  linesProcessed: number;
  /** Total lines in file (if known) */
  totalLines?: number;
  /** Completion percentage (0-100) */
  percentComplete: number;
}

/**
 * Options for genome parsing
 */
export interface ParseOptions {
  /** Validate genotype values (default: true) */
  validateGenotypes?: boolean;
  /** Skip invalid lines instead of failing (default: true) */
  skipInvalidLines?: boolean;
  /** Maximum errors before aborting (default: 100) */
  maxErrors?: number;
  /** Progress callback */
  onProgress?: (progress: ParseProgress) => void;
}
