# Software Design Document: Database Matcher

**Feature:** ClinVar/PharmGKB Database Integration
**Package:** `@genomeforge/databases`
**Phase:** 1 (MVP)
**Status:** Planned

---

## 1. Overview

### 1.1 Purpose
Match user genetic variants against clinical databases (ClinVar, PharmGKB) to identify pathogenic variants, drug interactions, and carrier status. All matching occurs client-side with pre-processed database bundles.

### 1.2 Scope
- ClinVar pathogenicity lookup with star ratings
- PharmGKB drug-gene interaction matching
- gnomAD population frequency lookup
- Offline-capable with IndexedDB storage
- Delta update mechanism for database freshness

### 1.3 Database Licenses

| Database | License | Commercial Use | Bundle Size |
|----------|---------|----------------|-------------|
| ClinVar | Public Domain | Yes | ~173MB compressed |
| PharmGKB | CC BY-SA 4.0 | Yes (SaaS OK) | ~50MB |
| gnomAD | ODbL 1.0 | Yes (copyleft) | ~100MB subset |

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    DatabaseMatcher                               │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ ClinVarLoader│    │PharmGKBLoader│    │ gnomADLoader │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │                │
│         └───────────────────┼───────────────────┘                │
│                             ▼                                    │
│                      ┌──────────────┐                           │
│                      │ IndexedDB    │                           │
│                      │ (offline)    │                           │
│                      └──────────────┘                           │
│                             │                                    │
│                             ▼                                    │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ SNPMatcher   │───▶│ ResultMerger │───▶│AnnotatedSNP │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
ParsedGenome → SNP rsIDs → IndexedDB Lookup → Merge Results → AnnotatedGenome
```

---

## 3. Database Schemas

### 3.1 ClinVar Schema

```typescript
// packages/types/src/databases.ts

export type ClinicalSignificance =
  | 'pathogenic'
  | 'likely_pathogenic'
  | 'uncertain_significance'
  | 'likely_benign'
  | 'benign'
  | 'conflicting'
  | 'not_provided';

export type ReviewStatus = 0 | 1 | 2 | 3 | 4; // Star rating

export interface ClinVarVariant {
  rsid: string;
  vcv: string;                           // VCV accession (VCV000123456)
  gene: string;                          // Gene symbol
  geneId: number;                        // Entrez Gene ID
  clinicalSignificance: ClinicalSignificance;
  reviewStatus: ReviewStatus;            // 0-4 stars
  conditions: ClinVarCondition[];
  hgvs?: string;                         // HGVS expression
  molecularConsequence?: string;         // e.g., "missense_variant"
  lastEvaluated?: string;                // ISO date
}

export interface ClinVarCondition {
  name: string;
  medgenId?: string;
  traits: string[];
}
```

### 3.2 PharmGKB Schema

```typescript
export type EvidenceLevel = '1A' | '1B' | '2A' | '2B' | '3' | '4';

export interface PharmGKBVariant {
  rsid: string;
  gene: string;
  drugs: DrugGeneInteraction[];
  hasCPICGuideline: boolean;
  hasDPWGGuideline: boolean;
}

export interface DrugGeneInteraction {
  drugName: string;
  drugId: string;                        // PharmGKB ID
  evidenceLevel: EvidenceLevel;
  phenotypeCategory?: string;            // e.g., "Toxicity"
  significance: string;                  // e.g., "Yes" for significant
  annotation: string;                    // Summary text
  cpicLevel?: string;                    // CPIC classification
  fdaLabel?: boolean;                    // FDA label annotation
}

export interface CPICGuideline {
  guidelineId: string;
  gene: string;
  drug: string;
  diplotypes: DiplotypeRecommendation[];
}

export interface DiplotypeRecommendation {
  diplotype: string;                     // e.g., "*1/*2"
  phenotype: string;                     // e.g., "Intermediate Metabolizer"
  recommendation: string;                // Dosing recommendation
  strength: string;                      // "Strong", "Moderate", "Optional"
}
```

### 3.3 gnomAD Schema

```typescript
export type Population =
  | 'afr'   // African/African American
  | 'amr'   // Latino/Admixed American
  | 'asj'   // Ashkenazi Jewish
  | 'eas'   // East Asian
  | 'fin'   // Finnish
  | 'mid'   // Middle Eastern
  | 'nfe'   // Non-Finnish European
  | 'sas'   // South Asian
  | 'oth';  // Other

