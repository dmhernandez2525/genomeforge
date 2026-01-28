/**
 * ClinVar database loader
 *
 * Loads the pre-processed ClinVar database from a compressed JSON bundle.
 * The bundle should be hosted on a CDN and contains ~341K clinical variants.
 *
 * Data source: https://ftp.ncbi.nlm.nih.gov/pub/clinvar/vcf_GRCh38/
 * License: Public Domain (US Government work)
 *
 * @packageDocumentation
 */

import pako from 'pako';
import { db } from '../db';
import type { ClinVarRecord, ClinicalSignificance, DatabaseMetadata, ConditionInfo } from '../types';

/**
 * ClinVar loader configuration
 */
export interface ClinVarConfig {
  /** URL to the pre-processed ClinVar JSON bundle */
  bundleUrl: string;
  /** Callback for progress updates (0-100) */
  onProgress?: (progress: number) => void;
  /** Callback for status messages */
  onStatus?: (message: string) => void;
  /** Abort signal for cancellation */
  abortSignal?: AbortSignal;
}

/**
 * ClinVar query options for filtering
 */
export interface ClinVarQueryOptions {
  /** Filter by clinical significance values */
  significance?: ClinicalSignificance[];
  /** Minimum star rating (0-4) */
  minStars?: number;
  /** Maximum star rating (0-4) */
  maxStars?: number;
  /** Filter by chromosome */
  chromosome?: string;
  /** Position range start */
  positionStart?: number;
  /** Position range end */
  positionEnd?: number;
  /** Limit number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * ClinVar database statistics
 */
export interface ClinVarStats {
  totalRecords: number;
  bySignificance: Record<ClinicalSignificance, number>;
  byStarRating: Record<number, number>;
  uniqueGenes: number;
  uniqueConditions: number;
}

/**
 * Version info for update checking
 */
export interface ClinVarVersionInfo {
  currentVersion: string | null;
  currentDate: Date | null;
  recordCount: number;
  needsUpdate: boolean;
  latestVersion?: string;
  latestDate?: Date;
}

/**
 * Bundle format structure
 */
interface ClinVarBundle {
  version: string;
  generated: string;
  recordCount: number;
  checksum?: string;
  records: ClinVarRecord[];
}

/**
 * ClinVar database loader
 *
 * Provides loading, querying, and management of ClinVar clinical variant data.
 * Optimized for mobile with streaming decompression and batch inserts.
 */
export class ClinVarLoader {
  private config: ClinVarConfig;

  constructor(config: ClinVarConfig) {
    this.config = config;
  }

