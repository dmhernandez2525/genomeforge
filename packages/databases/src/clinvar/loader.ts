import pako from 'pako';
import { db } from '../db';
import type { ClinVarRecord, ClinicalSignificance, DatabaseMetadata } from '../types';

export interface ClinVarConfig {
  /** URL to the pre-processed ClinVar JSON bundle */
  bundleUrl: string;
  /** Callback for progress updates (0-100) */
  onProgress?: (progress: number) => void;
  /** Callback for status messages */
  onStatus?: (message: string) => void;
}

/**
 * ClinVar database loader
 *
 * Loads the pre-processed ClinVar database from a compressed JSON bundle.
 * The bundle should be hosted on a CDN and contains ~341K clinical variants.
 *
 * Data source: https://ftp.ncbi.nlm.nih.gov/pub/clinvar/vcf_GRCh38/
 * License: Public Domain (US Government work)
 *
 * Bundle format (gzipped JSON):
 * {
 *   version: string,
 *   generated: string (ISO date),
 *   recordCount: number,
 *   records: ClinVarRecord[]
 * }
 */
export class ClinVarLoader {
  private config: ClinVarConfig;

  constructor(config: ClinVarConfig) {
    this.config = config;
  }

  /**
   * Load ClinVar database into IndexedDB
   */
  async load(): Promise<void> {
    const { bundleUrl, onProgress, onStatus } = this.config;

    onStatus?.('Downloading ClinVar database...');
    onProgress?.(0);

    // Fetch the compressed bundle
    const response = await fetch(bundleUrl);
    if (!response.ok) {
      throw new Error(`Failed to download ClinVar bundle: ${response.status}`);
    }

    const contentLength = response.headers.get('content-length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

    // Stream and decompress
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
        onProgress?.(Math.round((receivedBytes / totalBytes) * 50)); // 0-50% for download
      }
    }

    onStatus?.('Decompressing...');

    // Combine chunks and decompress
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
      records: ClinVarRecord[];
    };

    onProgress?.(70);
    onStatus?.(`Loading ${bundle.recordCount.toLocaleString()} variants...`);

    // Batch insert into IndexedDB
    const BATCH_SIZE = 10000;
    const records = bundle.records;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      await db.clinvar.bulkPut(batch);

      const progress = 70 + Math.round(((i + batch.length) / records.length) * 25);
      onProgress?.(progress);
    }

    // Store metadata
    const metadata: DatabaseMetadata = {
      name: 'clinvar',
      version: bundle.version,
      lastUpdated: new Date(bundle.generated),
      recordCount: bundle.recordCount,
      checksum: '', // TODO: Calculate checksum
      source: 'https://ftp.ncbi.nlm.nih.gov/pub/clinvar/vcf_GRCh38/',
      license: 'Public Domain'
    };

    await db.metadata.put(metadata);

    onProgress?.(100);
    onStatus?.('ClinVar database loaded successfully');
  }

  /**
   * Look up a single variant by rsID
   */
  static async lookup(rsid: string): Promise<ClinVarRecord | undefined> {
    return db.clinvar.get(rsid);
  }

  /**
   * Look up multiple variants by rsID (batch)
   */
  static async lookupBatch(rsids: string[]): Promise<Map<string, ClinVarRecord>> {
    const results = new Map<string, ClinVarRecord>();
    const records = await db.clinvar.where('rsid').anyOf(rsids).toArray();

    for (const record of records) {
      results.set(record.rsid, record);
    }

    return results;
  }

  /**
   * Get all pathogenic variants for a gene
   */
  static async getPathogenicByGene(gene: string): Promise<ClinVarRecord[]> {
    return db.clinvar
      .where('gene')
      .equals(gene)
      .and((record) => record.clinicalSignificance === 'pathogenic')
      .toArray();
  }

  /**
   * Parse clinical significance from ClinVar string format
   */
  static parseSignificance(value: string): ClinicalSignificance {
    const normalized = value.toLowerCase().replace(/[_\s-]/g, '_');

    if (normalized.includes('pathogenic') && !normalized.includes('likely')) {
      return 'pathogenic';
    }
    if (normalized.includes('likely_pathogenic')) {
      return 'likely_pathogenic';
    }
    if (normalized.includes('benign') && !normalized.includes('likely')) {
      return 'benign';
    }
    if (normalized.includes('likely_benign')) {
      return 'likely_benign';
    }
    if (normalized.includes('conflicting')) {
      return 'conflicting';
    }
    if (normalized.includes('uncertain') || normalized.includes('vus')) {
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
}