export interface GnomADFrequency {
  rsid: string;
  totalAF: number;                       // Global allele frequency
  populationAF: Record<Population, number>;
  homozygoteCount: number;
  heterozygoteCount: number;
}
```

---

## 4. IndexedDB Structure

### 4.1 Database Schema

```typescript
// packages/databases/src/indexeddb-schema.ts

import Dexie, { Table } from 'dexie';

export class GenomeForgeDB extends Dexie {
  clinvar!: Table<ClinVarVariant, string>;
  pharmgkb!: Table<PharmGKBVariant, string>;
  gnomad!: Table<GnomADFrequency, string>;
  metadata!: Table<DatabaseMetadata, string>;

  constructor() {
    super('GenomeForgeDB');

    this.version(1).stores({
      clinvar: 'rsid, gene, clinicalSignificance',
      pharmgkb: 'rsid, gene',
      gnomad: 'rsid',
      metadata: 'database'
    });
  }
}

export interface DatabaseMetadata {
  database: 'clinvar' | 'pharmgkb' | 'gnomad';
  version: string;
  lastUpdated: Date;
  recordCount: number;
  checksum: string;
}
```

### 4.2 Database Initialization

```typescript
// packages/databases/src/loader.ts

export async function initializeDatabases(
  options: InitOptions = {}
): Promise<DatabaseStatus> {
  const db = new GenomeForgeDB();

  const status: DatabaseStatus = {
    clinvar: { loaded: false, version: null, recordCount: 0 },
    pharmgkb: { loaded: false, version: null, recordCount: 0 },
    gnomad: { loaded: false, version: null, recordCount: 0 }
  };

  // Check existing data
  const existingMeta = await db.metadata.toArray();

  for (const meta of existingMeta) {
    status[meta.database] = {
      loaded: true,
      version: meta.version,
      recordCount: meta.recordCount
    };
  }

  // Load missing databases from bundled data
  if (!status.clinvar.loaded) {
    await loadClinVar(db, options.onProgress);
    status.clinvar.loaded = true;
  }

  if (!status.pharmgkb.loaded) {
    await loadPharmGKB(db, options.onProgress);
    status.pharmgkb.loaded = true;
  }

  return status;
}
```

---

## 5. ClinVar Integration

### 5.1 Data Processing Pipeline

```
ClinVar VCF (NCBI) → Python preprocessing → JSON bundle → App bundle
```

### 5.2 Preprocessing Script

```python
# scripts/process_clinvar.py

import vcfpy
import json
import gzip

def process_clinvar(input_vcf: str, output_json: str):
    """Convert ClinVar VCF to optimized JSON for client-side use."""

    variants = []
    reader = vcfpy.Reader.from_path(input_vcf)

    for record in reader:
        # Skip variants without rsID
        if not record.ID or not record.ID[0].startswith('rs'):
            continue

        rsid = record.ID[0]

        # Extract ClinVar-specific INFO fields
        variant = {
            'rsid': rsid,
            'vcv': record.INFO.get('CLNVCSO', [''])[0],
            'gene': record.INFO.get('GENEINFO', '').split(':')[0],
            'clinicalSignificance': map_significance(record.INFO.get('CLNSIG', [''])[0]),
            'reviewStatus': map_review_status(record.INFO.get('CLNREVSTAT', [''])[0]),
            'conditions': extract_conditions(record.INFO),
            'hgvs': record.INFO.get('CLNHGVS', [''])[0],
            'molecularConsequence': record.INFO.get('MC', [''])[0]
        }

        variants.append(variant)

    # Write compressed JSON
    with gzip.open(output_json, 'wt') as f:
        json.dump(variants, f)

    print(f"Processed {len(variants)} variants")

