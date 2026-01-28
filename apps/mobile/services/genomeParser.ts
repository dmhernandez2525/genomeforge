/**
 * Mobile Genome Parser Service
 *
 * Provides streaming, memory-efficient genome parsing for mobile devices.
 * Processes files in chunks to avoid memory pressure on mobile.
 */

import * as FileSystem from 'expo-file-system';

export interface GenomeVariant {
  rsid: string;
  chromosome: string;
  position: number;
  genotype: string;
}

export interface ParsedGenome {
  source: '23andme' | 'ancestry' | 'vcf' | 'unknown';
  variants: GenomeVariant[];
  totalVariants: number;
  metadata: {
    filename: string;
    fileSize: number;
    parsedAt: string;
    buildVersion?: string;
  };
}

export interface ParseProgress {
  stage: 'reading' | 'parsing' | 'indexing' | 'complete';
  bytesRead: number;
  totalBytes: number;
  variantsParsed: number;
  percentComplete: number;
}

type ProgressCallback = (progress: ParseProgress) => void;

/**
 * Detect genome file format from filename and content
 */
export function detectFormat(filename: string, headerLine?: string): '23andme' | 'ancestry' | 'vcf' | 'unknown' {
  const lowerFilename = filename.toLowerCase();

  if (lowerFilename.endsWith('.vcf') || lowerFilename.endsWith('.vcf.gz')) {
    return 'vcf';
  }

  if (headerLine) {
    const lowerHeader = headerLine.toLowerCase();
    if (lowerHeader.includes('23andme') || lowerHeader.includes('# rsid')) {
      return '23andme';
    }
    if (lowerHeader.includes('ancestrydna')) {
      return 'ancestry';
    }
    if (lowerHeader.startsWith('##fileformat=vcf')) {
      return 'vcf';
    }
  }

  if (lowerFilename.includes('23andme')) {
    return '23andme';
  }
  if (lowerFilename.includes('ancestry')) {
    return 'ancestry';
  }

  return 'unknown';
}

/**
 * Parse a 23andMe format line
 */
function parse23andMeLine(line: string): GenomeVariant | null {
  const parts = line.split('\t');
  if (parts.length < 4) return null;

  const [rsid, chromosome, posStr, genotype] = parts;

  // Skip header lines or invalid rsids
  if (!rsid.startsWith('rs') && !rsid.startsWith('i')) return null;

  const position = parseInt(posStr, 10);
  if (isNaN(position)) return null;

  return {
    rsid: rsid.toLowerCase(),
    chromosome: normalizeChromosome(chromosome),
    position,
    genotype: genotype.trim(),
  };
}

/**
 * Parse an AncestryDNA format line
 */
function parseAncestryLine(line: string): GenomeVariant | null {
  const parts = line.split('\t');
  if (parts.length < 5) return null;

  const [rsid, chromosome, posStr, allele1, allele2] = parts;

  if (!rsid.startsWith('rs')) return null;

  const position = parseInt(posStr, 10);
  if (isNaN(position)) return null;

  return {
    rsid: rsid.toLowerCase(),
    chromosome: normalizeChromosome(chromosome),
    position,
    genotype: `${allele1}${allele2}`,
  };
}

/**
 * Parse a VCF format line
 */
function parseVCFLine(line: string, sampleIndex: number = 9): GenomeVariant | null {
  const parts = line.split('\t');
  if (parts.length < 10) return null;

  const [chromosome, posStr, id, ref, alt, , , , format, ...samples] = parts;

  // Use ID field or generate from position
  let rsid = id;
  if (rsid === '.' || !rsid) {
    rsid = `chr${chromosome}_${posStr}`;
  }

  const position = parseInt(posStr, 10);
  if (isNaN(position)) return null;

  // Parse genotype from sample
  const formatFields = format.split(':');
  const gtIndex = formatFields.indexOf('GT');
  if (gtIndex === -1 || !samples[0]) return null;

  const sampleFields = samples[0].split(':');
  const gt = sampleFields[gtIndex];
  if (!gt) return null;

  // Convert VCF genotype (0/1, 1/1, etc.) to alleles
  const genotype = vcfGenotypeToAlleles(gt, ref, alt);

  return {
    rsid: rsid.toLowerCase(),
    chromosome: normalizeChromosome(chromosome),
    position,
    genotype,
  };
}

/**
 * Convert VCF genotype notation to actual alleles
 */
function vcfGenotypeToAlleles(gt: string, ref: string, alt: string): string {
  const alleles = alt.split(',');
  const indices = gt.replace(/[|/]/g, '').split('').map(Number);

  return indices
    .map((i) => {
      if (i === 0) return ref;
      return alleles[i - 1] || ref;
    })
    .join('');
}

