/**
 * MyHeritage raw data file parser
 *
 * MyHeritage uses a similar chip to AncestryDNA with ~700,000 SNPs.
 * Note: MyHeritage owns Promethease and SNPedia.
 *
 * File format: CSV with columns: RSID, CHROMOSOME, POSITION, RESULT
 * The RESULT column contains the diploid genotype (e.g., "AA", "AG")
 *
 * @packageDocumentation
 */

import type { SNP, Allele } from '@genomeforge/types';
import { normalizeChromosome, VALID_ALLELES } from './utils';

/**
 * MyHeritage header patterns (may have quotes around column names)
 * Note: MyHeritage typically uses quoted CSV format
 */
const MYHERITAGE_HEADER_PATTERNS = [
  /^"RSID","CHROMOSOME","POSITION","RESULT"\s*$/i
];

/**
 * Check if header matches MyHeritage format
 */
export function isMyHeritageFormat(header: string): boolean {
  const lines = header.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    for (const pattern of MYHERITAGE_HEADER_PATTERNS) {
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
 * Parse a single MyHeritage format line
 *
 * Format: "RSID","CHROMOSOME","POSITION","RESULT"
 * Example: "rs4477212","1","82154","AA"
 */
export function parseMyHeritageLine(line: string): SNP | null {
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

  // Parse genotype
  const normalizedGenotype = genotype.toUpperCase().trim();

  // Handle no-call genotypes
  if (normalizedGenotype === '--' || normalizedGenotype === '' || normalizedGenotype === 'NC') {
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
 * Parse MyHeritage raw data file content
 *
 * @param content - Raw file content
 * @param options - Parser options
 * @returns Array of parsed SNPs
 */
export function parseMyHeritageFile(
  content: string,
  options: { skipInvalid?: boolean } = {}
): { snps: SNP[]; skipped: number } {
  const { skipInvalid = true } = options;

  const lines = content.split('\n');
  const snps: SNP[] = [];
  let skipped = 0;

  for (const line of lines) {
    const snp = parseMyHeritageLine(line);

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