def map_significance(sig: str) -> str:
    mapping = {
        'Pathogenic': 'pathogenic',
        'Likely_pathogenic': 'likely_pathogenic',
        'Uncertain_significance': 'uncertain_significance',
        'Likely_benign': 'likely_benign',
        'Benign': 'benign',
        'Conflicting_interpretations_of_pathogenicity': 'conflicting'
    }
    return mapping.get(sig, 'not_provided')

def map_review_status(status: str) -> int:
    mapping = {
        'practice_guideline': 4,
        'reviewed_by_expert_panel': 3,
        'criteria_provided,_multiple_submitters,_no_conflicts': 2,
        'criteria_provided,_single_submitter': 1,
        'no_assertion_criteria_provided': 0
    }
    return mapping.get(status, 0)
```

### 5.3 Client-Side Loader

```typescript
// packages/databases/src/clinvar/loader.ts

export async function loadClinVar(
  db: GenomeForgeDB,
  onProgress?: (progress: LoadProgress) => void
): Promise<void> {
  // Fetch bundled data (or CDN for web)
  const response = await fetch('/databases/clinvar/clinvar-snps.json.gz');
  const compressed = await response.arrayBuffer();

  // Decompress
  const decompressed = pako.ungzip(new Uint8Array(compressed), { to: 'string' });
  const variants: ClinVarVariant[] = JSON.parse(decompressed);

  onProgress?.({ phase: 'loading', current: 0, total: variants.length });

  // Bulk insert with chunking
  const CHUNK_SIZE = 10000;
  for (let i = 0; i < variants.length; i += CHUNK_SIZE) {
    const chunk = variants.slice(i, i + CHUNK_SIZE);
    await db.clinvar.bulkPut(chunk);
    onProgress?.({ phase: 'loading', current: i + chunk.length, total: variants.length });
  }

  // Update metadata
  await db.metadata.put({
    database: 'clinvar',
    version: '2026-01-25', // From ClinVar release
    lastUpdated: new Date(),
    recordCount: variants.length,
    checksum: await computeChecksum(compressed)
  });
}
```

---

## 6. PharmGKB Integration

### 6.1 License Compliance

PharmGKB uses CC BY-SA 4.0. Key compliance requirements:

1. **Attribution**: Display "Data from PharmGKB" in UI
2. **ShareAlike**: If users export data, it must be CC BY-SA
3. **No direct sale**: Cannot sell database access directly

```typescript
// packages/databases/src/pharmgkb/attribution.ts

export const PHARMGKB_ATTRIBUTION = {
  text: 'Pharmacogenomics data provided by PharmGKB',
  url: 'https://www.pharmgkb.org/',
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/'
};
```

### 6.2 Drug-Gene Matching

```typescript
// packages/databases/src/pharmgkb/matcher.ts

export interface DrugInteractionResult {
  rsid: string;
  gene: string;
  userGenotype: string;
  interactions: DrugInteraction[];
  cpicGuidelines: CPICGuideline[];
}

export async function findDrugInteractions(
  genome: ParsedGenome,
  db: GenomeForgeDB
): Promise<DrugInteractionResult[]> {
  const results: DrugInteractionResult[] = [];

  // Get all PharmGKB rsIDs that user has
  const userRsids = Array.from(genome.snps.keys());
  const pgkbVariants = await db.pharmgkb
    .where('rsid')
    .anyOf(userRsids)
    .toArray();

  for (const variant of pgkbVariants) {
    const userSNP = genome.snps.get(variant.rsid);
    if (!userSNP) continue;

    results.push({
      rsid: variant.rsid,
      gene: variant.gene,
      userGenotype: userSNP.genotype,
      interactions: variant.drugs,
      cpicGuidelines: variant.hasCPICGuideline
        ? await fetchCPICGuidelines(variant.gene, db)
        : []
    });
  }

  return results;
}
```

---

## 7. SNP Matching Engine

### 7.1 Unified Matcher

```typescript
// packages/databases/src/matcher/index.ts

export interface AnnotatedSNP {
  snp: SNP;
  clinvar?: ClinVarVariant;
  pharmgkb?: PharmGKBVariant;
  gnomad?: GnomADFrequency;
  impactScore: number;  // 0-6 magnitude
  category: 'pathogenic' | 'drug' | 'carrier' | 'protective' | 'neutral';
}

