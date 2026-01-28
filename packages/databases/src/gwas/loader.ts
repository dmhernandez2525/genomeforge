/**
 * GWAS Catalog database loader
 *
 * The GWAS Catalog contains 625,000+ lead associations for 15,000+ traits.
 * Unlike ClinVar/PharmGKB which are bundled, GWAS is a downloadable option
 * due to its larger size (~500MB).
 *
 * License: CC0 (Public Domain) for most data, some datasets CC-BY-NC-4.0
 *
 * @packageDocumentation
 */

import type { GWASRecord, DatabaseMetadata } from '../types';
import { GenomeForgeDB } from '../db';

/**
 * GWAS Catalog data URLs
 */
const GWAS_URLS = {
  // Main associations file
  associations: 'https://www.ebi.ac.uk/gwas/api/search/downloads/alternative',
  // Ancestry-specific data
  ancestry: 'https://www.ebi.ac.uk/gwas/api/search/downloads/ancestry',
  // Studies metadata
  studies: 'https://www.ebi.ac.uk/gwas/api/search/downloads/studies_alternative'
};

/**
 * GWAS Catalog loader options
 */
export interface GWASLoaderOptions {
  /** Include ancestry-specific data */
  includeAncestry?: boolean;
  /** Maximum associations to load (for testing/memory constraints) */
  maxAssociations?: number;
  /** Progress callback */
  onProgress?: (progress: GWASLoadProgress) => void;
}

/**
 * GWAS loading progress
 */
export interface GWASLoadProgress {
  phase: 'downloading' | 'parsing' | 'indexing' | 'complete';
  downloaded?: number;
  total?: number;
  parsed?: number;
  percentComplete: number;
}

/**
 * GWAS association record from the catalog
 */
export interface GWASAssociation {
  rsid: string;
  chromosome: string;
  position: number;
  reportedGenes: string[];
  mappedGenes: string[];
  trait: string;
  traitUri: string;
  pValue: number;
  pValueMantissa: number;
  pValueExponent: number;
  orBeta?: number;
  ci95Lower?: number;
  ci95Upper?: number;
  riskAllele?: string;
  riskAlleleFrequency?: number;
  studyAccession: string;
  pubmedId?: string;
  ancestry?: string;
  sampleSize?: number;
}

/**
 * GWAS Catalog loader
 */
export class GWASLoader {
  private db: GenomeForgeDB;

  constructor(db: GenomeForgeDB) {
    this.db = db;
  }

  /**
   * Check if GWAS data is already loaded
   */
  async isLoaded(): Promise<boolean> {
    const metadata = await this.db.metadata.get('gwas');
    return metadata !== undefined && metadata.recordCount > 0;
  }

  /**
   * Get GWAS database version info
   */
  async getVersion(): Promise<DatabaseMetadata | undefined> {
    return this.db.metadata.get('gwas');
  }

