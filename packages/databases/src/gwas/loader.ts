/**
 * GWAS Catalog database loader
 *
 * The GWAS Catalog contains 625,000+ lead associations for 15,000+ traits.
 * Supports both bundled loading (pre-processed JSON) and direct download from EBI.
 *
 * Data source: https://www.ebi.ac.uk/gwas/
 * License: CC0 (Public Domain) for most data, some datasets CC-BY-NC-4.0
 *
 * @packageDocumentation
 */

import pako from 'pako';
import { db } from '../db';
import type { GWASRecord, DatabaseMetadata } from '../types';

/**
 * GWAS Catalog data URLs
 */
export const GWAS_URLS = {
  associations: 'https://www.ebi.ac.uk/gwas/api/search/downloads/alternative',
  ancestry: 'https://www.ebi.ac.uk/gwas/api/search/downloads/ancestry',
  studies: 'https://www.ebi.ac.uk/gwas/api/search/downloads/studies_alternative'
};

/**
 * GWAS loader configuration
 */
export interface GWASConfig {
  /** URL to a pre-processed GWAS JSON bundle (alternative to direct download) */
  bundleUrl?: string;
  /** Callback for progress updates */
  onProgress?: (progress: GWASLoadProgress) => void;
  /** Callback for status messages */
  onStatus?: (message: string) => void;
  /** Abort signal for cancellation */
  abortSignal?: AbortSignal;
}

/**
 * GWAS Catalog loader options (for direct download)
 */
export interface GWASLoaderOptions extends GWASConfig {
  /** Maximum associations to load (for testing/memory constraints) */
  maxAssociations?: number;
  /** Minimum p-value threshold (e.g., 5e-8 for genome-wide significance) */
  pValueThreshold?: number;
}

/**
 * GWAS loading progress
 */
export interface GWASLoadProgress {
  phase: 'downloading' | 'decompressing' | 'parsing' | 'indexing' | 'complete';
  downloaded?: number;
  total?: number;
  parsed?: number;
  percentComplete: number;
  message?: string;
}

/**
 * GWAS query options
 */
export interface GWASQueryOptions {
  /** Filter by trait keyword */
  trait?: string;
  /** Filter by chromosome */
  chromosome?: string;
  /** Minimum position */
  positionStart?: number;
  /** Maximum position */
  positionEnd?: number;
  /** Maximum p-value (e.g., 5e-8 for genome-wide significance) */
  maxPValue?: number;
  /** Minimum odds ratio or beta */
  minEffect?: number;
  /** Limit results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * GWAS database statistics
 */
export interface GWASStats {
  totalRecords: number;
  uniqueRsids: number;
  uniqueTraits: number;
  uniqueStudies: number;
  byChromosome: Record<string, number>;
  pValueDistribution: {
    genomeWideSignificant: number; // p < 5e-8
    suggestive: number; // 5e-8 <= p < 1e-5
    nominal: number; // 1e-5 <= p < 0.05
    other: number;
  };
}

/**
 * GWAS version info
 */
export interface GWASVersionInfo {
  currentVersion: string | null;
  currentDate: Date | null;
  recordCount: number;
  needsUpdate: boolean;
  latestVersion?: string;
  latestDate?: Date;
}

/**
 * Trait summary for display
 */
export interface TraitSummary {
  trait: string;
  associationCount: number;
  topRsid?: string;
  topPValue?: number;
  topOddsRatio?: number;
}

/**
 * Bundle format structure
 */
interface GWASBundle {
  version: string;
  generated: string;
  recordCount: number;
  checksum?: string;
  records: GWASRecord[];
}

/**
 * GWAS Catalog loader
 *
 * Provides loading, querying, and management of genome-wide association study data.
 * Supports both pre-processed bundle loading and direct EBI download.
 */
export class GWASLoader {
  private config: GWASConfig;

  constructor(config: GWASConfig = {}) {
    this.config = config;
  }

