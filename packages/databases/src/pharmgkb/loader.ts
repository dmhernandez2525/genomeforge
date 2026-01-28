import pako from 'pako';
import { db } from '../db';
import type { PharmGKBRecord, DrugInteraction, DatabaseMetadata } from '../types';

export interface PharmGKBConfig {
  /** URL to the pre-processed PharmGKB JSON bundle */
  bundleUrl: string;
  /** Callback for progress updates (0-100) */
  onProgress?: (progress: number) => void;
  /** Callback for status messages */
  onStatus?: (message: string) => void;
}

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
 */
export class PharmGKBLoader {
  private config: PharmGKBConfig;

  constructor(config: PharmGKBConfig) {
    this.config = config;
  }

  /**
   * Load PharmGKB database into IndexedDB
   */
  async load(): Promise<void> {
    const { bundleUrl, onProgress, onStatus } = this.config;

    onStatus?.('Downloading PharmGKB database...');
    onProgress?.(0);

    const response = await fetch(bundleUrl);
    if (!response.ok) {
      throw new Error(`Failed to download PharmGKB bundle: ${response.status}`);
    }

    const contentLength = response.headers.get('content-length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      receivedBytes += value.length;

      if (totalBytes > 0) {
        onProgress?.(Math.round((receivedBytes / totalBytes) * 50));
      }
    }

    onStatus?.('Decompressing...');

    const compressedData = new Uint8Array(receivedBytes);
    let offset = 0;
    for (const chunk of chunks) {
      compressedData.set(chunk, offset);
      offset += chunk.length;
    }

    const decompressed = pako.ungzip(compressedData, { to: 'string' });
    onProgress?.(60);

    onStatus?.('Parsing database...');

    const bundle = JSON.parse(decompressed) as {
      version: string;
      generated: string;
      recordCount: number;
      records: PharmGKBRecord[];
    };

    onProgress?.(70);
    onStatus?.(`Loading ${bundle.recordCount.toLocaleString()} drug-gene interactions...`);

    // Batch insert
    const BATCH_SIZE = 5000;
    const records = bundle.records;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      await db.pharmgkb.bulkPut(batch);

      const progress = 70 + Math.round(((i + batch.length) / records.length) * 25);
      onProgress?.(progress);
    }

    // Store metadata
    const metadata: DatabaseMetadata = {
      name: 'pharmgkb',
      version: bundle.version,
      lastUpdated: new Date(bundle.generated),
      recordCount: bundle.recordCount,
      checksum: '',
      source: 'https://www.pharmgkb.org',
      license: 'CC BY-SA 4.0'
    };

    await db.metadata.put(metadata);

    onProgress?.(100);
    onStatus?.('PharmGKB database loaded successfully');
  }

  /**
   * Look up drug interactions for a variant
   */
  static async lookup(rsid: string): Promise<PharmGKBRecord | undefined> {
    return db.pharmgkb.get(rsid);
  }

  /**
   * Look up multiple variants
   */
  static async lookupBatch(rsids: string[]): Promise<Map<string, PharmGKBRecord>> {
    const results = new Map<string, PharmGKBRecord>();
    const records = await db.pharmgkb.where('rsid').anyOf(rsids).toArray();

    for (const record of records) {
      results.set(record.rsid, record);
    }

    return results;
  }

  /**
   * Get all variants affecting a specific drug
   */
  static async getVariantsForDrug(drugName: string): Promise<PharmGKBRecord[]> {
    return db.pharmgkb
      .filter((record) =>
        record.drugs.some(
          (drug) =>
            drug.name.toLowerCase().includes(drugName.toLowerCase()) ||
            drug.genericName.toLowerCase().includes(drugName.toLowerCase())
        )
      )
      .toArray();
  }

  /**
   * Get all variants for a gene (e.g., CYP2D6)
   */
  static async getVariantsForGene(gene: string): Promise<PharmGKBRecord[]> {
    return db.pharmgkb.where('gene').equals(gene).toArray();
  }

  /**
   * Get the required attribution text for PharmGKB data
   */
  static getAttribution(): string {
    return 'Pharmacogenomics data provided by PharmGKB (https://www.pharmgkb.org)';
  }

  /**
   * Parse CPIC level to human-readable text
   */
  static getCpicLevelText(level: string): string {
    switch (level) {
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
   * Parse metabolizer phenotype from star allele data
   */
  static parsePhenotype(phenotype: string): {
    category: 'poor' | 'intermediate' | 'normal' | 'rapid' | 'ultrarapid' | 'unknown';
    description: string;
  } {
    const normalized = phenotype.toLowerCase();

    if (normalized.includes('poor') || normalized.includes('pm')) {
      return { category: 'poor', description: 'Poor Metabolizer - reduced or no enzyme activity' };
    }
    if (normalized.includes('intermediate') || normalized.includes('im')) {
      return { category: 'intermediate', description: 'Intermediate Metabolizer - reduced enzyme activity' };
    }
    if (normalized.includes('ultrarapid') || normalized.includes('um')) {
      return { category: 'ultrarapid', description: 'Ultrarapid Metabolizer - significantly increased enzyme activity' };
    }
    if (normalized.includes('rapid') || normalized.includes('rm')) {
      return { category: 'rapid', description: 'Rapid Metabolizer - increased enzyme activity' };
    }
    if (normalized.includes('normal') || normalized.includes('nm') || normalized.includes('extensive')) {
      return { category: 'normal', description: 'Normal Metabolizer - typical enzyme activity' };
    }

    return { category: 'unknown', description: 'Metabolizer status unknown' };
  }
}
