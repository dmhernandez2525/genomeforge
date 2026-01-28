import Dexie, { type Table } from 'dexie';
import type { ClinVarRecord, PharmGKBRecord, DatabaseMetadata } from './types';
import type { ParsedGenome, Report, Conversation, Setting } from '@genomeforge/types';

/**
 * GenomeForge IndexedDB database using Dexie.js
 *
 * This provides the local storage layer for:
 * - Clinical variant databases (ClinVar, PharmGKB)
 * - User's parsed genome data
 * - Generated reports and conversations
 * - User settings
 */
export class GenomeForgeDB extends Dexie {
  clinvar!: Table<ClinVarRecord, string>;
  pharmgkb!: Table<PharmGKBRecord, string>;
  genomes!: Table<ParsedGenome, string>;
  reports!: Table<Report, string>;
  conversations!: Table<Conversation, string>;
  settings!: Table<Setting, string>;
  metadata!: Table<DatabaseMetadata, string>;

  constructor() {
    super('GenomeForgeDB');

    this.version(1).stores({
      // ClinVar: indexed by rsid, with secondary indexes on gene and significance
      clinvar: 'rsid, gene, clinicalSignificance, chromosome',

      // PharmGKB: indexed by rsid with gene index
      pharmgkb: 'rsid, gene',

      // User genomes: indexed by id with secondary indexes
      genomes: 'id, fileName, parsedAt',

      // Reports: indexed by id with genome and type indexes
      reports: 'id, genomeId, type, generatedAt',

      // AI conversations: indexed by id with genome index
      conversations: 'id, genomeId, lastMessageAt',

      // Settings: simple key-value store
      settings: 'key',

      // Database metadata: tracks versions and updates
      metadata: 'name'
    });
  }

  /**
   * Get database statistics for debugging/info display
   */
  async getStats(): Promise<{
    clinvarCount: number;
    pharmgkbCount: number;
    genomeCount: number;
    reportCount: number;
  }> {
    const [clinvarCount, pharmgkbCount, genomeCount, reportCount] = await Promise.all([
      this.clinvar.count(),
      this.pharmgkb.count(),
      this.genomes.count(),
      this.reports.count()
    ]);

    return { clinvarCount, pharmgkbCount, genomeCount, reportCount };
  }

  /**
   * Clear all user data (genomes, reports, conversations)
   * Does NOT clear clinical databases (ClinVar, PharmGKB)
   */
  async clearUserData(): Promise<void> {
    await Promise.all([
      this.genomes.clear(),
      this.reports.clear(),
      this.conversations.clear()
    ]);
  }

  /**
   * Clear clinical databases for re-download
   */
  async clearClinicalDatabases(): Promise<void> {
    await Promise.all([
      this.clinvar.clear(),
      this.pharmgkb.clear(),
      this.metadata.where('name').anyOf(['clinvar', 'pharmgkb']).delete()
    ]);
  }

  /**
   * Check if clinical databases are loaded
   */
  async areDatabasesLoaded(): Promise<{ clinvar: boolean; pharmgkb: boolean }> {
    const [clinvarMeta, pharmgkbMeta] = await Promise.all([
      this.metadata.get('clinvar'),
      this.metadata.get('pharmgkb')
    ]);

    return {
      clinvar: clinvarMeta !== undefined && clinvarMeta.recordCount > 0,
      pharmgkb: pharmgkbMeta !== undefined && pharmgkbMeta.recordCount > 0
    };
  }
}

// Singleton instance
export const db = new GenomeForgeDB();
