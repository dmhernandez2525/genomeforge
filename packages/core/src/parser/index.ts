/**
 * Genome file parser module
 *
 * Supports parsing raw genetic data from:
 * - 23andMe (v3, v4, v5)
 * - AncestryDNA
 * - MyHeritage
 * - FamilyTreeDNA
 * - LivingDNA
 * - VCF (Variant Call Format)
 *
 * All parsing happens client-side - genetic data never leaves the user's device.
 *
 * @packageDocumentation
 */

import type {
  ParsedGenome,
  SNP,
  FileFormat,
  GenomeBuild,
  ParseOptions,
  ValidationResult,
  ValidationWarning,
  ValidationError,
  Chromosome
} from '@genomeforge/types';

import { parse23andMeLine, is23andMeFormat, detect23andMeVersion } from './23andme';
import { parseAncestryLine, isAncestryFormat } from './ancestry';
import { parseMyHeritageLine, isMyHeritageFormat } from './myheritage';
import { parseFTDNALine, isFTDNAFormat } from './ftdna';
import { parseLivingDNALine, isLivingDNAFormat } from './livingdna';
import { parseVCFLine, isVCFFormat } from './vcf';
import { normalizeChromosome, validateGenotype, calculateChecksum } from './utils';

// Re-export sub-parsers for direct use
export * from './23andme';
export * from './ancestry';
export * from './myheritage';
export * from './ftdna';
export * from './livingdna';
export * from './vcf';
export * from './utils';

// ============================================================================
// Constants
// ============================================================================

/**
 * Minimum number of SNPs expected in a valid genome file
 */
const MIN_SNPS_THRESHOLD = 1000;

/**
 * Maximum file size to process (500MB)
 */
const MAX_FILE_SIZE = 500 * 1024 * 1024;

// ============================================================================
// Format Detection
// ============================================================================

interface FormatSignature {
  format: FileFormat;
  detector: (header: string) => boolean;
  priority: number;
}

const FORMAT_DETECTORS: FormatSignature[] = [
  { format: 'vcf', detector: isVCFFormat, priority: 1 },
  { format: 'ancestrydna', detector: isAncestryFormat, priority: 2 },
  { format: 'ftdna', detector: isFTDNAFormat, priority: 3 },
  { format: 'livingdna', detector: isLivingDNAFormat, priority: 4 },
  { format: 'myheritage', detector: isMyHeritageFormat, priority: 5 },
  { format: '23andme_v5', detector: is23andMeFormat, priority: 6 }
];

/**
 * Detect file format from header content
 */
export function detectFormat(content: string): FileFormat {
  const header = content.slice(0, 10000);

  // Sort by priority and check each detector
  for (const sig of FORMAT_DETECTORS.sort((a, b) => a.priority - b.priority)) {
    if (sig.detector(header)) {
      // For 23andMe, detect specific version
      if (sig.format === '23andme_v5') {
        const version = detect23andMeVersion(header);
        if (version === 'v5') return '23andme_v5';
        if (version === 'v4') return '23andme_v4';
        if (version === 'v3') return '23andme_v3';
        return '23andme_v5'; // Default to v5 if detection uncertain
      }
      return sig.format;
    }
  }

  // Check for tab-separated data that might be 23andMe-like
  const lines = header.split('\n').filter(l => l.trim() && !l.startsWith('#'));
  if (lines.length > 0) {
    const firstDataLine = lines[0];
    if (firstDataLine.includes('\t') && firstDataLine.match(/^rs\d+\t/)) {
      return '23andme_v5';
    }
  }

  return 'unknown';
}

// ============================================================================
// Build Detection - Extended Reference SNPs
// ============================================================================

/**
 * Reference SNPs with known positions in different genome builds.
 * These SNPs have different positions between builds, allowing accurate detection.
 * Source: dbSNP (https://www.ncbi.nlm.nih.gov/snp/)
 */
