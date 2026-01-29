/**
 * PharmGKB database loader
 *
 * Loads the pre-processed PharmGKB database from a compressed JSON bundle.
 * Contains drug-gene interactions and CPIC dosing guidelines.
 *
 * Data source: https://www.pharmgkb.org/downloads
 * License: CC BY-SA 4.0 (attribution required, SaaS use permitted)
 *
 * IMPORTANT: Per CC BY-SA 4.0, attribution is required:
 * "Pharmacogenomics data provided by PharmGKB (https://www.pharmgkb.org)"
 *
 * @packageDocumentation
 */

import pako from 'pako';
import { db } from '../db';
import type { PharmGKBRecord, DrugInteraction, DatabaseMetadata } from '../types';

/**
 * PharmGKB loader configuration
 */
export interface PharmGKBConfig {
  /** URL to the pre-processed PharmGKB JSON bundle */
  bundleUrl: string;
  /** Callback for progress updates (0-100) */
  onProgress?: (progress: number) => void;
  /** Callback for status messages */
  onStatus?: (message: string) => void;
  /** Abort signal for cancellation */
  abortSignal?: AbortSignal;
}

/**
 * PharmGKB query options for filtering
 */
export interface PharmGKBQueryOptions {
  /** Filter by gene name */
  gene?: string;
  /** Filter by evidence level (1A, 1B, 2A, 2B, 3, 4) */
  evidenceLevels?: string[];
  /** Filter by CPIC level (A, B, C, D) */
  cpicLevels?: string[];
  /** Filter by drug category */
  drugCategory?: string;
  /** Filter by phenotype keyword */
  phenotype?: string;
  /** Limit number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * PharmGKB database statistics
 */
export interface PharmGKBStats {
  totalRecords: number;
  byEvidenceLevel: Record<string, number>;
  byCpicLevel: Record<string, number>;
  uniqueGenes: number;
  uniqueDrugs: number;
  totalDrugInteractions: number;
}

/**
 * Version info for update checking
 */
export interface PharmGKBVersionInfo {
  currentVersion: string | null;
  currentDate: Date | null;
  recordCount: number;
  needsUpdate: boolean;
  latestVersion?: string;
  latestDate?: Date;
}

/**
 * Metabolizer phenotype classification
 */
export type MetabolizerPhenotype = 'poor' | 'intermediate' | 'normal' | 'rapid' | 'ultrarapid' | 'unknown';

/**
 * Parsed metabolizer result
 */
export interface MetabolizerResult {
  category: MetabolizerPhenotype;
  description: string;
  clinicalImplication: string;
}

/**
 * Drug lookup result with variant info
 */
export interface DrugLookupResult {
  drug: DrugInteraction;
  variant: PharmGKBRecord;
  gene: string;
  evidenceLevel: string;
  cpicLevel?: string;
}

/**
 * Bundle format structure
 */
interface PharmGKBBundle {
  version: string;
  generated: string;
  recordCount: number;
  checksum?: string;
  records: PharmGKBRecord[];
}

/**
 * PharmGKB database loader
 *
 * Provides loading, querying, and management of pharmacogenomics data.
 * Optimized for mobile with streaming decompression and batch inserts.
 */
export class PharmGKBLoader {
  private config: PharmGKBConfig;

  constructor(config: PharmGKBConfig) {
    this.config = config;
  }

