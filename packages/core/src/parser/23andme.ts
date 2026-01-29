/**
 * 23andMe raw data file parser
 *
 * Supports versions 3, 4, and 5 of the 23andMe raw data format.
 * File format: Tab-separated with columns: rsid, chromosome, position, genotype
 * Typical SNP count: ~630,000 on v5 chip (Illumina Global Screening Array)
 *
 * @packageDocumentation
 */

import type { SNP, Allele } from '@genomeforge/types';
import { normalizeChromosome, VALID_ALLELES } from './utils';

/**
 * 23andMe file format versions
 */
export type TwentyThreeAndMeVersion = 'v3' | 'v4' | 'v5';

/**
 * Header patterns for version detection
 */
const VERSION_PATTERNS = {
  v5: /^#\s*rsid\tchromosome\tposition\tgenotype/i,
  v4: /^#\s*rsid\tchromosome\tposition\tgenotype/i,
  v3: /^#\s*rsid\tchromosome\tposition\tgenotype/i
};

/**
 * Detect 23andMe file version from header
 */
export function detect23andMeVersion(header: string): TwentyThreeAndMeVersion | null {
  // v5 typically has more metadata comments and mentions build 37
  if (header.includes('23andMe') && header.includes('build 37')) {
    return 'v5';
  }

  // v5 files often have more header lines with detailed comments
  const lines = header.split('\n');
  const commentLines = lines.filter(l => l.startsWith('#'));

  if (commentLines.length >= 10) {
    return 'v5';
  }

  // Check for column header pattern
  for (const [, pattern] of Object.entries(VERSION_PATTERNS)) {
    if (pattern.test(header)) {
      // Fewer comments suggest older version
      if (commentLines.length > 5) {
        return 'v4';
      }
      return 'v3';
    }
  }

  // Fallback: if it looks like 23andMe format (tab-separated with rsid)
  if (header.includes('\t') && header.match(/rs\d+\t/)) {
    return 'v5';
  }

  return null;
}

/**
 * Check if header matches 23andMe format
 */
export function is23andMeFormat(header: string): boolean {
  return detect23andMeVersion(header) !== null ||
         /^rs\d+\t[0-9XYM]/.test(header.split('\n').find(l => !l.startsWith('#') && l.trim()) || '');
}

/**
 * Parse a single 23andMe format line
 *
 * Format: rsid<TAB>chromosome<TAB>position<TAB>genotype
 * Example: rs4477212	1	82154	AA
 */
export function parse23andMeLine(line: string): SNP | null {
  // Skip comments and empty lines
  if (!line.trim() || line.startsWith('#')) {
    return null;
  }

  const parts = line.split('\t').map(p => p.trim());
  if (parts.length < 4) {
    return null;
  }

  const [rsid, chr, pos, genotype] = parts;

  // Skip header line
  if (rsid.toLowerCase() === 'rsid') {
    return null;
  }

  // Validate rsID format (rs##### or i##### for internal IDs)
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
  if (normalizedGenotype === '--' || normalizedGenotype === '00' || normalizedGenotype === '') {
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
 * Parse 23andMe raw data file content
 *
 * @param content - Raw file content
 * @param options - Parser options
 * @returns Array of parsed SNPs
 */
export function parse23andMeFile(
  content: string,
  options: { skipInvalid?: boolean } = {}
): { snps: SNP[]; skipped: number; version: TwentyThreeAndMeVersion | null } {
  const { skipInvalid = true } = options;

  const lines = content.split('\n');
  const snps: SNP[] = [];
  let skipped = 0;

  // Detect version from header
  const headerLines = lines.slice(0, 50).join('\n');
  const version = detect23andMeVersion(headerLines);

  for (const line of lines) {
    const snp = parse23andMeLine(line);

    if (snp) {
      snps.push(snp);
    } else if (line.trim() && !line.startsWith('#')) {
      skipped++;
      if (!skipInvalid) {
        throw new Error(`Invalid line: ${line.substring(0, 100)}`);
      }
    }
  }

  return { snps, skipped, version };
}