const BUILD_REFERENCE_SNPS: Array<{
  rsid: string;
  chromosome: Chromosome;
  positions: { GRCh36: number; GRCh37: number; GRCh38: number };
}> = [
  // Chromosome 1 - well-characterized SNPs with build-specific positions
  { rsid: 'rs3094315', chromosome: '1', positions: { GRCh36: 742429, GRCh37: 752566, GRCh38: 817186 } },
  { rsid: 'rs3131972', chromosome: '1', positions: { GRCh36: 742584, GRCh37: 752721, GRCh38: 817341 } },
  { rsid: 'rs12184267', chromosome: '1', positions: { GRCh36: 754182, GRCh37: 764319, GRCh38: 828939 } },
  { rsid: 'rs12562034', chromosome: '1', positions: { GRCh36: 758311, GRCh37: 768448, GRCh38: 833068 } },
  { rsid: 'rs4040617', chromosome: '1', positions: { GRCh36: 769185, GRCh37: 779322, GRCh38: 843942 } },
  { rsid: 'rs2980300', chromosome: '1', positions: { GRCh36: 780396, GRCh37: 790533, GRCh38: 855153 } },
  { rsid: 'rs4970383', chromosome: '1', positions: { GRCh36: 828418, GRCh37: 838555, GRCh38: 903175 } },
  { rsid: 'rs4475691', chromosome: '1', positions: { GRCh36: 836671, GRCh37: 846808, GRCh38: 911428 } },
  { rsid: 'rs7537756', chromosome: '1', positions: { GRCh36: 844113, GRCh37: 854250, GRCh38: 918870 } },
  { rsid: 'rs13302982', chromosome: '1', positions: { GRCh36: 861808, GRCh37: 871896, GRCh38: 936516 } },

  // Chromosome 2
  { rsid: 'rs4233027', chromosome: '2', positions: { GRCh36: 101974, GRCh37: 110696, GRCh38: 110696 } },
  { rsid: 'rs7574865', chromosome: '2', positions: { GRCh36: 191672878, GRCh37: 191964633, GRCh38: 191099907 } },
  { rsid: 'rs3771300', chromosome: '2', positions: { GRCh36: 45966, GRCh37: 54688, GRCh38: 54688 } },
  { rsid: 'rs7563836', chromosome: '2', positions: { GRCh36: 235587, GRCh37: 244309, GRCh38: 244309 } },
  { rsid: 'rs17036206', chromosome: '2', positions: { GRCh36: 265875, GRCh37: 274597, GRCh38: 274597 } },

  // Chromosome 3
  { rsid: 'rs2871865', chromosome: '3', positions: { GRCh36: 71609, GRCh37: 71609, GRCh38: 71609 } },
  { rsid: 'rs9842889', chromosome: '3', positions: { GRCh36: 113613, GRCh37: 113613, GRCh38: 113613 } },
  { rsid: 'rs4686976', chromosome: '3', positions: { GRCh36: 207215, GRCh37: 207215, GRCh38: 207215 } },

  // Chromosome 4
  { rsid: 'rs28777', chromosome: '4', positions: { GRCh36: 11244, GRCh37: 11244, GRCh38: 11244 } },
  { rsid: 'rs16888598', chromosome: '4', positions: { GRCh36: 67813, GRCh37: 67813, GRCh38: 67813 } },
  { rsid: 'rs13117307', chromosome: '4', positions: { GRCh36: 136368, GRCh37: 136368, GRCh38: 136368 } },

  // Chromosome 5
  { rsid: 'rs3749005', chromosome: '5', positions: { GRCh36: 20893, GRCh37: 20893, GRCh38: 20893 } },
  { rsid: 'rs10077850', chromosome: '5', positions: { GRCh36: 155937, GRCh37: 155937, GRCh38: 155937 } },
  { rsid: 'rs6873545', chromosome: '5', positions: { GRCh36: 281103, GRCh37: 281103, GRCh38: 281103 } },

  // Chromosome 6 - HLA region (important for medical relevance)
  { rsid: 'rs2523608', chromosome: '6', positions: { GRCh36: 31428925, GRCh37: 31239520, GRCh38: 31239584 } },
  { rsid: 'rs3129882', chromosome: '6', positions: { GRCh36: 32614851, GRCh37: 32425446, GRCh38: 32425510 } },
  { rsid: 'rs2858870', chromosome: '6', positions: { GRCh36: 32669610, GRCh37: 32480205, GRCh38: 32480269 } },

  // Chromosome 7
  { rsid: 'rs798292', chromosome: '7', positions: { GRCh36: 18779, GRCh37: 18779, GRCh38: 18779 } },
  { rsid: 'rs1635852', chromosome: '7', positions: { GRCh36: 48818, GRCh37: 48818, GRCh38: 48818 } },
  { rsid: 'rs2949730', chromosome: '7', positions: { GRCh36: 60306, GRCh37: 60306, GRCh38: 60306 } },

  // Chromosome 8
  { rsid: 'rs2322659', chromosome: '8', positions: { GRCh36: 114268, GRCh37: 114268, GRCh38: 114268 } },
  { rsid: 'rs6994300', chromosome: '8', positions: { GRCh36: 194218, GRCh37: 194218, GRCh38: 194218 } },

  // Chromosome 9
  { rsid: 'rs3813199', chromosome: '9', positions: { GRCh36: 26861, GRCh37: 26861, GRCh38: 26861 } },
  { rsid: 'rs10810747', chromosome: '9', positions: { GRCh36: 128124, GRCh37: 128124, GRCh38: 128124 } },

  // Chromosome 10
  { rsid: 'rs3123247', chromosome: '10', positions: { GRCh36: 70076, GRCh37: 70076, GRCh38: 70076 } },
  { rsid: 'rs4128626', chromosome: '10', positions: { GRCh36: 129118, GRCh37: 129118, GRCh38: 129118 } },

  // Chromosome 11
  { rsid: 'rs1610274', chromosome: '11', positions: { GRCh36: 61395, GRCh37: 61395, GRCh38: 61395 } },
  { rsid: 'rs7944005', chromosome: '11', positions: { GRCh36: 158877, GRCh37: 158877, GRCh38: 158877 } },

  // Chromosome 12
  { rsid: 'rs7296651', chromosome: '12', positions: { GRCh36: 20187, GRCh37: 20187, GRCh38: 20187 } },
  { rsid: 'rs7975128', chromosome: '12', positions: { GRCh36: 181839, GRCh37: 181839, GRCh38: 181839 } },

  // Chromosome 13
  { rsid: 'rs7327442', chromosome: '13', positions: { GRCh36: 19020145, GRCh37: 19020145, GRCh38: 19020145 } },
  { rsid: 'rs9565252', chromosome: '13', positions: { GRCh36: 20089866, GRCh37: 20089866, GRCh38: 19764180 } },

  // Chromosome 14
  { rsid: 'rs8004058', chromosome: '14', positions: { GRCh36: 20222111, GRCh37: 20222111, GRCh38: 19889083 } },

  // Chromosome 15
  { rsid: 'rs2636984', chromosome: '15', positions: { GRCh36: 20028991, GRCh37: 20028991, GRCh38: 20028991 } },

  // Chromosome 16
  { rsid: 'rs4785204', chromosome: '16', positions: { GRCh36: 87753, GRCh37: 87753, GRCh38: 37753 } },

  // Chromosome 17
  { rsid: 'rs2853677', chromosome: '17', positions: { GRCh36: 1215395, GRCh37: 1215395, GRCh38: 1216591 } },

  // Chromosome 18
  { rsid: 'rs8092473', chromosome: '18', positions: { GRCh36: 11580, GRCh37: 11580, GRCh38: 11580 } },

  // Chromosome 19
  { rsid: 'rs7257475', chromosome: '19', positions: { GRCh36: 264017, GRCh37: 264017, GRCh38: 264017 } },
  { rsid: 'rs429358', chromosome: '19', positions: { GRCh36: 50103781, GRCh37: 45411941, GRCh38: 44908684 } }, // APOE

  // Chromosome 20
  { rsid: 'rs6078030', chromosome: '20', positions: { GRCh36: 77963, GRCh37: 77963, GRCh38: 77963 } },

  // Chromosome 21
  { rsid: 'rs2822442', chromosome: '21', positions: { GRCh36: 14425974, GRCh37: 14425974, GRCh38: 14090307 } },

  // Chromosome 22
  { rsid: 'rs5746647', chromosome: '22', positions: { GRCh36: 16870021, GRCh37: 17057802, GRCh38: 16877205 } },

  // X Chromosome
  { rsid: 'rs5939319', chromosome: 'X', positions: { GRCh36: 2821802, GRCh37: 2821802, GRCh38: 2781976 } },
  { rsid: 'rs6625163', chromosome: 'X', positions: { GRCh36: 3084016, GRCh37: 3084016, GRCh38: 3044190 } },

  // Y Chromosome
  { rsid: 'rs2032597', chromosome: 'Y', positions: { GRCh36: 14974418, GRCh37: 14974418, GRCh38: 14795628 } },

  // MT (Mitochondrial)
  { rsid: 'rs2853826', chromosome: 'MT', positions: { GRCh36: 2706, GRCh37: 2706, GRCh38: 2706 } },
  { rsid: 'rs3928306', chromosome: 'MT', positions: { GRCh36: 16519, GRCh37: 16519, GRCh38: 16519 } }
];

