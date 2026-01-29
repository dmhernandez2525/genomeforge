/**
 * @genomeforge/core
 *
 * Core genome parsing and analysis engine for GenomeForge.
 * All processing happens client-side - genetic data never leaves the user's device.
 *
 * @packageDocumentation
 */

export * from './parser';
export * from './matcher';
export * from './analyzer';
export * from './reporter';
export * from './ai';
export * from './batch';
export * from './database';

// Re-export commonly used types
export type {
  ParsedGenome,
  SNP,
  FileFormat,
  GenomeBuild,
  ParseOptions,
  ParseProgress,
  ValidationResult
} from '@genomeforge/types';
