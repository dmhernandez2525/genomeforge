# Software Design Document: Genome Parser

**Feature:** Multi-Format Genetic File Parser
**Package:** `@genomeforge/core`
**Phase:** 1 (MVP)
**Status:** Planned

---

## 1. Overview

### 1.1 Purpose
Parse raw genetic data files from major DTC testing providers into a unified internal format for analysis. The parser must handle format detection, build detection, validation, and normalization.

### 1.2 Scope
- Parse 6 file formats: 23andMe, AncestryDNA, MyHeritage, FTDNA, LivingDNA, VCF
- Detect genome build (GRCh36/37/38)
- Validate file integrity and report errors
- Support files with 600K-5M+ variants

### 1.3 References
- [snps library](https://github.com/apriha/snps) - BSD-3-Clause, reference implementation
- [23andMe raw data format](https://customercare.23andme.com/hc/en-us/articles/212196868)
- [VCF 4.2 specification](https://samtools.github.io/hts-specs/VCFv4.2.pdf)

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      GenomeParser                                │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ FormatDetector│───▶│ FileParser   │───▶│ BuildDetector│      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ HeaderMatcher│    │ SNPExtractor │    │PositionMatcher│      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                             │                                    │
│                             ▼                                    │
│                      ┌──────────────┐                           │
│                      │  Validator   │                           │
│                      └──────────────┘                           │
│                             │                                    │
│                             ▼                                    │
│                      ┌──────────────┐                           │
│                      │ParsedGenome  │                           │
│                      └──────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
User File → Format Detection → Header Parsing → SNP Extraction → Build Detection → Validation → ParsedGenome
```

---

## 3. File Format Specifications

### 3.1 23andMe v5 (TSV)

```
# rsid	chromosome	position	genotype
rs548049170	1	69869	TT
rs13328684	1	74792	--
rs9283150	1	565508	AA
```

| Field | Type | Description |
|-------|------|-------------|
| rsid | string | rs ID or internal ID (i#####) |
| chromosome | string | 1-22, X, Y, MT |
| position | number | Base pair position (Build 37) |
| genotype | string | Two alleles (AA, AT, TT, --, II, DD) |

**Characteristics:**
- Tab-separated
- ~630,000 SNPs
- File size: 15-25 MB
- Header lines start with `#`
- Internal IDs (i#####) for probes without rsID

### 3.2 AncestryDNA (CSV)

```
rsid,chromosome,position,allele1,allele2
rs4477212,1,82154,A,A
rs3094315,1,752566,G,G
```

| Field | Type | Description |
|-------|------|-------------|
| rsid | string | rs ID |
| chromosome | string | 1-22, X, Y, MT |
| position | number | Base pair position |
| allele1 | string | First allele |
| allele2 | string | Second allele |

**Characteristics:**
- Comma-separated, 5 columns
- ~700,000 SNPs
- 44% overlap with 23andMe v5

### 3.3 MyHeritage (CSV)

```
"RSID","CHROMOSOME","POSITION","RESULT"
"rs548049170","1","69869","TT"
```

**Characteristics:**
- Quoted CSV format
- Similar structure to 23andMe

### 3.4 VCF (Variant Call Format)

```
##fileformat=VCFv4.2
##reference=GRCh38
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO	FORMAT	SAMPLE
1	69869	rs548049170	T	C	.	PASS	.	GT	0/1
```

**Characteristics:**
- Tab-separated with metadata headers
- Supports multi-sample files
- Variable size (WGS: 3-5M+ variants)

---

## 4. Type Definitions

```typescript
// packages/types/src/genome.ts

export type Chromosome =
  | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10'
  | '11' | '12' | '13' | '14' | '15' | '16' | '17' | '18' | '19' | '20'
  | '21' | '22' | 'X' | 'Y' | 'MT';

export type Allele = 'A' | 'T' | 'C' | 'G' | '-' | 'I' | 'D';

export type GenomeBuild = 'GRCh36' | 'GRCh37' | 'GRCh38' | 'unknown';

export type FileFormat =
  | '23andme_v5'
  | '23andme_v4'
  | 'ancestrydna'
  | 'myheritage'
  | 'ftdna'
  | 'livingdna'
  | 'vcf'
  | 'unknown';

export interface SNP {
  rsid: string;
  chromosome: Chromosome;
  position: number;
  genotype: string;        // e.g., "AA", "AT", "TT"
  allele1: Allele;
  allele2: Allele;
}

export interface ParsedGenome {
  id: string;              // UUID
  fileName: string;
  format: FileFormat;
  build: GenomeBuild;
  buildConfidence: number; // 0-1
  snpCount: number;
  snps: Map<string, SNP>;  // rsid -> SNP
  metadata: GenomeMetadata;
  validation: ValidationResult;
  parsedAt: Date;
}

export interface GenomeMetadata {
  source?: string;         // "23andMe", "AncestryDNA", etc.
  chipVersion?: string;
  sampleDate?: Date;
  rawFileSize: number;
}

export interface ValidationResult {
  valid: boolean;
  snpsProcessed: number;
  snpsSkipped: number;
  warnings: ValidationWarning[];
  errors: ValidationError[];
}

export interface ValidationWarning {
  code: string;
  message: string;
  line?: number;
  rsid?: string;
}

export interface ValidationError {
  code: string;
  message: string;
  line?: number;
  fatal: boolean;
}
```

---

## 5. Implementation

### 5.1 Format Detection

```typescript
// packages/core/src/parser/format-detector.ts

export interface FormatSignature {
  format: FileFormat;
  headerPattern: RegExp;
  columnCount: number;
  separator: string;
}

const FORMAT_SIGNATURES: FormatSignature[] = [
  {
    format: '23andme_v5',
    headerPattern: /^# rsid\tchromosome\tposition\tgenotype/,
    columnCount: 4,
    separator: '\t'
  },
  {
    format: 'ancestrydna',
    headerPattern: /^rsid,chromosome,position,allele1,allele2/,
    columnCount: 5,
    separator: ','
  },
  {
    format: 'myheritage',
    headerPattern: /^"RSID","CHROMOSOME","POSITION","RESULT"/,
    columnCount: 4,
    separator: ','
  },
  {
    format: 'vcf',
    headerPattern: /^##fileformat=VCF/,
    columnCount: -1, // Variable
    separator: '\t'
  }
];

export function detectFormat(header: string): FileFormat {
  for (const sig of FORMAT_SIGNATURES) {
    if (sig.headerPattern.test(header)) {
      return sig.format;
    }
  }
  return 'unknown';
}
```

### 5.2 Build Detection Algorithm

```typescript
// packages/core/src/parser/build-detector.ts

import { BUILD_REFERENCE_SNPS } from './reference-snps';

export interface BuildDetectionResult {
  build: GenomeBuild;
  confidence: number;
  matchCounts: Record<GenomeBuild, number>;
}

/**
 * Detect genome build by comparing SNP positions against reference.
 * Uses 100 well-characterized SNPs with known positions in each build.
 */
export function detectBuild(snps: Map<string, SNP>): BuildDetectionResult {
  const matchCounts: Record<GenomeBuild, number> = {
    GRCh36: 0,
    GRCh37: 0,
    GRCh38: 0,
    unknown: 0
  };

  let totalChecked = 0;

  for (const refSnp of BUILD_REFERENCE_SNPS) {
    const userSnp = snps.get(refSnp.rsid);
    if (!userSnp) continue;

    totalChecked++;

    if (userSnp.position === refSnp.positions.GRCh36) {
      matchCounts.GRCh36++;
    }
    if (userSnp.position === refSnp.positions.GRCh37) {
      matchCounts.GRCh37++;
    }
    if (userSnp.position === refSnp.positions.GRCh38) {
      matchCounts.GRCh38++;
    }
  }

  // Find best match
  const builds: GenomeBuild[] = ['GRCh36', 'GRCh37', 'GRCh38'];
  let bestBuild: GenomeBuild = 'unknown';
  let bestCount = 0;

  for (const build of builds) {
    if (matchCounts[build] > bestCount) {
      bestCount = matchCounts[build];
      bestBuild = build;
    }
  }

  const confidence = totalChecked > 0 ? bestCount / totalChecked : 0;

  return {
    build: confidence >= 0.8 ? bestBuild : 'unknown',
    confidence,
    matchCounts
  };
}
```

### 5.3 Main Parser Interface

```typescript
// packages/core/src/parser/index.ts

export interface ParseOptions {
  validateGenotypes?: boolean;  // Default: true
  skipInvalidLines?: boolean;   // Default: true
  maxErrors?: number;           // Default: 100
  onProgress?: (progress: ParseProgress) => void;
}

export interface ParseProgress {
  phase: 'detecting' | 'parsing' | 'validating' | 'complete';
  linesProcessed: number;
  totalLines?: number;
  percentComplete: number;
}

export async function parseGenomeFile(
  file: File | ArrayBuffer | string,
  options: ParseOptions = {}
): Promise<ParsedGenome> {
  const {
    validateGenotypes = true,
    skipInvalidLines = true,
    maxErrors = 100,
    onProgress
  } = options;

  // 1. Read file content
  const content = await readFileContent(file);
  onProgress?.({ phase: 'detecting', linesProcessed: 0, percentComplete: 5 });

  // 2. Detect format
  const format = detectFormat(content.slice(0, 1000));
  if (format === 'unknown') {
    throw new GenomeParseError('UNKNOWN_FORMAT', 'Unable to detect file format');
  }

  // 3. Parse SNPs based on format
  onProgress?.({ phase: 'parsing', linesProcessed: 0, percentComplete: 10 });
  const parser = getParserForFormat(format);
  const { snps, metadata, warnings, errors } = await parser.parse(content, {
    validateGenotypes,
    skipInvalidLines,
    maxErrors,
    onProgress: (lines, total) => {
      const percent = 10 + (lines / total) * 70;
      onProgress?.({ phase: 'parsing', linesProcessed: lines, totalLines: total, percentComplete: percent });
    }
  });

  // 4. Detect build
  onProgress?.({ phase: 'validating', linesProcessed: snps.size, percentComplete: 85 });
  const buildResult = detectBuild(snps);

  // 5. Final validation
  const validation = validateGenome(snps, warnings, errors);
  onProgress?.({ phase: 'complete', linesProcessed: snps.size, percentComplete: 100 });

  return {
    id: crypto.randomUUID(),
    fileName: file instanceof File ? file.name : 'uploaded_genome',
    format,
    build: buildResult.build,
    buildConfidence: buildResult.confidence,
    snpCount: snps.size,
    snps,
    metadata,
    validation,
    parsedAt: new Date()
  };
}
```

### 5.4 Chunked Parsing for Mobile

```typescript
// packages/core/src/parser/chunked-parser.ts

const CHUNK_SIZE = 50_000; // Lines per chunk
const MAX_MEMORY_MB = 200;  // Target for mobile

export async function* parseGenomeChunked(
  file: File,
  options: ParseOptions = {}
): AsyncGenerator<ChunkResult, ParsedGenome> {
  const reader = file.stream().getReader();
  const decoder = new TextDecoder();

  let buffer = '';
  let lineCount = 0;
  let snpBuffer: SNP[] = [];
  const allSnps = new Map<string, SNP>();

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line

    for (const line of lines) {
      if (line.startsWith('#') || !line.trim()) continue;

      const snp = parseLine(line);
      if (snp) {
        snpBuffer.push(snp);
        lineCount++;
      }

      // Yield chunk when buffer full
      if (snpBuffer.length >= CHUNK_SIZE) {
        yield { snps: snpBuffer, linesProcessed: lineCount };

        // Move to persistent storage
        for (const s of snpBuffer) {
          allSnps.set(s.rsid, s);
        }
        snpBuffer = [];

        // Check memory pressure
        if (typeof performance !== 'undefined' && 'memory' in performance) {
          const memory = (performance as any).memory;
          if (memory.usedJSHeapSize > MAX_MEMORY_MB * 1024 * 1024) {
            // Trigger GC hint
            await new Promise(r => setTimeout(r, 0));
          }
        }
      }
    }
  }

  // Process remaining
  for (const s of snpBuffer) {
    allSnps.set(s.rsid, s);
  }

  return buildFinalResult(allSnps, options);
}
```

---

## 6. Validation Rules

### 6.1 Error Codes

| Code | Severity | Description |
|------|----------|-------------|
| `UNKNOWN_FORMAT` | Fatal | Cannot detect file format |
| `MALFORMED_HEADER` | Fatal | Header doesn't match expected pattern |
| `INVALID_CHROMOSOME` | Warning | Chromosome value not recognized |
| `INVALID_POSITION` | Warning | Position is not positive integer |
| `INVALID_GENOTYPE` | Warning | Genotype contains invalid characters |
| `DUPLICATE_RSID` | Warning | Same rsID appears multiple times |
| `UNKNOWN_BUILD` | Warning | Build detection confidence < 80% |
| `INCOMPLETE_FILE` | Warning | File appears truncated |

### 6.2 Genotype Validation

```typescript
const VALID_ALLELES = new Set(['A', 'T', 'C', 'G', '-', 'I', 'D', '0']);

export function validateGenotype(genotype: string): boolean {
  if (genotype.length !== 2 && genotype !== '--') {
    return false;
  }

  for (const allele of genotype) {
    if (!VALID_ALLELES.has(allele.toUpperCase())) {
      return false;
    }
  }

  return true;
}
```

---

## 7. Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Parse time (700K SNPs) | <15 seconds | Chrome DevTools |
| Memory peak (desktop) | <500MB | Chrome Task Manager |
| Memory peak (mobile) | <200MB | Safari Memory Profiler |
| Format detection | <100ms | Performance.now() |
| Build detection | <500ms | Performance.now() |

---

## 8. Testing Strategy

### 8.1 Unit Tests

```typescript
describe('GenomeParser', () => {
  describe('formatDetection', () => {
    it('detects 23andMe v5 format', () => {
      const header = '# rsid\tchromosome\tposition\tgenotype';
      expect(detectFormat(header)).toBe('23andme_v5');
    });

    it('detects AncestryDNA format', () => {
      const header = 'rsid,chromosome,position,allele1,allele2';
      expect(detectFormat(header)).toBe('ancestrydna');
    });
  });

  describe('buildDetection', () => {
    it('correctly identifies GRCh37 build', () => {
      const snps = loadTestFile('grch37_sample.txt');
      const result = detectBuild(snps);
      expect(result.build).toBe('GRCh37');
      expect(result.confidence).toBeGreaterThan(0.95);
    });
  });
});
```

### 8.2 Golden File Testing

Maintain test files from each provider:
- `test/fixtures/23andme_v5_sample.txt`
- `test/fixtures/ancestrydna_sample.csv`
- `test/fixtures/myheritage_sample.csv`
- `test/fixtures/vcf_sample.vcf`

Compare parsed output against known-good results.

---

## 9. Security Considerations

1. **No server upload**: File parsing happens entirely in browser/app
2. **Memory safety**: Chunked parsing prevents OOM attacks
3. **Input validation**: Strict validation prevents malformed data injection
4. **No eval()**: All parsing uses explicit string operations

---

## 10. Future Enhancements

- [ ] BAM file support (Phase 4)
- [ ] Cross-test merging with discrepancy detection
- [ ] Imputed data import (from external services)
- [ ] Parallel parsing using Web Workers

---

**Document Version:** 1.0.0
**Author:** GenomeForge Team
**Last Updated:** 2026-01-28
