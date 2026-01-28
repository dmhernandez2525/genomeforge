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
 * @packageDocumentation
 */

import type {
  ParsedGenome,
  SNP,
  FileFormat,
  GenomeBuild,
  ParseOptions,
  ParseProgress,
  ValidationResult,
  ValidationWarning,
  ValidationError,
  Chromosome,
  Allele
} from '@genomeforge/types';

// ============================================================================
// Constants
// ============================================================================

const VALID_ALLELES = new Set<string>(['A', 'T', 'C', 'G', '-', 'I', 'D', '0']);

const VALID_CHROMOSOMES = new Set<string>([
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
  '21', '22', 'X', 'Y', 'MT', 'M'
]);

// ============================================================================
// Format Detection
// ============================================================================

interface FormatSignature {
  format: FileFormat;
  pattern: RegExp;
  separator: string;
}

const FORMAT_SIGNATURES: FormatSignature[] = [
  {
    format: '23andme_v5',
    pattern: /^#\s*rsid\t/i,
    separator: '\t'
  },
  {
    format: '23andme_v4',
    pattern: /^#\s*rsid\tchromosome\tposition\tgenotype/i,
    separator: '\t'
  },
  {
    format: 'ancestrydna',
    pattern: /^rsid,chromosome,position,allele1,allele2/i,
    separator: ','
  },
  {
    format: 'myheritage',
    pattern: /^"?RSID"?,/i,
    separator: ','
  },
  {
    format: 'ftdna',
    pattern: /^RSID,CHROMOSOME,POSITION,RESULT/i,
    separator: ','
  },
  {
    format: 'livingdna',
    pattern: /^rsid,chromosome,position,genotype/i,
    separator: ','
  },
  {
    format: 'vcf',
    pattern: /^##fileformat=VCF/,
    separator: '\t'
  }
];

/**
 * Detect file format from header content
 */
export function detectFormat(header: string): FileFormat {
  const lines = header.split('\n').slice(0, 20);

  for (const line of lines) {
    for (const sig of FORMAT_SIGNATURES) {
      if (sig.pattern.test(line)) {
        return sig.format;
      }
    }
  }

  return 'unknown';
}

// ============================================================================
// Build Detection
// ============================================================================

// Reference SNPs with known positions in different builds
const BUILD_REFERENCE_SNPS = [
  { rsid: 'rs1000', positions: { GRCh36: 72017, GRCh37: 72017, GRCh38: 72017 } },
  { rsid: 'rs10000', positions: { GRCh36: 52238, GRCh37: 52238, GRCh38: 52238 } },
  { rsid: 'rs100000', positions: { GRCh36: 161091, GRCh37: 161091, GRCh38: 160965 } },
  // Add more reference SNPs for accurate detection
];

export interface BuildDetectionResult {
  build: GenomeBuild;
  confidence: number;
  matchCounts: Record<string, number>;
}

/**
 * Detect genome build from SNP positions
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

  const confidence = totalChecked > 0 ? bestCount / totalChecked : 0;

  return {
    build: confidence >= 0.8 ? bestBuild : 'unknown',
    confidence,
    matchCounts
  };
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate a genotype string
 */
export function validateGenotype(genotype: string): boolean {
  if (!genotype || genotype === '--' || genotype === '00') {
    return true; // No-call is valid
  }

  if (genotype.length !== 2) {
    return false;
  }

  return VALID_ALLELES.has(genotype[0].toUpperCase()) &&
         VALID_ALLELES.has(genotype[1].toUpperCase());
}

/**
 * Normalize chromosome value
 */
export function normalizeChromosome(chr: string): Chromosome | null {
  const normalized = chr.replace(/^chr/i, '').toUpperCase();

  if (normalized === 'M') {
    return 'MT';
  }

  if (VALID_CHROMOSOMES.has(normalized)) {
    return normalized as Chromosome;
  }

  return null;
}

// ============================================================================
// Parsing
// ============================================================================

/**
 * Parse a 23andMe format line
 */
function parse23andMeLine(line: string): SNP | null {
  const parts = line.split('\t');
  if (parts.length < 4) return null;

  const [rsid, chr, pos, genotype] = parts;

  const chromosome = normalizeChromosome(chr);
  if (!chromosome) return null;

  const position = parseInt(pos, 10);
  if (isNaN(position) || position < 0) return null;

  const normalizedGenotype = genotype.toUpperCase().trim();

  return {
    rsid: rsid.trim(),
    chromosome,
    position,
    genotype: normalizedGenotype,
    allele1: normalizedGenotype[0] as Allele || '-',
    allele2: normalizedGenotype[1] as Allele || '-'
  };
}

/**
 * Parse an AncestryDNA format line
 */