export interface MatchResult {
  totalSNPs: number;
  matchedSNPs: number;
  pathogenicCount: number;
  drugInteractionCount: number;
  carrierCount: number;
  annotatedSNPs: AnnotatedSNP[];
  summary: MatchSummary;
}

export async function matchGenome(
  genome: ParsedGenome,
  options: MatchOptions = {}
): Promise<MatchResult> {
  const db = new GenomeForgeDB();
  const annotated: AnnotatedSNP[] = [];

  const userRsids = Array.from(genome.snps.keys());

  // Parallel lookups
  const [clinvarMatches, pharmgkbMatches, gnomadMatches] = await Promise.all([
    db.clinvar.where('rsid').anyOf(userRsids).toArray(),
    db.pharmgkb.where('rsid').anyOf(userRsids).toArray(),
    options.includeFrequency
      ? db.gnomad.where('rsid').anyOf(userRsids).toArray()
      : []
  ]);

  // Index by rsid for fast lookup
  const clinvarIndex = new Map(clinvarMatches.map(v => [v.rsid, v]));
  const pharmgkbIndex = new Map(pharmgkbMatches.map(v => [v.rsid, v]));
  const gnomadIndex = new Map(gnomadMatches.map(v => [v.rsid, v]));

  // Process each user SNP
  for (const [rsid, snp] of genome.snps) {
    const clinvar = clinvarIndex.get(rsid);
    const pharmgkb = pharmgkbIndex.get(rsid);
    const gnomad = gnomadIndex.get(rsid);

    // Skip if no database matches
    if (!clinvar && !pharmgkb) continue;

    const impactScore = calculateImpactScore(clinvar, pharmgkb, snp.genotype);
    const category = categorizeVariant(clinvar, pharmgkb);

    annotated.push({
      snp,
      clinvar,
      pharmgkb,
      gnomad,
      impactScore,
      category
    });
  }

  // Sort by impact score (highest first)
  annotated.sort((a, b) => b.impactScore - a.impactScore);

  return {
    totalSNPs: genome.snpCount,
    matchedSNPs: annotated.length,
    pathogenicCount: annotated.filter(a => a.category === 'pathogenic').length,
    drugInteractionCount: annotated.filter(a => a.category === 'drug').length,
    carrierCount: annotated.filter(a => a.category === 'carrier').length,
    annotatedSNPs: annotated,
    summary: generateSummary(annotated)
  };
}
```

### 7.2 Impact Score Calculation

```typescript
// packages/databases/src/matcher/scoring.ts

/**
 * Calculate impact score (0-6) based on clinical significance and evidence.
 * Higher scores = more clinically relevant.
 */
export function calculateImpactScore(
  clinvar?: ClinVarVariant,
  pharmgkb?: PharmGKBVariant,
  genotype?: string
): number {
  let score = 0;

  // ClinVar significance
  if (clinvar) {
    switch (clinvar.clinicalSignificance) {
      case 'pathogenic':
        score += 4;
        break;
      case 'likely_pathogenic':
        score += 3;
        break;
      case 'uncertain_significance':
        score += 1;
        break;
      case 'likely_benign':
      case 'benign':
        score += 0;
        break;
    }

    // Review status bonus
    score += clinvar.reviewStatus * 0.25; // 0-1 bonus for stars
  }

  // PharmGKB evidence
  if (pharmgkb) {
    const highestEvidence = pharmgkb.drugs.reduce((best, drug) => {
      const level = parseFloat(drug.evidenceLevel.replace(/[AB]/, ''));
      return Math.min(best, level);
    }, 5);

    // Level 1A = +2, 1B = +1.5, 2A = +1, etc.
    score += Math.max(0, 2.5 - highestEvidence * 0.5);

    // FDA label bonus
    if (pharmgkb.drugs.some(d => d.fdaLabel)) {
      score += 0.5;
    }
  }

  return Math.min(6, score); // Cap at 6
}
```

---

## 8. Database Updates

### 8.1 Delta Update Strategy

```typescript
// packages/databases/src/updater.ts