  /**
   * Load GWAS Catalog data
   *
   * Downloads and processes the GWAS Catalog associations file.
   * Note: This is a large download (~100-500MB depending on options).
   *
   * @param options - Loader options
   */
  async load(options: GWASLoaderOptions = {}): Promise<void> {
    const { maxAssociations, onProgress } = options;

    onProgress?.({
      phase: 'downloading',
      percentComplete: 0
    });

    // Download the main associations file
    const response = await fetch(GWAS_URLS.associations);
    if (!response.ok) {
      throw new Error(`Failed to download GWAS Catalog: ${response.statusText}`);
    }

    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : undefined;

    // Stream and parse the TSV data
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    let downloaded = 0;
    let text = '';
    const decoder = new TextDecoder();

    while (true) {
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

    onProgress?.({
      phase: 'parsing',
      percentComplete: 30
    });

    // Parse TSV data
    const lines = text.split('\n');
    const header = lines[0].split('\t');
    const records: GWASRecord[] = [];

    // Find column indices
    const colIndex = {
      snpId: header.indexOf('SNPS'),
      chromosome: header.indexOf('CHR_ID'),
      position: header.indexOf('CHR_POS'),
      reportedGenes: header.indexOf('REPORTED GENE(S)'),
      mappedGenes: header.indexOf('MAPPED_GENE'),
      trait: header.indexOf('DISEASE/TRAIT'),
      traitUri: header.indexOf('MAPPED_TRAIT_URI'),
      pValue: header.indexOf('P-VALUE'),
      pValueMantissa: header.indexOf('PVALUE_MLOG'),
      orBeta: header.indexOf('OR or BETA'),
      ci95: header.indexOf('95% CI (TEXT)'),
      riskAllele: header.indexOf('STRONGEST SNP-RISK ALLELE'),
      riskFreq: header.indexOf('RISK ALLELE FREQUENCY'),
      study: header.indexOf('STUDY ACCESSION'),
      pubmed: header.indexOf('PUBMEDID'),
      ancestry: header.indexOf('INITIAL SAMPLE SIZE')
    };

    for (let i = 1; i < lines.length; i++) {
      if (maxAssociations && records.length >= maxAssociations) {
        break;
      }

      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split('\t');

      // Extract rsID from SNP column (may contain multiple)
      const snpField = cols[colIndex.snpId] || '';
      const rsidMatch = snpField.match(/rs\d+/);
      if (!rsidMatch) continue;

      const rsid = rsidMatch[0];
      const position = parseInt(cols[colIndex.position], 10);
      if (isNaN(position)) continue;

      const pValue = parseFloat(cols[colIndex.pValue]);

      records.push({
        rsid,
        chromosome: cols[colIndex.chromosome] || '',
        position,
        trait: cols[colIndex.trait] || '',
        pValue: isNaN(pValue) ? 0 : pValue,
        orBeta: parseFloat(cols[colIndex.orBeta]) || undefined,
        riskAllele: cols[colIndex.riskAllele]?.split('-')[1] || undefined,
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

    onProgress?.({
      phase: 'indexing',
      percentComplete: 70
    });

    // Clear existing GWAS data
    await this.db.gwas.clear();

    // Batch insert records
    const BATCH_SIZE = 5000;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      await this.db.gwas.bulkAdd(batch);

      onProgress?.({
        phase: 'indexing',
        percentComplete: 70 + ((i / records.length) * 25)
      });
    }

    // Update metadata
    const version = new Date().toISOString().split('T')[0];
    await this.db.metadata.put({
      name: 'gwas',
      version,
      recordCount: records.length,
      lastUpdated: new Date(),
      source: 'https://www.ebi.ac.uk/gwas/docs/file-downloads'
    });

    onProgress?.({
      phase: 'complete',
      percentComplete: 100
    });
  }

  /**
   * Lookup GWAS associations for an rsID
   */
  async lookup(rsid: string): Promise<GWASRecord[]> {
    return this.db.gwas.where('rsid').equals(rsid).toArray();
  }

  /**
   * Lookup associations by trait
   */
  async lookupByTrait(trait: string): Promise<GWASRecord[]> {
    const pattern = trait.toLowerCase();
    return this.db.gwas
      .filter(record => record.trait.toLowerCase().includes(pattern))
      .toArray();
  }

  /**
   * Get all traits in the database
   */
  async getTraits(): Promise<string[]> {
    const records = await this.db.gwas.toArray();
    const traits = new Set(records.map(r => r.trait));
    return Array.from(traits).sort();
  }

  /**
   * Get top associations by p-value
   */
  async getTopAssociations(limit = 100): Promise<GWASRecord[]> {
    return this.db.gwas
      .orderBy('pValue')
      .limit(limit)
      .toArray();
  }

  /**
   * Clear all GWAS data
   */
  async clear(): Promise<void> {
    await this.db.gwas.clear();
    await this.db.metadata.delete('gwas');
  }
}