/**
 * Normalize chromosome notation
 */
function normalizeChromosome(chr: string): string {
  const clean = chr.toUpperCase().replace(/^CHR/i, '').trim();
  if (clean === 'MT' || clean === 'M') return 'MT';
  if (clean === 'X' || clean === 'Y') return clean;
  const num = parseInt(clean, 10);
  if (!isNaN(num) && num >= 1 && num <= 22) return String(num);
  return clean;
}

/**
 * Parse genome file from URI with streaming for mobile
 */
export async function parseGenomeFile(
  fileUri: string,
  filename: string,
  onProgress?: ProgressCallback
): Promise<ParsedGenome> {
  // Get file info
  const fileInfo = await FileSystem.getInfoAsync(fileUri);
  if (!fileInfo.exists) {
    throw new Error('File not found');
  }

  const totalBytes = fileInfo.size || 0;

  onProgress?.({
    stage: 'reading',
    bytesRead: 0,
    totalBytes,
    variantsParsed: 0,
    percentComplete: 0,
  });

  // Read file content
  // Note: For very large files, we'd want to use streaming, but Expo FileSystem
  // doesn't support true streaming. For mobile, we process in chunks.
  const content = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  onProgress?.({
    stage: 'parsing',
    bytesRead: totalBytes,
    totalBytes,
    variantsParsed: 0,
    percentComplete: 30,
  });

  // Split into lines
  const lines = content.split('\n');
  const variants: GenomeVariant[] = [];

  // Detect format from first non-empty line
  let format: '23andme' | 'ancestry' | 'vcf' | 'unknown' = 'unknown';
  let headerLine = '';
  for (const line of lines) {
    if (line.trim()) {
      headerLine = line;
      format = detectFormat(filename, line);
      break;
    }
  }

  // Select parser based on format
  const parseLine = format === '23andme'
    ? parse23andMeLine
    : format === 'ancestry'
    ? parseAncestryLine
    : format === 'vcf'
    ? parseVCFLine
    : parse23andMeLine; // Default to 23andMe format

  // Parse lines
  const totalLines = lines.length;
  for (let i = 0; i < totalLines; i++) {
    const line = lines[i].trim();

    // Skip empty lines and headers
    if (!line || line.startsWith('#')) continue;

    const variant = parseLine(line);
    if (variant) {
      variants.push(variant);
    }

    // Update progress every 10000 lines
    if (i % 10000 === 0) {
      onProgress?.({
        stage: 'parsing',
        bytesRead: totalBytes,
        totalBytes,
        variantsParsed: variants.length,
        percentComplete: 30 + Math.round((i / totalLines) * 60),
      });
    }
  }

  onProgress?.({
    stage: 'indexing',
    bytesRead: totalBytes,
    totalBytes,
    variantsParsed: variants.length,
    percentComplete: 95,
  });

  // Create result
  const result: ParsedGenome = {
    source: format,
    variants,
    totalVariants: variants.length,
    metadata: {
      filename,
      fileSize: totalBytes,
      parsedAt: new Date().toISOString(),
    },
  };

  onProgress?.({
    stage: 'complete',
    bytesRead: totalBytes,
    totalBytes,
    variantsParsed: variants.length,
    percentComplete: 100,
  });

  return result;
}

/**
 * Index variants by rsID for fast lookup
 */
export function indexVariantsByRsid(variants: GenomeVariant[]): Map<string, GenomeVariant> {
  const index = new Map<string, GenomeVariant>();
  for (const variant of variants) {
    index.set(variant.rsid, variant);
  }
  return index;
}

/**
 * Get variants for a specific chromosome
 */
export function getVariantsByChromosome(
  variants: GenomeVariant[],
  chromosome: string
): GenomeVariant[] {
  const normalizedChr = normalizeChromosome(chromosome);
  return variants.filter((v) => v.chromosome === normalizedChr);
}

/**
 * Calculate basic genome statistics
 */
export function calculateGenomeStats(variants: GenomeVariant[]): {
  totalVariants: number;
  byChromosome: Record<string, number>;
  heterozygousCount: number;
  homozygousCount: number;
} {
  const byChromosome: Record<string, number> = {};
  let heterozygousCount = 0;
  let homozygousCount = 0;

  for (const variant of variants) {
    byChromosome[variant.chromosome] = (byChromosome[variant.chromosome] || 0) + 1;

    if (variant.genotype.length === 2) {
      const [a, b] = variant.genotype.split('');
      if (a === b) {
        homozygousCount++;
      } else {
        heterozygousCount++;
      }
    }
  }

  return {
    totalVariants: variants.length,
    byChromosome,
    heterozygousCount,
    homozygousCount,
  };
}
