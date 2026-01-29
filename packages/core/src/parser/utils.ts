/**
 * Parser utility functions shared across format-specific parsers
 *
 * @packageDocumentation
 */

import type { Chromosome } from '@genomeforge/types';

/**
 * Valid allele characters
 */
export const VALID_ALLELES = new Set<string>(['A', 'T', 'C', 'G', '-', 'I', 'D', '0']);

/**
 * Valid chromosome identifiers
 */
export const VALID_CHROMOSOMES = new Set<string>([
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
  '21', '22', 'X', 'Y', 'MT', 'M'
]);

/**
 * Normalize chromosome value to standard format
 *
 * Handles various input formats:
 * - "chr1" -> "1"
 * - "Chr22" -> "22"
 * - "chrX" -> "X"
 * - "M" -> "MT"
 * - "chrM" -> "MT"
 *
 * @param chr - Chromosome value to normalize
 * @returns Normalized chromosome or null if invalid
 */
export function normalizeChromosome(chr: string): Chromosome | null {
  if (!chr) {
    return null;
  }

  // Remove "chr" prefix (case insensitive)
  let normalized = chr.replace(/^chr/i, '').toUpperCase();

  // Normalize mitochondrial chromosome
  if (normalized === 'M') {
    normalized = 'MT';
  }

  // Validate
  if (VALID_CHROMOSOMES.has(normalized)) {
    return normalized as Chromosome;
  }

  return null;
}

/**
 * Validate a genotype string
 *
 * Valid formats:
 * - Two alleles: "AA", "AG", "CT", etc.
 * - No-call: "--", "00"
 * - Indel markers: "II", "DD", "ID", "DI"
 *
 * @param genotype - Genotype string to validate
 * @returns true if valid
 */
export function validateGenotype(genotype: string): boolean {
  if (!genotype) {
    return false;
  }

  // No-call is valid
  if (genotype === '--' || genotype === '00') {
    return true;
  }

  // Must be exactly 2 characters
  if (genotype.length !== 2) {
    return false;
  }

  // Both characters must be valid alleles
  return VALID_ALLELES.has(genotype[0].toUpperCase()) &&
         VALID_ALLELES.has(genotype[1].toUpperCase());
}

/**
 * Parse chromosome and position from a location string
 *
 * Formats:
 * - "chr1:12345" -> { chromosome: "1", position: 12345 }
 * - "1:12345" -> { chromosome: "1", position: 12345 }
 * - "X:54321" -> { chromosome: "X", position: 54321 }
 *
 * @param location - Location string
 * @returns Parsed chromosome and position, or null if invalid
 */
export function parseLocation(location: string): { chromosome: Chromosome; position: number } | null {
  const parts = location.split(':');
  if (parts.length !== 2) {
    return null;
  }

  const chromosome = normalizeChromosome(parts[0]);
  if (!chromosome) {
    return null;
  }

  const position = parseInt(parts[1], 10);
  if (isNaN(position) || position < 0) {
    return null;
  }

  return { chromosome, position };
}

/**
 * Convert genotype to standard orientation
 *
 * Some files report genotypes in reverse complement.
 * This function normalizes to forward strand.
 *
 * @param genotype - Genotype to normalize
 * @param reverseComplement - Whether to reverse complement
 * @returns Normalized genotype
 */
export function normalizeGenotype(genotype: string, reverseComplement = false): string {
  if (!reverseComplement) {
    return genotype.toUpperCase();
  }

  const complement: Record<string, string> = {
    'A': 'T',
    'T': 'A',
    'C': 'G',
    'G': 'C',
    '-': '-',
    'I': 'I',
    'D': 'D'
  };

  return genotype
    .toUpperCase()
    .split('')
    .map(c => complement[c] || c)
    .join('');
}

/**
 * Check if an rsID is valid
 *
 * Valid formats:
 * - rs123456 (dbSNP rsID)
 * - i123456 (23andMe internal ID)
 *
 * @param rsid - rsID to validate
 * @returns true if valid
 */
export function isValidRsid(rsid: string): boolean {
  if (!rsid) {
    return false;
  }

  return /^(rs|i)\d+$/.test(rsid.trim());
}

/**
 * Calculate file checksum using SHA-256
 *
 * @param content - File content
 * @returns Hex-encoded SHA-256 hash
 */
export async function calculateChecksum(content: string | ArrayBuffer): Promise<string> {
  const data = typeof content === 'string'
    ? new TextEncoder().encode(content)
    : new Uint8Array(content);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
