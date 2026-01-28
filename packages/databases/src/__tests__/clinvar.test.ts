/**
 * ClinVar loader tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClinVarLoader } from '../clinvar/loader';
import { db } from '../db';
import type { ClinVarRecord } from '../types';
import pako from 'pako';

// Sample ClinVar records for testing
const sampleRecords: ClinVarRecord[] = [
  {
    rsid: 'rs1801133',
    gene: 'MTHFR',
    clinicalSignificance: 'pathogenic',
    reviewStatus: 3,
    conditions: [
      { name: 'Homocystinuria', omimId: '236250' },
      { name: 'Neural tube defects' }
    ],
    variationId: '1801133',
    chromosome: '1',
    position: 11856378,
    referenceAllele: 'G',
    alternateAllele: 'A'
  },
  {
    rsid: 'rs1805007',
    gene: 'MC1R',
    clinicalSignificance: 'likely_pathogenic',
    reviewStatus: 2,
    conditions: [{ name: 'Red hair color' }],
    variationId: '1805007',
    chromosome: '16',
    position: 89986117,
    referenceAllele: 'C',
    alternateAllele: 'T'
  },
  {
    rsid: 'rs429358',
    gene: 'APOE',
    clinicalSignificance: 'pathogenic',
    reviewStatus: 4,
    conditions: [
      { name: 'Alzheimer disease', omimId: '104310' },
      { name: 'Cardiovascular disease' }
    ],
    variationId: '429358',
    chromosome: '19',
    position: 44908684,
    referenceAllele: 'T',
    alternateAllele: 'C'
  },
  {
    rsid: 'rs7412',
    gene: 'APOE',
    clinicalSignificance: 'benign',
    reviewStatus: 3,
    conditions: [{ name: 'Alzheimer disease protective' }],
    variationId: '7412',
    chromosome: '19',
    position: 44908822,
    referenceAllele: 'C',
    alternateAllele: 'T'
  },
  {
    rsid: 'rs1800497',
    gene: 'ANKK1',
    clinicalSignificance: 'uncertain_significance',
    reviewStatus: 1,
    conditions: [{ name: 'Substance dependence' }],
    variationId: '1800497',
    chromosome: '11',
    position: 113400106,
    referenceAllele: 'G',
    alternateAllele: 'A'
  },
  {
    rsid: 'rs334',
    gene: 'HBB',
    clinicalSignificance: 'pathogenic',
    reviewStatus: 4,
    conditions: [
      { name: 'Sickle cell anemia', omimId: '603903' },
      { name: 'Malaria resistance' }
    ],
    variationId: '334',
    chromosome: '11',
    position: 5227002,
    referenceAllele: 'T',
    alternateAllele: 'A'
  },
  {
    rsid: 'rs5030655',
    gene: 'CYP2D6',
    clinicalSignificance: 'likely_benign',
    reviewStatus: 2,
    conditions: [{ name: 'Drug metabolism alteration' }],
    variationId: '5030655',
    chromosome: '22',
    position: 42128945,
    referenceAllele: 'G',
    alternateAllele: 'A'
  },
  {
    rsid: 'rs12979860',
    gene: 'IFNL4',
    clinicalSignificance: 'conflicting',
    reviewStatus: 2,
    conditions: [{ name: 'Hepatitis C treatment response' }],
    variationId: '12979860',
    chromosome: '19',
    position: 39248147,
    referenceAllele: 'C',
    alternateAllele: 'T'
  }
];

// Helper to create a mock ClinVar bundle
function createMockBundle(records: ClinVarRecord[] = sampleRecords) {
  const bundle = {
    version: '2024-01-15',
    generated: '2024-01-15T12:00:00Z',
    recordCount: records.length,
    checksum: 'abc123',
    records
  };
  return pako.gzip(JSON.stringify(bundle));
}

// Helper to setup direct database insertion for query tests
async function insertSampleRecords(records: ClinVarRecord[] = sampleRecords) {
  await db.clinvar.bulkPut(records);
  await db.metadata.put({
    name: 'clinvar',
    version: '2024-01-15',
    lastUpdated: new Date('2024-01-15T12:00:00Z'),
    recordCount: records.length,
    source: 'https://ftp.ncbi.nlm.nih.gov/pub/clinvar/vcf_GRCh38/',
    license: 'Public Domain'
  });
}

describe('ClinVarLoader', () => {
  describe('Static utility methods', () => {
    describe('parseSignificance', () => {
      it('should parse pathogenic', () => {
        expect(ClinVarLoader.parseSignificance('Pathogenic')).toBe('pathogenic');
        expect(ClinVarLoader.parseSignificance('PATHOGENIC')).toBe('pathogenic');
        expect(ClinVarLoader.parseSignificance('pathogenic')).toBe('pathogenic');
      });

      it('should parse likely_pathogenic', () => {
        expect(ClinVarLoader.parseSignificance('Likely pathogenic')).toBe('likely_pathogenic');
        expect(ClinVarLoader.parseSignificance('likely_pathogenic')).toBe('likely_pathogenic');
        expect(ClinVarLoader.parseSignificance('Likely_Pathogenic')).toBe('likely_pathogenic');
      });

      it('should parse benign', () => {
        expect(ClinVarLoader.parseSignificance('Benign')).toBe('benign');
        expect(ClinVarLoader.parseSignificance('BENIGN')).toBe('benign');
      });

      it('should parse likely_benign', () => {
        expect(ClinVarLoader.parseSignificance('Likely benign')).toBe('likely_benign');
        expect(ClinVarLoader.parseSignificance('likely_benign')).toBe('likely_benign');
      });

      it('should parse uncertain_significance', () => {
        expect(ClinVarLoader.parseSignificance('Uncertain significance')).toBe('uncertain_significance');
        expect(ClinVarLoader.parseSignificance('VUS')).toBe('uncertain_significance');
        expect(ClinVarLoader.parseSignificance('unknown')).toBe('uncertain_significance');
      });

      it('should parse conflicting', () => {
        expect(ClinVarLoader.parseSignificance('Conflicting interpretations')).toBe('conflicting');
        expect(ClinVarLoader.parseSignificance('conflicting')).toBe('conflicting');
      });

      it('should return not_provided for unknown values', () => {
        expect(ClinVarLoader.parseSignificance('')).toBe('not_provided');
        expect(ClinVarLoader.parseSignificance('random')).toBe('not_provided');
      });
    });

    describe('getReviewStatusText', () => {
      it('should return correct text for each star rating', () => {
        expect(ClinVarLoader.getReviewStatusText(4)).toBe('Practice guideline');
        expect(ClinVarLoader.getReviewStatusText(3)).toBe('Reviewed by expert panel');
        expect(ClinVarLoader.getReviewStatusText(2)).toBe('Multiple submitters, no conflicts');
        expect(ClinVarLoader.getReviewStatusText(1)).toBe('Single submitter');
        expect(ClinVarLoader.getReviewStatusText(0)).toBe('No assertion criteria provided');
      });

      it('should return default for invalid ratings', () => {
        expect(ClinVarLoader.getReviewStatusText(-1)).toBe('No assertion criteria provided');
        expect(ClinVarLoader.getReviewStatusText(5)).toBe('No assertion criteria provided');
      });
    });

    describe('getSignificanceText', () => {
      it('should return display text for each significance', () => {
        expect(ClinVarLoader.getSignificanceText('pathogenic')).toBe('Pathogenic');
        expect(ClinVarLoader.getSignificanceText('likely_pathogenic')).toBe('Likely Pathogenic');
        expect(ClinVarLoader.getSignificanceText('uncertain_significance')).toBe('Uncertain Significance (VUS)');
        expect(ClinVarLoader.getSignificanceText('likely_benign')).toBe('Likely Benign');
        expect(ClinVarLoader.getSignificanceText('benign')).toBe('Benign');
        expect(ClinVarLoader.getSignificanceText('conflicting')).toBe('Conflicting Interpretations');
        expect(ClinVarLoader.getSignificanceText('not_provided')).toBe('Not Provided');
      });
    });

    describe('getSignificanceSeverity', () => {
      it('should return correct severity levels', () => {
        expect(ClinVarLoader.getSignificanceSeverity('pathogenic')).toBe(5);
        expect(ClinVarLoader.getSignificanceSeverity('likely_pathogenic')).toBe(4);
        expect(ClinVarLoader.getSignificanceSeverity('uncertain_significance')).toBe(3);
        expect(ClinVarLoader.getSignificanceSeverity('conflicting')).toBe(2);
        expect(ClinVarLoader.getSignificanceSeverity('likely_benign')).toBe(1);
        expect(ClinVarLoader.getSignificanceSeverity('benign')).toBe(0);
        expect(ClinVarLoader.getSignificanceSeverity('not_provided')).toBe(-1);
      });
    });

    describe('formatCondition', () => {
      it('should format condition with OMIM ID', () => {
        const condition = { name: 'Sickle cell anemia', omimId: '603903' };
        expect(ClinVarLoader.formatCondition(condition)).toBe('Sickle cell anemia (OMIM: 603903)');
      });

      it('should format condition without OMIM ID', () => {
        const condition = { name: 'Red hair color' };
        expect(ClinVarLoader.formatCondition(condition)).toBe('Red hair color');
      });
    });
  });

  describe('Database status methods', () => {
    describe('isLoaded', () => {
      it('should return false when database is empty', async () => {
        expect(await ClinVarLoader.isLoaded()).toBe(false);
      });

      it('should return true when database has records', async () => {
        await insertSampleRecords();
        expect(await ClinVarLoader.isLoaded()).toBe(true);
      });
    });

    describe('getMetadata', () => {
      it('should return undefined when no metadata', async () => {
        expect(await ClinVarLoader.getMetadata()).toBeUndefined();
      });

      it('should return metadata when loaded', async () => {
        await insertSampleRecords();
        const metadata = await ClinVarLoader.getMetadata();
        expect(metadata).toBeDefined();
        expect(metadata?.version).toBe('2024-01-15');
        expect(metadata?.recordCount).toBe(sampleRecords.length);
      });
    });

    describe('getVersionInfo', () => {
      it('should return empty info when database not loaded', async () => {
        const info = await ClinVarLoader.getVersionInfo();
        expect(info.currentVersion).toBeNull();
        expect(info.recordCount).toBe(0);
        expect(info.needsUpdate).toBe(true);
      });

      it('should return version info when loaded', async () => {
        await insertSampleRecords();
        const info = await ClinVarLoader.getVersionInfo();
        expect(info.currentVersion).toBe('2024-01-15');
        expect(info.recordCount).toBe(sampleRecords.length);
        expect(info.needsUpdate).toBe(false);
      });
    });
  });

  describe('Lookup methods', () => {
    beforeEach(async () => {
      await insertSampleRecords();
    });

    describe('lookup', () => {
      it('should find a record by rsID', async () => {
        const record = await ClinVarLoader.lookup('rs1801133');
        expect(record).toBeDefined();
        expect(record?.gene).toBe('MTHFR');
        expect(record?.clinicalSignificance).toBe('pathogenic');
      });

      it('should normalize rsID case', async () => {
        const record = await ClinVarLoader.lookup('RS1801133');
        expect(record).toBeDefined();
        expect(record?.gene).toBe('MTHFR');
      });

      it('should return undefined for non-existent rsID', async () => {
        const record = await ClinVarLoader.lookup('rs99999999');
        expect(record).toBeUndefined();
      });
    });

    describe('lookupBatch', () => {
      it('should find multiple records', async () => {
        const rsids = ['rs1801133', 'rs429358', 'rs334'];
        const results = await ClinVarLoader.lookupBatch(rsids);

        expect(results.size).toBe(3);
        expect(results.get('rs1801133')?.gene).toBe('MTHFR');
        expect(results.get('rs429358')?.gene).toBe('APOE');
        expect(results.get('rs334')?.gene).toBe('HBB');
      });

      it('should handle partial matches', async () => {
        const rsids = ['rs1801133', 'rs99999999'];
        const results = await ClinVarLoader.lookupBatch(rsids);

        expect(results.size).toBe(1);
        expect(results.has('rs1801133')).toBe(true);
        expect(results.has('rs99999999')).toBe(false);
      });

      it('should handle empty array', async () => {
        const results = await ClinVarLoader.lookupBatch([]);
        expect(results.size).toBe(0);
      });
    });

    describe('lookupByGene', () => {
      it('should find all records for a gene', async () => {
        const records = await ClinVarLoader.lookupByGene('APOE');
        expect(records.length).toBe(2);
        expect(records.map(r => r.rsid).sort()).toEqual(['rs429358', 'rs7412']);
      });

      it('should normalize gene name case', async () => {
        const records = await ClinVarLoader.lookupByGene('apoe');
        expect(records.length).toBe(2);
      });

      it('should return empty array for non-existent gene', async () => {
        const records = await ClinVarLoader.lookupByGene('FAKE_GENE');
        expect(records.length).toBe(0);
      });
    });
  });

  describe('Query methods', () => {
    beforeEach(async () => {
      await insertSampleRecords();
    });

    describe('query', () => {
      it('should filter by clinical significance', async () => {
        const results = await ClinVarLoader.query({
          significance: ['pathogenic']
        });
        expect(results.length).toBe(3);
        results.forEach(r => expect(r.clinicalSignificance).toBe('pathogenic'));
      });

      it('should filter by multiple significances', async () => {
        const results = await ClinVarLoader.query({
          significance: ['pathogenic', 'likely_pathogenic']
        });
        expect(results.length).toBe(4);
      });

      it('should filter by minimum stars', async () => {
        const results = await ClinVarLoader.query({ minStars: 3 });
        expect(results.length).toBe(4);
        results.forEach(r => expect(r.reviewStatus).toBeGreaterThanOrEqual(3));
      });

      it('should filter by maximum stars', async () => {
        const results = await ClinVarLoader.query({ maxStars: 2 });
        expect(results.length).toBe(4);
        results.forEach(r => expect(r.reviewStatus).toBeLessThanOrEqual(2));
      });

      it('should filter by star range', async () => {
        const results = await ClinVarLoader.query({ minStars: 2, maxStars: 3 });
        expect(results.length).toBe(5);
        results.forEach(r => {
          expect(r.reviewStatus).toBeGreaterThanOrEqual(2);
          expect(r.reviewStatus).toBeLessThanOrEqual(3);
        });
      });

      it('should filter by chromosome', async () => {
        const results = await ClinVarLoader.query({ chromosome: '19' });
        expect(results.length).toBe(3);
        results.forEach(r => expect(r.chromosome).toBe('19'));
      });

      it('should apply limit', async () => {
        const results = await ClinVarLoader.query({ limit: 3 });
        expect(results.length).toBe(3);
      });

      it('should apply offset', async () => {
        const allResults = await ClinVarLoader.query({});
        const offsetResults = await ClinVarLoader.query({ offset: 2 });
        expect(offsetResults.length).toBe(allResults.length - 2);
      });

      it('should combine multiple filters', async () => {
        const results = await ClinVarLoader.query({
          significance: ['pathogenic', 'likely_pathogenic'],
          minStars: 3
        });
        // rs1801133 (MTHFR, pathogenic, 3 stars), rs429358 (APOE, pathogenic, 4 stars), rs334 (HBB, pathogenic, 4 stars)
        expect(results.length).toBe(3);
        results.forEach(r => {
          expect(['pathogenic', 'likely_pathogenic']).toContain(r.clinicalSignificance);
          expect(r.reviewStatus).toBeGreaterThanOrEqual(3);
        });
      });
    });

    describe('getPathogenicByGene', () => {
      it('should find pathogenic variants for a gene', async () => {
        const records = await ClinVarLoader.getPathogenicByGene('APOE');
        expect(records.length).toBe(1);
        expect(records[0].rsid).toBe('rs429358');
        expect(records[0].clinicalSignificance).toBe('pathogenic');
      });

      it('should include likely_pathogenic', async () => {
        const records = await ClinVarLoader.getPathogenicByGene('MC1R');
        expect(records.length).toBe(1);
        expect(records[0].clinicalSignificance).toBe('likely_pathogenic');
      });
    });

    describe('getBySignificance', () => {
      it('should filter by exact significance', async () => {
        const records = await ClinVarLoader.getBySignificance('benign');
        expect(records.length).toBe(1);
        expect(records[0].rsid).toBe('rs7412');
      });
    });

    describe('getByStarRating', () => {
      it('should filter by minimum star rating', async () => {
        const records = await ClinVarLoader.getByStarRating(4);
        expect(records.length).toBe(2);
        records.forEach(r => expect(r.reviewStatus).toBe(4));
      });

      it('should filter by star range', async () => {
        const records = await ClinVarLoader.getByStarRating(2, 3);
        expect(records.length).toBe(5);
        records.forEach(r => {
          expect(r.reviewStatus).toBeGreaterThanOrEqual(2);
          expect(r.reviewStatus).toBeLessThanOrEqual(3);
        });
      });
    });

    describe('getHighConfidencePathogenic', () => {
      it('should return high-confidence pathogenic variants', async () => {
        const records = await ClinVarLoader.getHighConfidencePathogenic();
        // rs1801133 (pathogenic, 3 stars), rs429358 (pathogenic, 4 stars), rs334 (pathogenic, 4 stars)
        expect(records.length).toBe(3);
        records.forEach(r => {
          expect(['pathogenic', 'likely_pathogenic']).toContain(r.clinicalSignificance);
          expect(r.reviewStatus).toBeGreaterThanOrEqual(3);
        });
      });
    });

    describe('searchByCondition', () => {
      it('should search by condition name', async () => {
        const records = await ClinVarLoader.searchByCondition('alzheimer');
        expect(records.length).toBe(2);
      });

      it('should be case-insensitive', async () => {
        const records = await ClinVarLoader.searchByCondition('ALZHEIMER');
        expect(records.length).toBe(2);
      });

      it('should match partial names', async () => {
        const records = await ClinVarLoader.searchByCondition('malaria');
        expect(records.length).toBe(1);
        expect(records[0].rsid).toBe('rs334');
      });
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      await insertSampleRecords();
    });

    describe('getStats', () => {
      it('should return correct total count', async () => {
        const stats = await ClinVarLoader.getStats();
        expect(stats.totalRecords).toBe(sampleRecords.length);
      });

      it('should count by significance', async () => {
        const stats = await ClinVarLoader.getStats();
        expect(stats.bySignificance.pathogenic).toBe(3);
        expect(stats.bySignificance.likely_pathogenic).toBe(1);
        expect(stats.bySignificance.benign).toBe(1);
        expect(stats.bySignificance.likely_benign).toBe(1);
        expect(stats.bySignificance.uncertain_significance).toBe(1);
        expect(stats.bySignificance.conflicting).toBe(1);
      });

      it('should count by star rating', async () => {
        const stats = await ClinVarLoader.getStats();
        expect(stats.byStarRating[4]).toBe(2);
        expect(stats.byStarRating[3]).toBe(2);
        expect(stats.byStarRating[2]).toBe(3);
        expect(stats.byStarRating[1]).toBe(1);
      });

      it('should count unique genes', async () => {
        const stats = await ClinVarLoader.getStats();
        expect(stats.uniqueGenes).toBe(7);
      });

      it('should count unique conditions', async () => {
        const stats = await ClinVarLoader.getStats();
        expect(stats.uniqueConditions).toBeGreaterThan(0);
      });
    });
  });

  describe('Data management', () => {
    describe('clear', () => {
      it('should clear all ClinVar data', async () => {
        await insertSampleRecords();
        expect(await ClinVarLoader.isLoaded()).toBe(true);

        await ClinVarLoader.clear();

        expect(await ClinVarLoader.isLoaded()).toBe(false);
        expect(await db.clinvar.count()).toBe(0);
        expect(await ClinVarLoader.getMetadata()).toBeUndefined();
      });
    });
  });

  describe('Load method', () => {
    it('should load data from gzipped bundle', async () => {
      const mockBundle = createMockBundle();

      // Mock fetch
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-length': String(mockBundle.length) }),
        body: {
          getReader: () => {
            let done = false;
            return {
              read: async () => {
                if (done) return { done: true, value: undefined };
                done = true;
                return { done: false, value: mockBundle };
              },
              releaseLock: () => {},
              cancel: () => {}
            };
          }
        }
      });
      global.fetch = mockFetch;

      const progressValues: number[] = [];
      const statusMessages: string[] = [];

      const loader = new ClinVarLoader({
        bundleUrl: 'https://example.com/clinvar.json.gz',
        onProgress: (p) => progressValues.push(p),
        onStatus: (s) => statusMessages.push(s)
      });

      await loader.load();

      // Verify data was loaded
      expect(await ClinVarLoader.isLoaded()).toBe(true);
      const count = await db.clinvar.count();
      expect(count).toBe(sampleRecords.length);

      // Verify progress was reported
      expect(progressValues.length).toBeGreaterThan(0);
      expect(progressValues[progressValues.length - 1]).toBe(100);

      // Verify status messages
      expect(statusMessages.length).toBeGreaterThan(0);
      expect(statusMessages.some(s => s.includes('Downloading'))).toBe(true);
      expect(statusMessages.some(s => s.includes('successfully'))).toBe(true);

      // Verify metadata was stored
      const metadata = await ClinVarLoader.getMetadata();
      expect(metadata?.version).toBe('2024-01-15');
      expect(metadata?.recordCount).toBe(sampleRecords.length);
    });

    it('should handle fetch errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const loader = new ClinVarLoader({
        bundleUrl: 'https://example.com/clinvar.json.gz'
      });

      await expect(loader.load()).rejects.toThrow('Failed to download ClinVar bundle: 404 Not Found');
    });

    it('should handle invalid gzip data', async () => {
      const invalidData = new Uint8Array([1, 2, 3, 4, 5]);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-length': '5' }),
        body: {
          getReader: () => {
            let done = false;
            return {
              read: async () => {
                if (done) return { done: true, value: undefined };
                done = true;
                return { done: false, value: invalidData };
              },
              releaseLock: () => {},
              cancel: () => {}
            };
          }
        }
      });

      const loader = new ClinVarLoader({
        bundleUrl: 'https://example.com/clinvar.json.gz'
      });

      await expect(loader.load()).rejects.toThrow('Failed to decompress');
    });

    it('should handle abort signal', async () => {
      const controller = new AbortController();
      controller.abort();

      const loader = new ClinVarLoader({
        bundleUrl: 'https://example.com/clinvar.json.gz',
        abortSignal: controller.signal
      });

      await expect(loader.load()).rejects.toThrow('Loading aborted');
    });
  });
});

describe('Data normalization', () => {
  it('should normalize rsID to lowercase with rs prefix', async () => {
    await db.clinvar.put({
      rsid: 'rs123456',
      gene: 'TEST',
      clinicalSignificance: 'benign',
      reviewStatus: 1,
      conditions: [],
      variationId: '123456',
      chromosome: '1',
      position: 1000,
      referenceAllele: 'A',
      alternateAllele: 'G'
    });

    // Should find with different case
    const record = await ClinVarLoader.lookup('RS123456');
    expect(record).toBeDefined();
  });

  it('should normalize gene names to uppercase', async () => {
    await db.clinvar.put({
      rsid: 'rs123456',
      gene: 'TEST',
      clinicalSignificance: 'benign',
      reviewStatus: 1,
      conditions: [],
      variationId: '123456',
      chromosome: '1',
      position: 1000,
      referenceAllele: 'A',
      alternateAllele: 'G'
    });

    // Should find with lowercase gene name
    const records = await ClinVarLoader.lookupByGene('test');
    expect(records.length).toBe(1);
  });
});