  /**
   * Load PharmGKB database into IndexedDB
   *
   * Memory-optimized loading process:
   * 1. Streams download to avoid holding full response in memory
   * 2. Decompresses gzipped data
   * 3. Parses JSON and inserts in batches
   */
  async load(): Promise<void> {
    const { bundleUrl, onProgress, onStatus, abortSignal } = this.config;

    // Check for abort before starting
    if (abortSignal?.aborted) {
      throw new DOMException('Loading aborted', 'AbortError');
    }

    onStatus?.('Downloading PharmGKB database...');
    onProgress?.(0);

    // Fetch the compressed bundle
    const response = await fetch(bundleUrl, { signal: abortSignal });
    if (!response.ok) {
      throw new Error(`Failed to download PharmGKB bundle: ${response.status} ${response.statusText}`);
    }

    const contentLength = response.headers.get('content-length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

    // Stream and collect chunks
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;

    try {
      while (true) {
        // Check for abort during download
        if (abortSignal?.aborted) {
          reader.cancel();
          throw new DOMException('Loading aborted', 'AbortError');
        }

        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedBytes += value.length;

        if (totalBytes > 0) {
          const downloadProgress = Math.round((receivedBytes / totalBytes) * 40);
          onProgress?.(downloadProgress);
          onStatus?.(`Downloading... ${formatBytes(receivedBytes)} / ${formatBytes(totalBytes)}`);
        }
      }
    } finally {
      reader.releaseLock();
    }

    onStatus?.('Decompressing...');
    onProgress?.(45);

    // Combine chunks into single array
    const compressedData = new Uint8Array(receivedBytes);
    let offset = 0;
    for (const chunk of chunks) {
      compressedData.set(chunk, offset);
      offset += chunk.length;
    }

    // Clear chunks array to free memory
    chunks.length = 0;

    // Decompress using pako
    let decompressed: string;
    try {
      decompressed = pako.ungzip(compressedData, { to: 'string' });
    } catch (error) {
      throw new Error(`Failed to decompress PharmGKB bundle: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    onProgress?.(55);
    onStatus?.('Parsing database...');

    // Parse JSON
    let bundle: PharmGKBBundle;
    try {
      bundle = JSON.parse(decompressed);
    } catch (error) {
      throw new Error(`Failed to parse PharmGKB JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Validate bundle structure
    if (!bundle.version || !bundle.records || !Array.isArray(bundle.records)) {
      throw new Error('Invalid PharmGKB bundle format');
    }

    onProgress?.(60);
    onStatus?.(`Loading ${bundle.recordCount.toLocaleString()} drug-gene interactions...`);

    // Clear existing data before loading new data
    await db.pharmgkb.clear();

    // Batch insert into IndexedDB
    const BATCH_SIZE = 5000;
    const records = bundle.records;
    const totalRecords = records.length;

    for (let i = 0; i < totalRecords; i += BATCH_SIZE) {
      // Check for abort during insertion
      if (abortSignal?.aborted) {
        await db.pharmgkb.clear();
        throw new DOMException('Loading aborted', 'AbortError');
      }

      const batch = records.slice(i, i + BATCH_SIZE);
      const validatedBatch = batch.map(record => normalizeRecord(record));

      await db.pharmgkb.bulkPut(validatedBatch);

      const progress = 60 + Math.round(((i + batch.length) / totalRecords) * 35);
      onProgress?.(progress);

      if ((i + BATCH_SIZE) % 10000 === 0 || i + BATCH_SIZE >= totalRecords) {
        onStatus?.(`Loaded ${Math.min(i + BATCH_SIZE, totalRecords).toLocaleString()} / ${totalRecords.toLocaleString()} interactions`);
      }
    }

    // Store metadata
    const metadata: DatabaseMetadata = {
      name: 'pharmgkb',
      version: bundle.version,
      lastUpdated: new Date(bundle.generated),
      recordCount: totalRecords,
      checksum: bundle.checksum || '',
      source: 'https://www.pharmgkb.org',
      license: 'CC BY-SA 4.0'
    };

    await db.metadata.put(metadata);

    onProgress?.(100);
    onStatus?.(`PharmGKB database loaded successfully (${totalRecords.toLocaleString()} interactions)`);
  }

  /**
   * Check if PharmGKB database is loaded
   */
  static async isLoaded(): Promise<boolean> {
    const metadata = await db.metadata.get('pharmgkb');
    return metadata !== undefined && metadata.recordCount > 0;
  }

  /**
   * Get current version info and check if update is needed
   */
  static async getVersionInfo(latestVersionUrl?: string): Promise<PharmGKBVersionInfo> {
    const metadata = await db.metadata.get('pharmgkb');

    const info: PharmGKBVersionInfo = {
      currentVersion: metadata?.version || null,
      currentDate: metadata?.lastUpdated || null,
      recordCount: metadata?.recordCount || 0,
      needsUpdate: false
    };

    if (latestVersionUrl) {
      try {
        const response = await fetch(latestVersionUrl);
        if (response.ok) {
          const versionData = await response.json() as { version: string; generated: string };
          info.latestVersion = versionData.version;
          info.latestDate = new Date(versionData.generated);

          if (!metadata || metadata.version !== versionData.version) {
            info.needsUpdate = true;
          }
        }
      } catch {
        // Silently ignore version check failures
      }
    } else if (!metadata) {
      info.needsUpdate = true;
    }

    return info;
  }

  /**
   * Get database metadata
   */
  static async getMetadata(): Promise<DatabaseMetadata | undefined> {
    return db.metadata.get('pharmgkb');
  }

  /**
   * Look up drug interactions for a variant by rsID
   */
  static async lookup(rsid: string): Promise<PharmGKBRecord | undefined> {
    const normalizedRsid = normalizeRsid(rsid);
    return db.pharmgkb.get(normalizedRsid);
  }

  /**
   * Look up multiple variants by rsID (batch)
   */
  static async lookupBatch(rsids: string[]): Promise<Map<string, PharmGKBRecord>> {
    const results = new Map<string, PharmGKBRecord>();

    if (rsids.length === 0) {
      return results;
    }

    const normalizedRsids = rsids.map(normalizeRsid);
    const records = await db.pharmgkb.where('rsid').anyOf(normalizedRsids).toArray();

    for (const record of records) {
      results.set(record.rsid, record);
    }

    return results;
  }

  /**
   * Look up all variants for a gene
   */
  static async lookupByGene(gene: string): Promise<PharmGKBRecord[]> {
    const normalizedGene = gene.toUpperCase().trim();
    return db.pharmgkb.where('gene').equals(normalizedGene).toArray();
  }

  /**
   * Look up variants with filters
   */
  static async query(options: PharmGKBQueryOptions = {}): Promise<PharmGKBRecord[]> {
    const { gene, evidenceLevels, cpicLevels, drugCategory, phenotype, limit, offset } = options;

    let collection = db.pharmgkb.toCollection();

    // Apply gene filter first as it can use index
    if (gene) {
      collection = db.pharmgkb.where('gene').equals(gene.toUpperCase().trim());
    }

    // Apply additional filters
    const filters: ((record: PharmGKBRecord) => boolean)[] = [];

    if (evidenceLevels && evidenceLevels.length > 0) {
      const normalizedLevels = evidenceLevels.map(l => l.toUpperCase());
      filters.push(record => normalizedLevels.includes(record.evidenceLevel?.toUpperCase() || ''));
    }

    if (cpicLevels && cpicLevels.length > 0) {
      const normalizedLevels = cpicLevels.map(l => l.toUpperCase());
      filters.push(record => record.cpicLevel !== undefined && normalizedLevels.includes(record.cpicLevel.toUpperCase()));
    }

    if (drugCategory) {
      const category = drugCategory.toLowerCase();
      filters.push(record =>
        record.drugs.some(drug =>
          drug.categories.some(c => c.toLowerCase().includes(category))
        )
      );
    }

    if (phenotype) {
      const term = phenotype.toLowerCase();
      filters.push(record =>
        record.phenotypes.some(p => p.toLowerCase().includes(term))
      );
    }

    // Apply all filters
    if (filters.length > 0) {
      collection = collection.filter(record => filters.every(f => f(record)));
    }

    // Apply pagination
    if (offset) {
      collection = collection.offset(offset);
    }

    if (limit) {
      collection = collection.limit(limit);
    }

    return collection.toArray();
  }

  /**
   * Get all variants affecting a specific drug
   */
  static async getVariantsForDrug(drugName: string): Promise<PharmGKBRecord[]> {
    const term = drugName.toLowerCase();
    return db.pharmgkb
      .filter(record =>
        record.drugs.some(drug =>
          drug.name.toLowerCase().includes(term) ||
          drug.genericName.toLowerCase().includes(term)
        )
      )
      .toArray();
  }

  /**
   * Get all variants for a gene (e.g., CYP2D6)
   */
  static async getVariantsForGene(gene: string): Promise<PharmGKBRecord[]> {
    return PharmGKBLoader.lookupByGene(gene);
  }

  /**
   * Get variants by evidence level
   */
  static async getByEvidenceLevel(level: string): Promise<PharmGKBRecord[]> {
    const normalizedLevel = level.toUpperCase();
    return db.pharmgkb
      .filter(record => record.evidenceLevel?.toUpperCase() === normalizedLevel)
      .toArray();
  }

  /**
   * Get variants by CPIC level
   */
  static async getByCpicLevel(level: string): Promise<PharmGKBRecord[]> {
    const normalizedLevel = level.toUpperCase();
    return db.pharmgkb
      .filter(record => record.cpicLevel?.toUpperCase() === normalizedLevel)
      .toArray();
  }

  /**
   * Get high-evidence variants (1A or 1B)
   */
  static async getHighEvidenceVariants(): Promise<PharmGKBRecord[]> {
    return db.pharmgkb
      .filter(record => {
        const level = record.evidenceLevel?.toUpperCase() || '';
        return level === '1A' || level === '1B';
      })
      .toArray();
  }

  /**
   * Get variants with actionable CPIC guidelines (A or B level)
   */
  static async getActionableVariants(): Promise<PharmGKBRecord[]> {
    return db.pharmgkb
      .filter(record => {
        const level = record.cpicLevel?.toUpperCase() || '';
        return level === 'A' || level === 'B';
      })
      .toArray();
  }

  /**
   * Search drugs by name or category
   */
  static async searchDrugs(searchTerm: string): Promise<DrugLookupResult[]> {
    const term = searchTerm.toLowerCase();
    const records = await db.pharmgkb
      .filter(record =>
        record.drugs.some(drug =>
          drug.name.toLowerCase().includes(term) ||
          drug.genericName.toLowerCase().includes(term) ||
          drug.categories.some(c => c.toLowerCase().includes(term))
        )
      )
      .toArray();

    const results: DrugLookupResult[] = [];

    for (const record of records) {
      for (const drug of record.drugs) {
        if (
          drug.name.toLowerCase().includes(term) ||
          drug.genericName.toLowerCase().includes(term) ||
          drug.categories.some(c => c.toLowerCase().includes(term))
        ) {
          results.push({
            drug,
            variant: record,
            gene: record.gene,
            evidenceLevel: record.evidenceLevel,
            cpicLevel: record.cpicLevel
          });
        }
      }
    }

    return results;
  }

  /**
   * Get all unique drugs in the database
   */
  static async getAllDrugs(): Promise<string[]> {
    const records = await db.pharmgkb.toArray();
    const drugs = new Set<string>();

    for (const record of records) {
      for (const drug of record.drugs) {
        drugs.add(drug.genericName || drug.name);
      }
    }

    return Array.from(drugs).sort();
  }

  /**
   * Get all unique genes in the database
   */
  static async getAllGenes(): Promise<string[]> {
    const records = await db.pharmgkb.toArray();
    const genes = new Set<string>();

    for (const record of records) {
      if (record.gene) {
        genes.add(record.gene);
      }
    }

    return Array.from(genes).sort();
  }

  /**
   * Get database statistics
   */
  static async getStats(): Promise<PharmGKBStats> {
    const records = await db.pharmgkb.toArray();

    const byEvidenceLevel: Record<string, number> = {};
    const byCpicLevel: Record<string, number> = {};
    const genes = new Set<string>();
    const drugs = new Set<string>();
    let totalDrugInteractions = 0;

    for (const record of records) {
      // Count by evidence level
      const evidenceLevel = record.evidenceLevel || 'Unknown';
      byEvidenceLevel[evidenceLevel] = (byEvidenceLevel[evidenceLevel] || 0) + 1;

      // Count by CPIC level
      if (record.cpicLevel) {
        byCpicLevel[record.cpicLevel] = (byCpicLevel[record.cpicLevel] || 0) + 1;
      }

      // Track unique genes
      if (record.gene) {
        genes.add(record.gene);
      }

      // Track unique drugs and count interactions
      for (const drug of record.drugs) {
        drugs.add(drug.genericName || drug.name);
        totalDrugInteractions++;
      }
    }

    return {
      totalRecords: records.length,
      byEvidenceLevel,
      byCpicLevel,
      uniqueGenes: genes.size,
      uniqueDrugs: drugs.size,
      totalDrugInteractions
    };
  }

  /**
   * Clear all PharmGKB data
   */
  static async clear(): Promise<void> {
    await db.pharmgkb.clear();
    await db.metadata.delete('pharmgkb');
  }

  /**
   * Get the required attribution text for PharmGKB data
   */
  static getAttribution(): string {
    return 'Pharmacogenomics data provided by PharmGKB (https://www.pharmgkb.org)';
  }

  /**
   * Get the license information
   */
  static getLicenseInfo(): { license: string; attribution: string; url: string } {
    return {
      license: 'CC BY-SA 4.0',
      attribution: PharmGKBLoader.getAttribution(),
      url: 'https://creativecommons.org/licenses/by-sa/4.0/'
    };
  }

  /**
   * Parse CPIC level to human-readable text
   */
  static getCpicLevelText(level: string): string {
    const normalized = level.toUpperCase();
    switch (normalized) {
      case 'A':
        return 'Strong recommendation - prescribing action is recommended';
      case 'B':
        return 'Moderate recommendation - prescribing action is recommended';
      case 'C':
        return 'Optional recommendation - may be used to guide prescribing';
      case 'D':
        return 'Insufficient evidence - no prescribing recommendation';
      default:
        return 'No CPIC guideline available';
    }
  }

  /**
   * Get CPIC level severity for sorting/prioritization
   */
  static getCpicLevelSeverity(level: string | undefined): number {
    if (!level) return -1;
    const severityMap: Record<string, number> = {
      'A': 4,
      'B': 3,
      'C': 2,
      'D': 1
    };
    return severityMap[level.toUpperCase()] ?? -1;
  }

  /**
   * Parse evidence level to human-readable text
   */
  static getEvidenceLevelText(level: string): string {
    const normalized = level.toUpperCase();
    switch (normalized) {
      case '1A':
        return 'Variant-drug combination in a CPIC or medical society guideline';
      case '1B':
        return 'Variant-drug combination with strong evidence for clinical significance';
      case '2A':
        return 'Variant-drug combination with functional significance (VIP)';
      case '2B':
        return 'Variant-drug combination with moderate evidence';
      case '3':
        return 'Variant-drug annotation with low-level or conflicting evidence';
      case '4':
        return 'Variant-drug combination based on case reports or other weak evidence';
      default:
        return 'Evidence level not specified';
    }
  }

  /**
   * Get evidence level severity for sorting/prioritization
   */
  static getEvidenceLevelSeverity(level: string | undefined): number {
    if (!level) return -1;
    const severityMap: Record<string, number> = {
      '1A': 6,
      '1B': 5,
      '2A': 4,
      '2B': 3,
      '3': 2,
      '4': 1
    };
    return severityMap[level.toUpperCase()] ?? -1;
  }

  /**
   * Parse metabolizer phenotype from text
   */
  static parsePhenotype(phenotype: string): MetabolizerResult {
    const normalized = phenotype.toLowerCase();

    // Check for poor metabolizer first
    if (normalized.includes('poor') || normalized === 'pm') {
      return {
        category: 'poor',
        description: 'Poor Metabolizer - reduced or no enzyme activity',
        clinicalImplication: 'May require dose reduction or alternative drug'
      };
    }
    // Check for intermediate metabolizer
    if (normalized.includes('intermediate') || normalized === 'im') {
      return {
        category: 'intermediate',
        description: 'Intermediate Metabolizer - reduced enzyme activity',
        clinicalImplication: 'May require dose adjustment'
      };
    }
    // Check for ultrarapid before rapid (ultrarapid contains 'rapid')
    if (normalized.includes('ultrarapid') || normalized === 'um') {
      return {
        category: 'ultrarapid',
        description: 'Ultrarapid Metabolizer - significantly increased enzyme activity',
        clinicalImplication: 'May require dose increase or alternative drug; increased toxicity risk for prodrugs'
      };
    }
    // Check for normal/extensive before rapid (normal contains 'rm' in No*rm*al)
    if (normalized.includes('normal') || normalized === 'nm' || normalized.includes('extensive')) {
      return {
        category: 'normal',
        description: 'Normal Metabolizer - typical enzyme activity',
        clinicalImplication: 'Standard dosing typically appropriate'
      };
    }
    // Check for rapid metabolizer last
    if (normalized.includes('rapid') || normalized === 'rm') {
      return {
        category: 'rapid',
        description: 'Rapid Metabolizer - increased enzyme activity',
        clinicalImplication: 'May require dose adjustment'
      };
    }

    return {
      category: 'unknown',
      description: 'Metabolizer status unknown',
      clinicalImplication: 'Consult clinical guidelines for dosing recommendations'
    };
  }

  /**
   * Format drug interaction for display
   */
  static formatDrugInteraction(drug: DrugInteraction): string {
    let text = drug.name;
    // Only show generic name if it's different (case-insensitive comparison)
    if (drug.genericName && drug.genericName.toLowerCase() !== drug.name.toLowerCase()) {
      text = `${drug.name} (${drug.genericName})`;
    }
    if (drug.categories.length > 0) {
      text += ` - ${drug.categories.join(', ')}`;
    }
    return text;
  }
}

/**
 * Normalize rsID format
 */
function normalizeRsid(rsid: string): string {
  const trimmed = rsid.trim().toLowerCase();
  if (trimmed.startsWith('rs')) {
    return trimmed;
  }
  return `rs${trimmed}`;
}

/**
 * Normalize and validate a PharmGKB record
 */
function normalizeRecord(record: PharmGKBRecord): PharmGKBRecord {
  return {
    rsid: normalizeRsid(record.rsid),
    gene: record.gene?.toUpperCase().trim() || '',
    drugs: Array.isArray(record.drugs) ? record.drugs : [],
    phenotypes: Array.isArray(record.phenotypes) ? record.phenotypes : [],
    evidenceLevel: record.evidenceLevel || '',
    cpicLevel: record.cpicLevel
  };
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
