/**
 * VCF (Variant Call Format) file parser
 *
 * Supports VCF 4.0, 4.1, 4.2, and 4.3 formats.
 * VCF files from whole genome sequencing can contain 5M+ variants.
 *
 * @packageDocumentation
 */

import type { SNP, Allele } from '@genomeforge/types';
import { normalizeChromosome } from './utils';

/**
 * VCF file header pattern
 */
const VCF_HEADER_PATTERN = /^##fileformat=VCFv(\d+\.\d+)/;

/**
 * VCF column header pattern
 */
const VCF_COLUMN_PATTERN = /^#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO/;

/**
 * VCF version info
 */
export interface VCFVersion {
  major: number;
  minor: number;
  string: string;
}

/**
 * Check if header matches VCF format
 */
export function isVCFFormat(header: string): boolean {
  return VCF_HEADER_PATTERN.test(header);
}

/**
 * Detect VCF version from header
 */
export function detectVCFVersion(header: string): VCFVersion | null {
  const match = header.match(VCF_HEADER_PATTERN);
  if (!match) {
    return null;
  }

  const versionStr = match[1];
  const [major, minor] = versionStr.split('.').map(n => parseInt(n, 10));

  return {
    major,
    minor,
    string: versionStr
  };
}

/**
 * Parse VCF INFO field
 */
export function parseInfoField(info: string): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};

  if (info === '.' || !info) {
    return result;
  }

  const fields = info.split(';');
  for (const field of fields) {
    const [key, value] = field.split('=');
    result[key] = value !== undefined ? value : true;
  }

  return result;
}

/**
 * Parse VCF genotype from GT field
 *
 * GT format: allele1/allele2 or allele1|allele2
 * 0 = reference allele, 1+ = alternate alleles
 */
function parseVCFGenotype(
  gt: string,
  ref: string,
  alt: string
): { allele1: Allele; allele2: Allele } | null {
  // Split by / (unphased) or | (phased)
  const alleleIndices = gt.split(/[\/|]/);

  if (alleleIndices.length !== 2) {
    return null;
  }

  const alleles = [ref, ...alt.split(',')];

  const idx1 = parseInt(alleleIndices[0], 10);
  const idx2 = parseInt(alleleIndices[1], 10);

  // Handle missing genotype (.)
  if (isNaN(idx1) || isNaN(idx2)) {
    return { allele1: '-' as Allele, allele2: '-' as Allele };
  }

  const a1 = alleles[idx1];
  const a2 = alleles[idx2];

  if (!a1 || !a2) {
    return null;
  }

  // Only handle single nucleotide variants for SNP analysis
  if (a1.length !== 1 || a2.length !== 1) {
    return null;
  }

  return {
    allele1: a1.toUpperCase() as Allele,
    allele2: a2.toUpperCase() as Allele
  };
}

/**
 * Parse a single VCF data line
 *
 * Format: CHROM  POS  ID  REF  ALT  QUAL  FILTER  INFO  FORMAT  SAMPLE...
 */
export function parseVCFLine(line: string, sampleIndex = 0): SNP | null {
  // Skip meta-information and header lines
  if (!line.trim() || line.startsWith('#')) {
    return null;
  }

  const parts = line.split('\t');
  if (parts.length < 10) {
    return null;
  }

  const [chrom, pos, id, ref, alt, , , , format, ...samples] = parts;

  // Parse chromosome
  const chromosome = normalizeChromosome(chrom);
  if (!chromosome) {
    return null;
  }

  // Parse position
  const position = parseInt(pos, 10);
  if (isNaN(position) || position < 0) {
    return null;
  }

  // Get rsID (use position if no rsID)
  let rsid = id;
  if (rsid === '.' || !rsid) {
    rsid = `chr${chromosome}:${position}`;
  }

  // Get sample genotype
  const sample = samples[sampleIndex];
  if (!sample) {
    return null;
  }

  // Parse FORMAT and sample fields
  const formatFields = format.split(':');
  const sampleFields = sample.split(':');

  const gtIndex = formatFields.indexOf('GT');
  if (gtIndex === -1) {
    return null;
  }

  const gt = sampleFields[gtIndex];
  if (!gt || gt === '.') {
    return {
      rsid,
      chromosome,
      position,
      genotype: '--',
      allele1: '-' as Allele,
      allele2: '-' as Allele
    };
  }

  // Parse genotype
  const genotype = parseVCFGenotype(gt, ref, alt);
  if (!genotype) {
    return null;
  }

  return {
    rsid,
    chromosome,
    position,
    genotype: genotype.allele1 + genotype.allele2,
    allele1: genotype.allele1,
    allele2: genotype.allele2
  };
}

/**
 * Parse VCF file content
 *
 * @param content - Raw file content
 * @param options - Parser options
 * @returns Array of parsed SNPs
 */
export function parseVCFFile(
  content: string,
  options: { skipInvalid?: boolean; sampleIndex?: number } = {}
): { snps: SNP[]; skipped: number; version: VCFVersion | null } {
  const { skipInvalid = true, sampleIndex = 0 } = options;

  const lines = content.split('\n');
  const snps: SNP[] = [];
  let skipped = 0;
  let version: VCFVersion | null = null;

  for (const line of lines) {
    // Check for version in header
    if (line.startsWith('##fileformat=VCF')) {
      version = detectVCFVersion(line);
      continue;
    }

    // Skip other meta lines and column header
    if (line.startsWith('#')) {
      continue;
    }

    const snp = parseVCFLine(line, sampleIndex);

    if (snp) {
      snps.push(snp);
    } else if (line.trim()) {
      skipped++;
      if (!skipInvalid) {
        throw new Error(`Invalid VCF line: ${line.substring(0, 100)}`);
      }
    }
  }

  return { snps, skipped, version };
}

/**
 * Get sample names from VCF header
 */
export function getVCFSampleNames(content: string): string[] {
  const lines = content.split('\n');

  for (const line of lines) {
    if (VCF_COLUMN_PATTERN.test(line)) {
      const parts = line.split('\t');
      // Samples start at index 9
      return parts.slice(9);
    }
  }

  return [];
}