  /**
   * Load GWAS data from a pre-processed bundle
   *
   * This is the preferred method for mobile devices as it's faster
   * and more memory-efficient than direct download.
   */
  async loadFromBundle(): Promise<void> {
    const { bundleUrl, onProgress, onStatus, abortSignal } = this.config;

    if (!bundleUrl) {
      throw new Error('Bundle URL is required for loadFromBundle()');
    }

    if (abortSignal?.aborted) {
      throw new DOMException('Loading aborted', 'AbortError');
    }

    onStatus?.('Downloading GWAS Catalog...');
    onProgress?.({ phase: 'downloading', percentComplete: 0 });

    const response = await fetch(bundleUrl, { signal: abortSignal });
    if (!response.ok) {
      throw new Error(`Failed to download GWAS bundle: ${response.status} ${response.statusText}`);
    }

    const contentLength = response.headers.get('content-length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;

    try {
      while (true) {
        if (abortSignal?.aborted) {
          reader.cancel();
          throw new DOMException('Loading aborted', 'AbortError');
        }

        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedBytes += value.length;

        if (totalBytes > 0) {
          onProgress?.({
            phase: 'downloading',
            downloaded: receivedBytes,
            total: totalBytes,
            percentComplete: Math.round((receivedBytes / totalBytes) * 40)
          });
        }
      }
    } finally {
      reader.releaseLock();
    }

    onStatus?.('Decompressing...');
    onProgress?.({ phase: 'decompressing', percentComplete: 45 });

    const compressedData = new Uint8Array(receivedBytes);
    let offset = 0;
    for (const chunk of chunks) {
      compressedData.set(chunk, offset);
      offset += chunk.length;
    }
    chunks.length = 0;

    let decompressed: string;
    try {
      decompressed = pako.ungzip(compressedData, { to: 'string' });
    } catch (error) {
      throw new Error(`Failed to decompress GWAS bundle: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    onProgress?.({ phase: 'parsing', percentComplete: 55 });
    onStatus?.('Parsing database...');

    let bundle: GWASBundle;
    try {
      bundle = JSON.parse(decompressed);
    } catch (error) {
      throw new Error(`Failed to parse GWAS JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (!bundle.version || !bundle.records || !Array.isArray(bundle.records)) {
      throw new Error('Invalid GWAS bundle format');
    }

    onProgress?.({ phase: 'indexing', percentComplete: 60 });
    onStatus?.(`Loading ${bundle.recordCount.toLocaleString()} associations...`);

    await db.gwas.clear();

    const BATCH_SIZE = 5000;
    const records = bundle.records;
    const totalRecords = records.length;

    for (let i = 0; i < totalRecords; i += BATCH_SIZE) {
      if (abortSignal?.aborted) {
        await db.gwas.clear();
        throw new DOMException('Loading aborted', 'AbortError');
      }

      const batch = records.slice(i, i + BATCH_SIZE).map(normalizeRecord);
      await db.gwas.bulkPut(batch);

      const progress = 60 + Math.round(((i + batch.length) / totalRecords) * 35);
      onProgress?.({ phase: 'indexing', percentComplete: progress });
    }

    const metadata: DatabaseMetadata = {
      name: 'gwas',
      version: bundle.version,
      lastUpdated: new Date(bundle.generated),
      recordCount: totalRecords,
      checksum: bundle.checksum || '',
      source: 'https://www.ebi.ac.uk/gwas/',
      license: 'CC0'
    };

    await db.metadata.put(metadata);

    onProgress?.({ phase: 'complete', percentComplete: 100 });
    onStatus?.(`GWAS Catalog loaded successfully (${totalRecords.toLocaleString()} associations)`);
  }

  /**
   * Load GWAS data directly from EBI (large download)
   *
   * Note: This downloads ~100-500MB from EBI and parses the TSV.
   * Use loadFromBundle() for mobile devices.
   */
  async loadFromEBI(options: GWASLoaderOptions = {}): Promise<void> {
    const { maxAssociations, pValueThreshold, onProgress, onStatus, abortSignal } = { ...this.config, ...options };

    if (abortSignal?.aborted) {
      throw new DOMException('Loading aborted', 'AbortError');
    }

    onStatus?.('Downloading GWAS Catalog from EBI...');
    onProgress?.({ phase: 'downloading', percentComplete: 0 });

    const response = await fetch(GWAS_URLS.associations, { signal: abortSignal });
    if (!response.ok) {
      throw new Error(`Failed to download GWAS Catalog: ${response.status} ${response.statusText}`);
    }

    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : undefined;

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    let downloaded = 0;
    let text = '';
    const decoder = new TextDecoder();

    try {
      while (true) {
        if (abortSignal?.aborted) {
          reader.cancel();
          throw new DOMException('Loading aborted', 'AbortError');
        }

        const { done, value } = await reader.read();
        if (done) break;

        downloaded += value.length;
        text += decoder.decode(value, { stream: true });

        onProgress?.({
          phase: 'downloading',
          downloaded,
          total,
          percentComplete: total ? (downloaded / total) * 30 : 15
        });
      }
    } finally {
      reader.releaseLock();
    }

    onProgress?.({ phase: 'parsing', percentComplete: 30 });
    onStatus?.('Parsing GWAS associations...');

    const lines = text.split('\n');
    const header = lines[0].split('\t');
    const records: GWASRecord[] = [];

    const colIndex = {
      snpId: header.indexOf('SNPS'),
      chromosome: header.indexOf('CHR_ID'),
      position: header.indexOf('CHR_POS'),
      trait: header.indexOf('DISEASE/TRAIT'),
      pValue: header.indexOf('P-VALUE'),
      orBeta: header.indexOf('OR or BETA'),
      riskAllele: header.indexOf('STRONGEST SNP-RISK ALLELE'),
      study: header.indexOf('STUDY ACCESSION'),
      pubmed: header.indexOf('PUBMEDID')
    };

    for (let i = 1; i < lines.length; i++) {
      if (maxAssociations && records.length >= maxAssociations) {
        break;
      }

      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split('\t');

      const snpField = cols[colIndex.snpId] || '';
      const rsidMatch = snpField.match(/rs\d+/);
      if (!rsidMatch) continue;

      const rsid = rsidMatch[0].toLowerCase();
      const position = parseInt(cols[colIndex.position], 10);
      if (isNaN(position)) continue;

      const pValue = parseFloat(cols[colIndex.pValue]);
      if (isNaN(pValue)) continue;

      if (pValueThreshold !== undefined && pValue > pValueThreshold) {
        continue;
      }

      const orBeta = parseFloat(cols[colIndex.orBeta]);
      const riskAlleleField = cols[colIndex.riskAllele] || '';
      const riskAllele = riskAlleleField.split('-')[1]?.trim();

      records.push({
        rsid,
        chromosome: normalizeChromosome(cols[colIndex.chromosome] || ''),
        position,
        trait: cols[colIndex.trait] || '',
        pValue,
        orBeta: isNaN(orBeta) ? undefined : orBeta,
        riskAllele: riskAllele || undefined,
        studyAccession: cols[colIndex.study] || '',
        pubmedId: cols[colIndex.pubmed] || undefined
      });

      if (i % 10000 === 0) {
        onProgress?.({
          phase: 'parsing',
          parsed: records.length,
          percentComplete: 30 + (i / lines.length) * 40
        });
      }
    }

    onProgress?.({ phase: 'indexing', percentComplete: 70 });
    onStatus?.(`Indexing ${records.length.toLocaleString()} associations...`);

    await db.gwas.clear();

    const BATCH_SIZE = 5000;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      if (abortSignal?.aborted) {
        await db.gwas.clear();
        throw new DOMException('Loading aborted', 'AbortError');
      }

      const batch = records.slice(i, i + BATCH_SIZE);
      await db.gwas.bulkAdd(batch);

      onProgress?.({
        phase: 'indexing',
        percentComplete: 70 + ((i / records.length) * 25)
      });
    }

    const version = new Date().toISOString().split('T')[0];
    await db.metadata.put({
      name: 'gwas',
      version,
      recordCount: records.length,
      lastUpdated: new Date(),
      source: 'https://www.ebi.ac.uk/gwas/docs/file-downloads',
      license: 'CC0'
    });

    onProgress?.({ phase: 'complete', percentComplete: 100 });
    onStatus?.(`GWAS Catalog loaded successfully (${records.length.toLocaleString()} associations)`);
  }

  /**
   * Check if GWAS database is loaded
   */
  static async isLoaded(): Promise<boolean> {
    const metadata = await db.metadata.get('gwas');
    return metadata !== undefined && metadata.recordCount > 0;
  }

  /**
   * Get current version info
   */
  static async getVersionInfo(latestVersionUrl?: string): Promise<GWASVersionInfo> {
    const metadata = await db.metadata.get('gwas');

    const info: GWASVersionInfo = {
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
    return db.metadata.get('gwas');
  }

  /**
   * Look up GWAS associations for an rsID
   */
  static async lookup(rsid: string): Promise<GWASRecord[]> {
    const normalizedRsid = normalizeRsid(rsid);
    return db.gwas.where('rsid').equals(normalizedRsid).toArray();
  }

  /**
   * Look up multiple rsIDs (batch)
   */
  static async lookupBatch(rsids: string[]): Promise<Map<string, GWASRecord[]>> {
    const results = new Map<string, GWASRecord[]>();

    if (rsids.length === 0) {
      return results;
    }

    const normalizedRsids = rsids.map(normalizeRsid);
    const records = await db.gwas.where('rsid').anyOf(normalizedRsids).toArray();

    for (const record of records) {
      const existing = results.get(record.rsid) || [];
      existing.push(record);
      results.set(record.rsid, existing);
    }

    return results;
  }

  /**
   * Look up associations by trait
   */
  static async lookupByTrait(trait: string): Promise<GWASRecord[]> {
    const pattern = trait.toLowerCase();
    return db.gwas
      .filter(record => record.trait.toLowerCase().includes(pattern))
      .toArray();
  }

  /**
   * Query with filters
   */
  static async query(options: GWASQueryOptions = {}): Promise<GWASRecord[]> {
    const { trait, chromosome, positionStart, positionEnd, maxPValue, minEffect, limit, offset } = options;

    let collection = db.gwas.toCollection();

    // Apply chromosome filter first as it can use index
    if (chromosome) {
      collection = db.gwas.where('chromosome').equals(chromosome.toUpperCase());
    }

    const filters: ((record: GWASRecord) => boolean)[] = [];

    if (trait) {
      const pattern = trait.toLowerCase();
      filters.push(record => record.trait.toLowerCase().includes(pattern));
    }

    if (positionStart !== undefined) {
      filters.push(record => record.position >= positionStart);
    }

    if (positionEnd !== undefined) {
      filters.push(record => record.position <= positionEnd);
    }

    if (maxPValue !== undefined) {
      filters.push(record => record.pValue <= maxPValue);
    }

    if (minEffect !== undefined) {
      filters.push(record => record.orBeta !== undefined && Math.abs(record.orBeta) >= minEffect);
    }

    if (filters.length > 0) {
      collection = collection.filter(record => filters.every(f => f(record)));
    }

    if (offset) {
      collection = collection.offset(offset);
    }

    if (limit) {
      collection = collection.limit(limit);
    }

    return collection.toArray();
  }

  /**
   * Get genome-wide significant associations (p < 5e-8)
   */
  static async getGenomeWideSignificant(limit?: number): Promise<GWASRecord[]> {
    let collection = db.gwas
      .filter(record => record.pValue < 5e-8)
      .sortBy('pValue');

    if (limit) {
      return (await collection).slice(0, limit);
    }

    return collection;
  }

  /**
   * Get top associations by p-value
   */
  static async getTopAssociations(limit = 100): Promise<GWASRecord[]> {
    return db.gwas
      .orderBy('pValue')
      .limit(limit)
      .toArray();
  }

  /**
   * Get associations by chromosome
   */
  static async getByChromosome(chromosome: string): Promise<GWASRecord[]> {
    const normalizedChr = chromosome.toUpperCase().replace(/^CHR/i, '');
    return db.gwas.where('chromosome').equals(normalizedChr).toArray();
  }

  /**
   * Get associations in a genomic region
   */
  static async getByRegion(chromosome: string, start: number, end: number): Promise<GWASRecord[]> {
    const normalizedChr = chromosome.toUpperCase().replace(/^CHR/i, '');
    return db.gwas
      .where('chromosome')
      .equals(normalizedChr)
      .filter(record => record.position >= start && record.position <= end)
      .toArray();
  }

  /**
   * Search traits by keyword
   */
  static async searchTraits(keyword: string): Promise<TraitSummary[]> {
    const pattern = keyword.toLowerCase();
    const records = await db.gwas
      .filter(record => record.trait.toLowerCase().includes(pattern))
      .toArray();

    // Group by trait
    const traitMap = new Map<string, GWASRecord[]>();
    for (const record of records) {
      const existing = traitMap.get(record.trait) || [];
      existing.push(record);
      traitMap.set(record.trait, existing);
    }

    // Create summaries
    const summaries: TraitSummary[] = [];
    for (const [trait, traitRecords] of traitMap) {
      const sorted = traitRecords.sort((a, b) => a.pValue - b.pValue);
      const top = sorted[0];

      summaries.push({
        trait,
        associationCount: traitRecords.length,
        topRsid: top?.rsid,
        topPValue: top?.pValue,
        topOddsRatio: top?.orBeta
      });
    }

    return summaries.sort((a, b) => b.associationCount - a.associationCount);
  }

  /**
   * Get all unique traits
   */
  static async getAllTraits(): Promise<string[]> {
    const records = await db.gwas.toArray();
    const traits = new Set(records.map(r => r.trait));
    return Array.from(traits).filter(t => t).sort();
  }

  /**
   * Get all unique studies
   */
  static async getAllStudies(): Promise<string[]> {
    const records = await db.gwas.toArray();
    const studies = new Set(records.map(r => r.studyAccession));
    return Array.from(studies).filter(s => s).sort();
  }

  /**
   * Get database statistics
   */
  static async getStats(): Promise<GWASStats> {
    const records = await db.gwas.toArray();

    const rsids = new Set<string>();
    const traits = new Set<string>();
    const studies = new Set<string>();
    const byChromosome: Record<string, number> = {};
    const pValueDistribution = {
      genomeWideSignificant: 0,
      suggestive: 0,
      nominal: 0,
      other: 0
    };

    for (const record of records) {
      rsids.add(record.rsid);
      if (record.trait) traits.add(record.trait);
      if (record.studyAccession) studies.add(record.studyAccession);

      const chr = record.chromosome || 'Unknown';
      byChromosome[chr] = (byChromosome[chr] || 0) + 1;

      if (record.pValue < 5e-8) {
        pValueDistribution.genomeWideSignificant++;
      } else if (record.pValue < 1e-5) {
        pValueDistribution.suggestive++;
      } else if (record.pValue < 0.05) {
        pValueDistribution.nominal++;
      } else {
        pValueDistribution.other++;
      }
    }

    return {
      totalRecords: records.length,
      uniqueRsids: rsids.size,
      uniqueTraits: traits.size,
      uniqueStudies: studies.size,
      byChromosome,
      pValueDistribution
    };
  }

  /**
   * Clear all GWAS data
   */
  static async clear(): Promise<void> {
    await db.gwas.clear();
    await db.metadata.delete('gwas');
  }

  /**
   * Format p-value for display
   */
  static formatPValue(pValue: number): string {
    if (pValue === 0) return '0';
    if (pValue >= 0.01) return pValue.toFixed(3);
    return pValue.toExponential(2);
  }

  /**
   * Get significance level text
   */
  static getSignificanceText(pValue: number): string {
    if (pValue < 5e-8) {
      return 'Genome-wide significant';
    }
    if (pValue < 1e-5) {
      return 'Suggestive';
    }
    if (pValue < 0.05) {
      return 'Nominally significant';
    }
    return 'Not significant';
  }

  /**
   * Get significance level for sorting
   */
  static getSignificanceLevel(pValue: number): number {
    if (pValue < 5e-8) return 4;
    if (pValue < 1e-5) return 3;
    if (pValue < 0.05) return 2;
    return 1;
  }

  /**
   * Format odds ratio or beta for display
   */
  static formatEffect(orBeta: number | undefined): string {
    if (orBeta === undefined) return 'N/A';
    return orBeta.toFixed(2);
  }

  /**
   * Check if effect is risk-increasing
   */
  static isRiskIncreasing(orBeta: number | undefined): boolean | null {
    if (orBeta === undefined) return null;
    return orBeta > 1;
  }

  /**
   * Build PubMed URL for a record
   */
  static getPubMedUrl(pubmedId: string | undefined): string | null {
    if (!pubmedId) return null;
    return `https://pubmed.ncbi.nlm.nih.gov/${pubmedId}/`;
  }

  /**
   * Build GWAS Catalog study URL
   */
  static getStudyUrl(studyAccession: string): string {
    return `https://www.ebi.ac.uk/gwas/studies/${studyAccession}`;
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
 * Normalize chromosome format
 */
function normalizeChromosome(chr: string): string {
  if (!chr) return '';
  const clean = chr.toUpperCase().replace(/^CHR/i, '').trim();
  if (clean === 'MT' || clean === 'M') return 'MT';
  return clean;
}

/**
 * Normalize a GWAS record
 */
function normalizeRecord(record: GWASRecord): GWASRecord {
  return {
    rsid: normalizeRsid(record.rsid),
    chromosome: normalizeChromosome(record.chromosome),
    position: record.position || 0,
    trait: record.trait || '',
    pValue: record.pValue || 0,
    orBeta: record.orBeta,
    riskAllele: record.riskAllele?.toUpperCase(),
    studyAccession: record.studyAccession || '',
    pubmedId: record.pubmedId
  };
}
