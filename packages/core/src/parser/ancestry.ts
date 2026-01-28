/**
 * AncestryDNA raw data file parser
 *
 * AncestryDNA uses Illumina OmniExpress Plus chip with ~700,000 SNPs.
 * Note: Only ~44% SNP overlap with 23andMe v5 - important for compatibility.
 *
 * File format: CSV with 5 columns: rsid, chromosome, position, allele1, allele2
 *
 * @packageDocumentation
 */

import type { SNP, Allele } from '@genomeforge/types';
import { normalizeChromosome, VALID_ALLELES } from './utils';

/**
 * AncestryDNA header pattern
 */
const ANCESTRY_HEADER_PATTERN = /^rsid,chromosome,position,allele1,allele2/i;

/**
 * Check if header matches AncestryDNA format
 */
export function isAncestryFormat(header: string): boolean {
  const lines = header.split('\n');

  for (const line of lines) {
    if (ANCESTRY_HEADER_PATTERN.test(line.trim())) {
      return true;
    }
    // Also check data line pattern
    if (line.match(/^rs\d+,\d+,\d+,[ATCG0],[ATCG0]/i)) {
      return true;
    }
  }

  return false;
}

/**
 * Parse a single AncestryDNA format line
 *
 * Format: rsid,chromosome,position,allele1,allele2
 * Example: rs4477212,1,82154,A,A
 */
export function parseAncestryLine(line: string): SNP | null {
  // Skip comments and empty lines
  if (!line.trim() || line.startsWith('#')) {
    return null;
  }

  const parts = line.split(',');
  if (parts.length < 5) {
    return null;
  }

  const [rsid, chr, pos, allele1Raw, allele2Raw] = parts;

  // Skip header line
  if (rsid.toLowerCase() === 'rsid') {
    return null;
  }

  // Validate rsID format
  const rsidTrimmed = rsid.trim();
  if (!rsidTrimmed.match(/^rs\d+$/)) {
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

  // Parse alleles (AncestryDNA uses separate columns)
  const allele1 = allele1Raw.trim().toUpperCase();
  const allele2 = allele2Raw.trim().toUpperCase();

  // Handle no-call genotypes (0 represents no-call in AncestryDNA)
  if (allele1 === '0' || allele2 === '0') {
    return {
      rsid: rsidTrimmed,
      chromosome,
      position,
      genotype: '--',
      allele1: '-' as Allele,
      allele2: '-' as Allele
    };
  }

  // Validate alleles
  if (!VALID_ALLELES.has(allele1) || !VALID_ALLELES.has(allele2)) {
    return null;
  }

  return {
    rsid: rsidTrimmed,
    chromosome,
    position,
    genotype: allele1 + allele2,
    allele1: allele1 as Allele,
    allele2: allele2 as Allele
  };
}

/**
 * Parse AncestryDNA raw data file content
 *
 * @param content - Raw file content
 * @param options - Parser options
 * @returns Array of parsed SNPs
 */
export function parseAncestryFile(
  content: string,
  options: { skipInvalid?: boolean } = {}
): { snps: SNP[]; skipped: number } {
  const { skipInvalid = true } = options;

  const lines = content.split('\n');
  const snps: SNP[] = [];
  let skipped = 0;

  for (const line of lines) {
    const snp = parseAncestryLine(line);

    if (snp) {
      snps.push(snp);
    } else if (line.trim() && !line.startsWith('#') && !line.toLowerCase().startsWith('rsid')) {
      skipped++;
      if (!skipInvalid) {
        throw new Error(`Invalid line: ${line.substring(0, 100)}`);
      }
    }
  }

  return { snps, skipped };
}
