/**
 * FamilyTreeDNA raw data file parser
 *
 * FamilyTreeDNA uses Illumina chips with ~700,000 SNPs.
 * File format: CSV with columns: RSID, CHROMOSOME, POSITION, RESULT
 * Note: Format is similar to 23andMe but uses CSV instead of TSV
 *
 * @packageDocumentation
 */

import type { SNP, Allele } from '@genomeforge/types';
import { normalizeChromosome, VALID_ALLELES } from './utils';

/**
 * FamilyTreeDNA header patterns
 * Note: FTDNA uses uppercase column names without quotes
 */
const FTDNA_HEADER_PATTERNS = [
  /^RSID,CHROMOSOME,POSITION,RESULT\s*$/i
];

/**
 * Check if header matches FamilyTreeDNA format
 */
export function isFTDNAFormat(header: string): boolean {
  const lines = header.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    for (const pattern of FTDNA_HEADER_PATTERNS) {
      if (pattern.test(trimmed)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Remove quotes from a CSV field
 */
function unquote(field: string): string {
  const trimmed = field.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/**
 * Parse a single FamilyTreeDNA format line
 *
 * Format: RSID,CHROMOSOME,POSITION,RESULT
 * Example: rs4477212,1,82154,AA
 * or with quotes: "rs4477212","1","82154","AA"
 */
export function parseFTDNALine(line: string): SNP | null {
  // Skip comments and empty lines
  if (!line.trim() || line.startsWith('#')) {
    return null;
  }

  // Handle both quoted and unquoted CSV
  const parts = line.split(',').map(unquote);

  if (parts.length < 4) {
    return null;
  }

  const [rsid, chr, pos, genotype] = parts;

  // Skip header line
  if (rsid.toLowerCase() === 'rsid') {
    return null;
  }

  // Validate rsID format (rs##### or i#####)
  const rsidTrimmed = rsid.trim();
  if (!rsidTrimmed.match(/^(rs|i)\d+$/)) {
    return null;
  }

  // Parse chromosome
  const chromosome = normalizeChromosome(chr);
  if (!chromosome) {
    return null;
  }

  // Parse position
  const position = parseInt(pos, 10);
  if (isNaN(position) || position < 0) {
    return null;
  }

  // Parse genotype
  const normalizedGenotype = genotype.toUpperCase().trim();

  // Handle no-call genotypes
  if (normalizedGenotype === '--' || normalizedGenotype === '' || normalizedGenotype === 'NC' || normalizedGenotype === '00') {
    return {
      rsid: rsidTrimmed,
      chromosome,
      position,
      genotype: '--',
      allele1: '-' as Allele,
      allele2: '-' as Allele
    };
  }

  // Validate genotype length
  if (normalizedGenotype.length !== 2) {
    return null;
  }

  // Validate alleles
  const allele1 = normalizedGenotype[0];
  const allele2 = normalizedGenotype[1];

  if (!VALID_ALLELES.has(allele1) || !VALID_ALLELES.has(allele2)) {
    return null;
  }

  return {
    rsid: rsidTrimmed,
    chromosome,
    position,
    genotype: normalizedGenotype,
    allele1: allele1 as Allele,
    allele2: allele2 as Allele
  };
}

/**
 * Parse FamilyTreeDNA raw data file content
 *
 * @param content - Raw file content
 * @param options - Parser options
 * @returns Array of parsed SNPs
 */
export function parseFTDNAFile(
  content: string,
  options: { skipInvalid?: boolean } = {}
): { snps: SNP[]; skipped: number } {
  const { skipInvalid = true } = options;

  const lines = content.split('\n');
  const snps: SNP[] = [];
  let skipped = 0;

  for (const line of lines) {
    const snp = parseFTDNALine(line);

    if (snp) {
      snps.push(snp);
    } else if (line.trim() && !line.startsWith('#') && !line.toLowerCase().includes('rsid')) {
      skipped++;
      if (!skipInvalid) {
        throw new Error(`Invalid line: ${line.substring(0, 100)}`);
      }
    }
  }

  return { snps, skipped };
}