function parseAncestryLine(line: string): SNP | null {
  const parts = line.split(',');
  if (parts.length < 5) return null;

  const [rsid, chr, pos, allele1, allele2] = parts;

  const chromosome = normalizeChromosome(chr);
  if (!chromosome) return null;

  const position = parseInt(pos, 10);
  if (isNaN(position) || position < 0) return null;

  const a1 = allele1.trim().toUpperCase();
  const a2 = allele2.trim().toUpperCase();

  return {
    rsid: rsid.trim(),
    chromosome,
    position,
    genotype: a1 + a2,
    allele1: a1 as Allele,
    allele2: a2 as Allele
  };
}

/**
 * Main genome file parser
 */
export async function parseGenomeFile(
  file: File | string,
  options: ParseOptions = {}
): Promise<ParsedGenome> {
  const {
    validateGenotypes = true,
    skipInvalidLines = true,
    maxErrors = 100,
    onProgress
  } = options;

  // Get file content
  const content = typeof file === 'string'
    ? file
    : await file.text();

  onProgress?.({ phase: 'detecting', linesProcessed: 0, percentComplete: 5 });

  // Detect format
  const format = detectFormat(content.slice(0, 5000));
  if (format === 'unknown') {
    throw new GenomeParseError('UNKNOWN_FORMAT', 'Unable to detect file format');
  }

  // Parse lines
  onProgress?.({ phase: 'parsing', linesProcessed: 0, percentComplete: 10 });

  const lines = content.split('\n');
  const totalLines = lines.length;
  const snps = new Map<string, SNP>();
  const warnings: ValidationWarning[] = [];
  const errors: ValidationError[] = [];

  let lineNumber = 0;
  let skippedCount = 0;

  for (const line of lines) {
    lineNumber++;

    // Skip comments and empty lines
    if (!line.trim() || line.startsWith('#')) {
      continue;
    }

    // Skip header lines
    if (lineNumber === 1 && (
      line.toLowerCase().includes('rsid') ||
      line.toLowerCase().includes('chromosome')
    )) {
      continue;
    }

    // Parse based on format
    let snp: SNP | null = null;

    try {
      switch (format) {
        case '23andme_v5':
        case '23andme_v4':
        case '23andme_v3':
          snp = parse23andMeLine(line);
          break;
        case 'ancestrydna':
          snp = parseAncestryLine(line);
          break;
        // Add other format parsers
        default:
          snp = parse23andMeLine(line); // Fallback
      }
    } catch (err) {
      if (skipInvalidLines) {
        skippedCount++;
        warnings.push({
          code: 'PARSE_ERROR',
          message: `Failed to parse line`,
          line: lineNumber
        });
        continue;
      }
      throw err;
    }

    if (!snp) {
      skippedCount++;
      continue;
    }

    // Validate genotype
    if (validateGenotypes && !validateGenotype(snp.genotype)) {
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
        message: `Duplicate rsID: ${snp.rsid}`,
        line: lineNumber,
        rsid: snp.rsid
      });
    }

    snps.set(snp.rsid, snp);

    // Progress update every 10000 lines
    if (lineNumber % 10000 === 0) {
      const percent = 10 + (lineNumber / totalLines) * 70;
      onProgress?.({
        phase: 'parsing',
        linesProcessed: lineNumber,
        totalLines,
        percentComplete: percent
      });
    }

    // Check error limit
    if (errors.length >= maxErrors) {
      errors.push({
        code: 'MAX_ERRORS',
        message: `Maximum error count (${maxErrors}) exceeded`,
        fatal: true
      });
      break;
    }
  }

  // Detect build
  onProgress?.({ phase: 'validating', linesProcessed: snps.size, percentComplete: 85 });
  const buildResult = detectBuild(snps);

  if (buildResult.build === 'unknown') {
    warnings.push({
      code: 'UNKNOWN_BUILD',
      message: `Could not confidently detect genome build (confidence: ${(buildResult.confidence * 100).toFixed(1)}%)`
    });
  }

  // Build result
  const validation: ValidationResult = {
    valid: errors.filter(e => e.fatal).length === 0,
    snpsProcessed: snps.size,
    snpsSkipped: skippedCount,
    warnings,
    errors
  };

  onProgress?.({ phase: 'complete', linesProcessed: snps.size, percentComplete: 100 });

  return {
    id: crypto.randomUUID(),
    fileName: typeof file === 'string' ? 'pasted_content' : file.name,
    format,
    build: buildResult.build,
    buildConfidence: buildResult.confidence,
    snpCount: snps.size,
    snps,
    metadata: {
      rawFileSize: content.length,
      source: getSourceFromFormat(format)
    },
    validation,
    parsedAt: new Date()
  };
}

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