export interface UpdateInfo {
  database: string;
  currentVersion: string;
  latestVersion: string;
  updateSize: number;
  isDelta: boolean;
}

export async function checkForUpdates(): Promise<UpdateInfo[]> {
  const db = new GenomeForgeDB();
  const currentMeta = await db.metadata.toArray();

  // Fetch manifest from CDN
  const manifest = await fetch('/databases/manifest.json').then(r => r.json());

  const updates: UpdateInfo[] = [];

  for (const meta of currentMeta) {
    const latest = manifest[meta.database];
    if (latest && latest.version !== meta.version) {
      updates.push({
        database: meta.database,
        currentVersion: meta.version,
        latestVersion: latest.version,
        updateSize: latest.deltaSize || latest.fullSize,
        isDelta: !!latest.deltaFrom?.[meta.version]
      });
    }
  }

  return updates;
}

export async function applyUpdate(
  database: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  const manifest = await fetch('/databases/manifest.json').then(r => r.json());
  const db = new GenomeForgeDB();
  const currentMeta = await db.metadata.get(database);

  const latest = manifest[database];

  // Check if delta available
  if (latest.deltaFrom?.[currentMeta?.version]) {
    await applyDeltaUpdate(database, latest.deltaFrom[currentMeta.version], onProgress);
  } else {
    await applyFullUpdate(database, latest.fullUrl, onProgress);
  }
}
```

### 8.2 Background Update Service Worker

```typescript
// apps/web/src/sw.ts

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'database-update') {
    event.waitUntil(checkAndUpdateDatabases());
  }
});

async function checkAndUpdateDatabases() {
  const updates = await checkForUpdates();

  if (updates.length > 0) {
    // Notify user
    self.registration.showNotification('GenomeForge Database Update', {
      body: `${updates.length} database update(s) available`,
      tag: 'db-update'
    });
  }
}
```

---

## 9. Performance Optimization

### 9.1 Query Optimization

```typescript
// Batch queries to avoid N+1
export async function batchLookup(
  rsids: string[],
  db: GenomeForgeDB
): Promise<Map<string, AnnotatedSNP>> {
  // Single query with anyOf instead of N queries
  const variants = await db.clinvar
    .where('rsid')
    .anyOf(rsids)
    .toArray();

  return new Map(variants.map(v => [v.rsid, v]));
}
```

### 9.2 Memory Management

```typescript
// Stream results for large genomes
export async function* matchGenomeStreaming(
  genome: ParsedGenome
): AsyncGenerator<AnnotatedSNP> {
  const BATCH_SIZE = 1000;
  const rsids = Array.from(genome.snps.keys());

  for (let i = 0; i < rsids.length; i += BATCH_SIZE) {
    const batch = rsids.slice(i, i + BATCH_SIZE);
    const matches = await batchLookup(batch, db);

    for (const [rsid, match] of matches) {
      yield match;
    }

    // Allow GC between batches
    await new Promise(r => setTimeout(r, 0));
  }
}
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

```typescript
describe('DatabaseMatcher', () => {
  beforeEach(async () => {
    // Initialize test database with fixture data
    await loadTestFixtures();
  });

  it('identifies pathogenic ClinVar variants', async () => {
    const genome = loadTestGenome('brca1_carrier.txt');
    const result = await matchGenome(genome);

    expect(result.pathogenicCount).toBeGreaterThan(0);
    expect(result.annotatedSNPs.some(s => s.clinvar?.gene === 'BRCA1')).toBe(true);
  });

  it('identifies drug interactions', async () => {
    const genome = loadTestGenome('cyp2d6_poor_metabolizer.txt');
    const result = await matchGenome(genome);

    const codeine = result.annotatedSNPs.find(s =>
      s.pharmgkb?.drugs.some(d => d.drugName === 'codeine')
    );
    expect(codeine).toBeDefined();
  });
});
```

### 10.2 Accuracy Validation

Compare results against Promethease for reference genomes:
- BRCA1/2 carrier detection
- CYP2D6 metabolizer status
- MTHFR variant identification

---

**Document Version:** 1.0.0
**Author:** GenomeForge Team
**Last Updated:** 2026-01-28