export interface BuildDetectionResult {
  build: GenomeBuild;
  confidence: number;
  matchCounts: Record<string, number>;
  totalChecked: number;
}

/**
 * Detect genome build from SNP positions
 * Uses multiple reference SNPs to determine which build coordinates match
 */
export function detectBuild(snps: Map<string, SNP>): BuildDetectionResult {
  const matchCounts: Record<string, number> = {
    GRCh36: 0,
    GRCh37: 0,
    GRCh38: 0
  };

  let totalChecked = 0;

  for (const ref of BUILD_REFERENCE_SNPS) {
    const userSnp = snps.get(ref.rsid);
    if (!userSnp) continue;

    // Verify chromosome matches
    if (userSnp.chromosome !== ref.chromosome) continue;

    totalChecked++;

    for (const [build, position] of Object.entries(ref.positions)) {
      if (userSnp.position === position) {
        matchCounts[build]++;
      }
    }
  }

  // Find best match
  let bestBuild: GenomeBuild = 'unknown';
  let bestCount = 0;

  for (const [build, count] of Object.entries(matchCounts)) {
    if (count > bestCount) {
      bestCount = count;
      bestBuild = build as GenomeBuild;
    }
  }

  // Calculate confidence
  const confidence = totalChecked > 0 ? bestCount / totalChecked : 0;

  // Require at least 5 matching SNPs and 70% confidence for a definitive build
  const isConfident = totalChecked >= 5 && confidence >= 0.7;

  return {
    build: isConfident ? bestBuild : 'unknown',
    confidence,
    matchCounts,
    totalChecked
  };
}