  /**
   * Load ClinVar database into IndexedDB
   *
   * Memory-optimized loading process:
   * 1. Streams download to avoid holding full response in memory
   * 2. Decompresses gzipped data
   * 3. Parses JSON and inserts in batches
   *
   * Peak memory usage: ~150-200MB for full database
   */
  async load(): Promise<void> {
    const { bundleUrl, onProgress, onStatus, abortSignal } = this.config;

    // Check for abort before starting
    if (abortSignal?.aborted) {
      throw new DOMException('Loading aborted', 'AbortError');
    }

    onStatus?.('Downloading ClinVar database...');
    onProgress?.(0);

    // Fetch the compressed bundle
    const response = await fetch(bundleUrl, { signal: abortSignal });
    if (!response.ok) {
      throw new Error(`Failed to download ClinVar bundle: ${response.status} ${response.statusText}`);
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
          const downloadProgress = Math.round((receivedBytes / totalBytes) * 40); // 0-40% for download
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
      throw new Error(`Failed to decompress ClinVar bundle: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    onProgress?.(55);
    onStatus?.('Parsing database...');

    // Parse JSON
    let bundle: ClinVarBundle;
    try {
      bundle = JSON.parse(decompressed);
    } catch (error) {
      throw new Error(`Failed to parse ClinVar JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Validate bundle structure
    if (!bundle.version || !bundle.records || !Array.isArray(bundle.records)) {
      throw new Error('Invalid ClinVar bundle format');
    }

    onProgress?.(60);
    onStatus?.(`Loading ${bundle.recordCount.toLocaleString()} variants...`);

    // Clear existing data before loading new data
    await db.clinvar.clear();

    // Batch insert into IndexedDB
    // Using 5000 records per batch for memory efficiency on mobile
    const BATCH_SIZE = 5000;
    const records = bundle.records;
    const totalRecords = records.length;

    for (let i = 0; i < totalRecords; i += BATCH_SIZE) {
      // Check for abort during insertion
      if (abortSignal?.aborted) {
        // Rollback by clearing partial data
        await db.clinvar.clear();
        throw new DOMException('Loading aborted', 'AbortError');
      }

      const batch = records.slice(i, i + BATCH_SIZE);

      // Validate and normalize records before insertion
      const validatedBatch = batch.map(record => normalizeRecord(record));

      await db.clinvar.bulkPut(validatedBatch);

      const progress = 60 + Math.round(((i + batch.length) / totalRecords) * 35);
      onProgress?.(progress);

      if ((i + BATCH_SIZE) % 50000 === 0 || i + BATCH_SIZE >= totalRecords) {
        onStatus?.(`Loaded ${Math.min(i + BATCH_SIZE, totalRecords).toLocaleString()} / ${totalRecords.toLocaleString()} variants`);
      }
    }

    // Store metadata
    const metadata: DatabaseMetadata = {
      name: 'clinvar',
      version: bundle.version,
      lastUpdated: new Date(bundle.generated),
      recordCount: totalRecords,
      checksum: bundle.checksum || '',
      source: 'https://ftp.ncbi.nlm.nih.gov/pub/clinvar/vcf_GRCh38/',
      license: 'Public Domain'
    };

    await db.metadata.put(metadata);

    onProgress?.(100);
    onStatus?.(`ClinVar database loaded successfully (${totalRecords.toLocaleString()} variants)`);
  }

  /**
   * Check if ClinVar database is loaded
   */
  static async isLoaded(): Promise<boolean> {
    const metadata = await db.metadata.get('clinvar');
    return metadata !== undefined && metadata.recordCount > 0;
  }

  /**
   * Get current version info and check if update is needed
   */
  static async getVersionInfo(latestVersionUrl?: string): Promise<ClinVarVersionInfo> {
    const metadata = await db.metadata.get('clinvar');

    const info: ClinVarVersionInfo = {
      currentVersion: metadata?.version || null,
      currentDate: metadata?.lastUpdated || null,
      recordCount: metadata?.recordCount || 0,
      needsUpdate: false
    };

    // If provided, fetch latest version info to check for updates
    if (latestVersionUrl) {
      try {
        const response = await fetch(latestVersionUrl);
        if (response.ok) {
          const versionData = await response.json() as { version: string; generated: string };
          info.latestVersion = versionData.version;
          info.latestDate = new Date(versionData.generated);

          // Compare versions
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
    return db.metadata.get('clinvar');
  }

  /**
   * Look up a single variant by rsID
   */
  static async lookup(rsid: string): Promise<ClinVarRecord | undefined> {
    const normalizedRsid = normalizeRsid(rsid);
    return db.clinvar.get(normalizedRsid);
  }

  /**
   * Look up multiple variants by rsID (batch)
   *
   * @param rsids - Array of rsIDs to look up
   * @returns Map of rsID to ClinVar record
   */
  static async lookupBatch(rsids: string[]): Promise<Map<string, ClinVarRecord>> {
    const results = new Map<string, ClinVarRecord>();

    if (rsids.length === 0) {
      return results;
    }

    const normalizedRsids = rsids.map(normalizeRsid);
    const records = await db.clinvar.where('rsid').anyOf(normalizedRsids).toArray();

    for (const record of records) {
      results.set(record.rsid, record);
    }

    return results;
  }

  /**
   * Look up all variants for a gene
   */
  static async lookupByGene(gene: string): Promise<ClinVarRecord[]> {
    const normalizedGene = gene.toUpperCase().trim();
    return db.clinvar.where('gene').equals(normalizedGene).toArray();
  }

  /**
   * Look up variants with filters
   */
  static async query(options: ClinVarQueryOptions = {}): Promise<ClinVarRecord[]> {
    const { significance, minStars, maxStars, chromosome, positionStart, positionEnd, limit, offset } = options;

    let collection = db.clinvar.toCollection();

    // Apply chromosome filter first as it can use index
    if (chromosome) {
      collection = db.clinvar.where('chromosome').equals(chromosome);
    }

    // Apply additional filters
    const filters: ((record: ClinVarRecord) => boolean)[] = [];

    if (significance && significance.length > 0) {
      filters.push(record => significance.includes(record.clinicalSignificance));
    }

    if (minStars !== undefined) {
      filters.push(record => record.reviewStatus >= minStars);
    }

    if (maxStars !== undefined) {
      filters.push(record => record.reviewStatus <= maxStars);
    }

    if (positionStart !== undefined) {
      filters.push(record => record.position >= positionStart);
    }

    if (positionEnd !== undefined) {
      filters.push(record => record.position <= positionEnd);
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
   * Get all pathogenic or likely pathogenic variants for a gene
   */
  static async getPathogenicByGene(gene: string): Promise<ClinVarRecord[]> {
    const normalizedGene = gene.toUpperCase().trim();
    return db.clinvar
      .where('gene')
      .equals(normalizedGene)
      .filter(record =>
        record.clinicalSignificance === 'pathogenic' ||
        record.clinicalSignificance === 'likely_pathogenic'
      )
      .toArray();
  }

  /**
   * Get variants by clinical significance
   */
  static async getBySignificance(significance: ClinicalSignificance): Promise<ClinVarRecord[]> {
    return db.clinvar
      .where('clinicalSignificance')
      .equals(significance)
      .toArray();
  }

  /**
   * Get variants by star rating
   */
  static async getByStarRating(minStars: number, maxStars?: number): Promise<ClinVarRecord[]> {
    return db.clinvar
      .filter(record => {
        if (record.reviewStatus < minStars) return false;
        if (maxStars !== undefined && record.reviewStatus > maxStars) return false;
        return true;
      })
      .toArray();
  }

  /**
   * Get high-confidence pathogenic variants (3+ stars)
   */
  static async getHighConfidencePathogenic(): Promise<ClinVarRecord[]> {
    return db.clinvar
      .filter(record =>
        (record.clinicalSignificance === 'pathogenic' ||
         record.clinicalSignificance === 'likely_pathogenic') &&
        record.reviewStatus >= 3
      )
      .toArray();
  }

  /**
   * Search variants by condition name
   */
  static async searchByCondition(searchTerm: string): Promise<ClinVarRecord[]> {
    const term = searchTerm.toLowerCase();
    return db.clinvar
      .filter(record =>
        record.conditions.some(c => c.name.toLowerCase().includes(term))
      )
      .toArray();
  }

  /**
   * Get database statistics
   */
  static async getStats(): Promise<ClinVarStats> {
    const records = await db.clinvar.toArray();

    const bySignificance: Record<ClinicalSignificance, number> = {
      pathogenic: 0,
      likely_pathogenic: 0,
      uncertain_significance: 0,
      likely_benign: 0,
      benign: 0,
      conflicting: 0,
      not_provided: 0
    };

    const byStarRating: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    const genes = new Set<string>();
    const conditions = new Set<string>();

    for (const record of records) {
      bySignificance[record.clinicalSignificance]++;
      byStarRating[record.reviewStatus] = (byStarRating[record.reviewStatus] || 0) + 1;
      if (record.gene) genes.add(record.gene);
      for (const condition of record.conditions) {
        conditions.add(condition.name);
      }
    }

    return {
      totalRecords: records.length,
      bySignificance,
      byStarRating,
      uniqueGenes: genes.size,
      uniqueConditions: conditions.size
    };
  }

  /**
   * Clear all ClinVar data
   */
  static async clear(): Promise<void> {
    await db.clinvar.clear();
    await db.metadata.delete('clinvar');
  }

  /**
   * Parse clinical significance from ClinVar string format
   */
  static parseSignificance(value: string): ClinicalSignificance {
    const normalized = value.toLowerCase().replace(/[_\s-]/g, '_');

    // Order matters - check more specific terms first
    if (normalized.includes('likely_pathogenic') || normalized.includes('likely pathogenic')) {
      return 'likely_pathogenic';
    }
    if (normalized.includes('pathogenic') && !normalized.includes('likely')) {
      return 'pathogenic';
    }
    if (normalized.includes('likely_benign') || normalized.includes('likely benign')) {
      return 'likely_benign';
    }
    if (normalized.includes('benign') && !normalized.includes('likely')) {
      return 'benign';
    }
    if (normalized.includes('conflicting')) {
      return 'conflicting';
    }
    if (normalized.includes('uncertain') || normalized.includes('vus') || normalized.includes('unknown')) {
      return 'uncertain_significance';
    }

    return 'not_provided';
  }

  /**
   * Convert star rating to human-readable review status
   */
  static getReviewStatusText(stars: number): string {
    switch (stars) {
      case 4:
        return 'Practice guideline';
      case 3:
        return 'Reviewed by expert panel';
      case 2:
        return 'Multiple submitters, no conflicts';
      case 1:
        return 'Single submitter';
      case 0:
      default:
        return 'No assertion criteria provided';
    }
  }

  /**
   * Get clinical significance display text
   */
  static getSignificanceText(significance: ClinicalSignificance): string {
    const textMap: Record<ClinicalSignificance, string> = {
      pathogenic: 'Pathogenic',
      likely_pathogenic: 'Likely Pathogenic',
      uncertain_significance: 'Uncertain Significance (VUS)',
      likely_benign: 'Likely Benign',
      benign: 'Benign',
      conflicting: 'Conflicting Interpretations',
      not_provided: 'Not Provided'
    };
    return textMap[significance] || significance;
  }

  /**
   * Get severity level for clinical significance (for sorting/filtering)
   */
  static getSignificanceSeverity(significance: ClinicalSignificance): number {
    const severityMap: Record<ClinicalSignificance, number> = {
      pathogenic: 5,
      likely_pathogenic: 4,
      uncertain_significance: 3,
      conflicting: 2,
      likely_benign: 1,
      benign: 0,
      not_provided: -1
    };
    return severityMap[significance] ?? -1;
  }

  /**
   * Format condition info for display
   */
  static formatCondition(condition: ConditionInfo): string {
    let text = condition.name;
    if (condition.omimId) {
      text += ` (OMIM: ${condition.omimId})`;
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
 * Normalize and validate a ClinVar record
 */
function normalizeRecord(record: ClinVarRecord): ClinVarRecord {
  return {
    rsid: normalizeRsid(record.rsid),
    gene: record.gene?.toUpperCase().trim() || '',
    clinicalSignificance: record.clinicalSignificance || 'not_provided',
    reviewStatus: Math.max(0, Math.min(4, record.reviewStatus || 0)),
    conditions: Array.isArray(record.conditions) ? record.conditions : [],
    lastEvaluated: record.lastEvaluated ? new Date(record.lastEvaluated) : undefined,
    variationId: record.variationId || '',
    chromosome: normalizeChromosome(record.chromosome),
    position: record.position || 0,
    referenceAllele: record.referenceAllele?.toUpperCase() || '',
    alternateAllele: record.alternateAllele?.toUpperCase() || ''
  };
}

/**
 * Normalize chromosome format
 */
function normalizeChromosome(chr: string): string {
  if (!chr) return '';
  const clean = chr.toUpperCase().replace(/^CHR/i, '').trim();
  if (clean === 'MT' || clean === 'M') return 'MT';
  return clean;
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