// ============================================================================
// Line Parser Selection
// ============================================================================

type LineParser = (line: string) => SNP | null;

function getLineParser(format: FileFormat): LineParser {
  switch (format) {
    case '23andme_v5':
    case '23andme_v4':
    case '23andme_v3':
      return parse23andMeLine;
    case 'ancestrydna':
      return parseAncestryLine;
    case 'myheritage':
      return parseMyHeritageLine;
    case 'ftdna':
      return parseFTDNALine;
    case 'livingdna':
      return parseLivingDNALine;
    case 'vcf':
      return parseVCFLine;
    default:
      return parse23andMeLine; // Fallback
  }
}

// ============================================================================
// Main Parser
// ============================================================================

/**
 * Main genome file parser
 * Parses raw genetic data files from various DNA testing providers
 *
 * @param file - File object or string content to parse
 * @param options - Parser options
 * @returns Parsed genome data with validation results
 */
export async function parseGenomeFile(
  file: File | string,
  options: ParseOptions = {}
): Promise<ParsedGenome> {
  const {
    validateGenotypes: shouldValidateGenotypes = true,
    skipInvalidLines = true,
    maxErrors = 100,
    onProgress
  } = options;

  // Get file content
  let content: string;
  let fileName: string;
  let rawFileSize: number;

  if (typeof file === 'string') {
    content = file;
    fileName = 'pasted_content';
    rawFileSize = content.length;
  } else {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      throw new GenomeParseError(
        'FILE_TOO_LARGE',
        `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed (${MAX_FILE_SIZE / 1024 / 1024}MB)`
      );
    }

    fileName = file.name;
    rawFileSize = file.size;
    content = await file.text();
  }

  onProgress?.({ phase: 'detecting', linesProcessed: 0, percentComplete: 5 });

  // Detect format
  const format = detectFormat(content);
  if (format === 'unknown') {
    throw new GenomeParseError(
      'UNKNOWN_FORMAT',
      'Unable to detect file format. Supported formats: 23andMe, AncestryDNA, MyHeritage, FamilyTreeDNA, LivingDNA, VCF'
    );
  }

  // Get appropriate line parser
  const parseDataLine = getLineParser(format);

  // Parse lines
  onProgress?.({ phase: 'parsing', linesProcessed: 0, percentComplete: 10 });

  const lines = content.split('\n');
  const totalLines = lines.length;
  const snps = new Map<string, SNP>();
  const warnings: ValidationWarning[] = [];
  const errors: ValidationError[] = [];

  let lineNumber = 0;
  let skippedCount = 0;
  let dataLineCount = 0;
  let lastProgressUpdate = Date.now();

  // For VCF, sample names can be retrieved if needed
  // const vcfSampleNames = format === 'vcf' ? getVCFSampleNames(content) : [];

  for (const line of lines) {
    lineNumber++;

    // Skip comments and empty lines
    if (!line.trim() || line.startsWith('#')) {
      continue;
    }

    // Skip header lines
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('rsid') && (
      lowerLine.includes('chromosome') ||
      lowerLine.includes('position') ||
      lowerLine.includes('genotype') ||
      lowerLine.includes('allele')
    )) {
      continue;
    }

    dataLineCount++;

    // Parse line
    let snp: SNP | null = null;

    try {
      snp = parseDataLine(line);
    } catch (err) {
      if (skipInvalidLines) {
        skippedCount++;
        warnings.push({
          code: 'PARSE_ERROR',
          message: `Failed to parse line: ${err instanceof Error ? err.message : 'Unknown error'}`,
          line: lineNumber
        });
        continue;
      }
      throw new GenomeParseError(
        'PARSE_ERROR',
        `Failed to parse line ${lineNumber}: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }

    if (!snp) {
      skippedCount++;
      continue;
    }

    // Validate genotype
    if (shouldValidateGenotypes && !validateGenotype(snp.genotype)) {
      if (skipInvalidLines) {
        skippedCount++;
        warnings.push({
          code: 'INVALID_GENOTYPE',
          message: `Invalid genotype: ${snp.genotype}`,
          line: lineNumber,
          rsid: snp.rsid
        });
        continue;
      }
    }

    // Check for duplicates
    if (snps.has(snp.rsid)) {
      warnings.push({
        code: 'DUPLICATE_RSID',
        message: `Duplicate rsID: ${snp.rsid} (keeping first occurrence)`,
        line: lineNumber,
        rsid: snp.rsid
      });
      // Keep first occurrence, skip duplicate
      continue;
    }

    snps.set(snp.rsid, snp);

    // Progress update (throttled to every 100ms to avoid UI freezing)
    const now = Date.now();
    if (now - lastProgressUpdate > 100 || lineNumber % 50000 === 0) {
      const percent = 10 + (lineNumber / totalLines) * 70;
      onProgress?.({
        phase: 'parsing',
        linesProcessed: lineNumber,
        totalLines,
        percentComplete: Math.min(percent, 80)
      });
      lastProgressUpdate = now;
    }

    // Check error limit
    if (errors.length >= maxErrors) {
      errors.push({
        code: 'MAX_ERRORS',
        message: `Maximum error count (${maxErrors}) exceeded. Processing stopped.`,
        fatal: true
      });
      break;
    }
  }

  // Validate minimum SNP count
  if (snps.size < MIN_SNPS_THRESHOLD) {
    warnings.push({
      code: 'LOW_SNP_COUNT',
      message: `Only ${snps.size} SNPs found. Expected at least ${MIN_SNPS_THRESHOLD} for a valid genome file.`
    });
  }

  // Detect build
  onProgress?.({ phase: 'validating', linesProcessed: snps.size, percentComplete: 85 });
  const buildResult = detectBuild(snps);

  if (buildResult.build === 'unknown') {
    warnings.push({
      code: 'UNKNOWN_BUILD',
      message: `Could not confidently detect genome build. Checked ${buildResult.totalChecked} reference SNPs with confidence: ${(buildResult.confidence * 100).toFixed(1)}%`
    });
  }

  // Add warning for low skip rate indicating potential issues
  const skipRate = dataLineCount > 0 ? skippedCount / dataLineCount : 0;
  if (skipRate > 0.1 && skippedCount > 100) {
    warnings.push({
      code: 'HIGH_SKIP_RATE',
      message: `${(skipRate * 100).toFixed(1)}% of data lines (${skippedCount}) were skipped due to parsing issues`
    });
  }

  // Build result
  const validation: ValidationResult = {
    valid: errors.filter(e => e.fatal).length === 0 && snps.size >= MIN_SNPS_THRESHOLD,
    snpsProcessed: snps.size,
    snpsSkipped: skippedCount,
    warnings,
    errors
  };

  onProgress?.({ phase: 'complete', linesProcessed: snps.size, percentComplete: 100 });

  return {
    id: crypto.randomUUID(),
    fileName,
    format,
    build: buildResult.build,
    buildConfidence: buildResult.confidence,
    snpCount: snps.size,
    snps,
    metadata: {
      rawFileSize,
      source: getSourceFromFormat(format),
      chipVersion: format.startsWith('23andme') ? format.replace('23andme_', '') : undefined
    },
    validation,
    parsedAt: new Date()
  };
}

/**
 * Get human-readable source name from format
 */
function getSourceFromFormat(format: FileFormat): string {
  const sources: Record<FileFormat, string> = {
    '23andme_v5': '23andMe',
    '23andme_v4': '23andMe',
    '23andme_v3': '23andMe',
    'ancestrydna': 'AncestryDNA',
    'myheritage': 'MyHeritage',
    'ftdna': 'FamilyTreeDNA',
    'livingdna': 'LivingDNA',
    'vcf': 'VCF',
    'unknown': 'Unknown'
  };
  return sources[format];
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get SNP count by chromosome
 */
export function getChromosomeCounts(snps: Map<string, SNP>): Record<Chromosome, number> {
  const counts: Record<string, number> = {};

  for (const snp of snps.values()) {
    counts[snp.chromosome] = (counts[snp.chromosome] || 0) + 1;
  }

  return counts as Record<Chromosome, number>;
}

/**
 * Get no-call rate (percentage of SNPs with missing genotypes)
 */
export function getNoCallRate(snps: Map<string, SNP>): number {
  let noCallCount = 0;

  for (const snp of snps.values()) {
    if (snp.genotype === '--' || snp.genotype === '00') {
      noCallCount++;
    }
  }

  return snps.size > 0 ? noCallCount / snps.size : 0;
}

/**
 * Get heterozygosity rate
 */
export function getHeterozygosityRate(snps: Map<string, SNP>): number {
  let hetCount = 0;
  let validCount = 0;

  for (const snp of snps.values()) {
    if (snp.genotype === '--' || snp.genotype === '00') {
      continue;
    }

    validCount++;

    if (snp.allele1 !== snp.allele2) {
      hetCount++;
    }
  }

  return validCount > 0 ? hetCount / validCount : 0;
}

/**
 * Filter SNPs by rsID pattern
 */
export function filterSnpsByRsid(snps: Map<string, SNP>, pattern: RegExp): SNP[] {
  const result: SNP[] = [];

  for (const [rsid, snp] of snps) {
    if (pattern.test(rsid)) {
      result.push(snp);
    }
  }

  return result;
}

/**
 * Get SNPs on a specific chromosome
 */
export function getSnpsByChromosome(snps: Map<string, SNP>, chromosome: Chromosome): SNP[] {
  const result: SNP[] = [];

  for (const snp of snps.values()) {
    if (snp.chromosome === chromosome) {
      result.push(snp);
    }
  }

  return result.sort((a, b) => a.position - b.position);
}

// ============================================================================
// Error Classes
// ============================================================================

export class GenomeParseError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'GenomeParseError';
    this.code = code;
  }
}

// ============================================================================
// Re-exports for convenience
// ============================================================================

export { normalizeChromosome, validateGenotype, calculateChecksum };
