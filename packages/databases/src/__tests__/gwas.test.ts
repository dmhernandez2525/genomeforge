/**
 * GWAS Catalog loader tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GWASLoader } from '../gwas/loader';
import { db } from '../db';
import type { GWASRecord } from '../types';
import pako from 'pako';

// Sample GWAS records for testing
const sampleRecords: GWASRecord[] = [
  {
    rsid: 'rs12913832',
    chromosome: '15',
    position: 28365618,
    trait: 'Eye color',
    pValue: 1e-300,
    orBeta: 2.5,
    riskAllele: 'A',
    studyAccession: 'GCST001840',
    pubmedId: '18488026'
  },
  {
    rsid: 'rs1426654',
    chromosome: '15',
    position: 48426484,
    trait: 'Skin pigmentation',
    pValue: 5e-35,
    orBeta: 1.8,
    riskAllele: 'G',
    studyAccession: 'GCST000879',
    pubmedId: '17434148'
  },
  {
    rsid: 'rs9939609',
    chromosome: '16',
    position: 53786615,
    trait: 'Body mass index',
    pValue: 1e-20,
    orBeta: 1.31,
    riskAllele: 'A',
    studyAccession: 'GCST000069',
    pubmedId: '17434869'
  },
  {
    rsid: 'rs1558902',
    chromosome: '16',
    position: 53803574,
    trait: 'Body mass index',
    pValue: 5e-9,
    orBeta: 1.25,
    riskAllele: 'A',
    studyAccession: 'GCST001632',
    pubmedId: '22344219'
  },
  {
    rsid: 'rs7903146',
    chromosome: '10',
    position: 112998590,
    trait: 'Type 2 diabetes',
    pValue: 1e-50,
    orBeta: 1.37,
    riskAllele: 'T',
    studyAccession: 'GCST000371',
    pubmedId: '18372903'
  },
  {
    rsid: 'rs12255372',
    chromosome: '10',
    position: 112998898,
    trait: 'Type 2 diabetes',
    pValue: 5e-6,
    orBeta: 1.12,
    riskAllele: 'T',
    studyAccession: 'GCST000371',
    pubmedId: '18372903'
  },
  {
    rsid: 'rs4988235',
    chromosome: '2',
    position: 136608646,
    trait: 'Lactose intolerance',
    pValue: 1e-100,
    orBeta: 0.1,
    riskAllele: 'A',
    studyAccession: 'GCST002419',
    pubmedId: '15106124'
  },
  {
    rsid: 'rs182549',
    chromosome: '6',
    position: 32584017,
    trait: 'Multiple sclerosis',
    pValue: 0.001,
    orBeta: 1.15,
    riskAllele: 'C',
    studyAccession: 'GCST002855',
    pubmedId: '22190364'
  },
  {
    rsid: 'rs6983267',
    chromosome: '8',
    position: 128413305,
    trait: 'Colorectal cancer',
    pValue: 0.01,
    orBeta: 1.21,
    riskAllele: 'G',
    studyAccession: 'GCST000117',
    pubmedId: '17618283'
  },
  {
    rsid: 'rs10490924',
    chromosome: '10',
    position: 124214448,
    trait: 'Age-related macular degeneration',
    pValue: 0.1,
    orBeta: 2.76,
    riskAllele: 'T',
    studyAccession: 'GCST000192',
    pubmedId: '18535592'
  }
];

// Helper to create a mock GWAS bundle
function createMockBundle(records: GWASRecord[] = sampleRecords) {
  const bundle = {
    version: '2024-01-25',
    generated: '2024-01-25T12:00:00Z',
    recordCount: records.length,
    checksum: 'ghi789',
    records
  };
  return pako.gzip(JSON.stringify(bundle));
}

// Helper to setup direct database insertion for query tests
async function insertSampleRecords(records: GWASRecord[] = sampleRecords) {
  await db.gwas.bulkPut(records);
  await db.metadata.put({
    name: 'gwas',
    version: '2024-01-25',
    lastUpdated: new Date('2024-01-25T12:00:00Z'),
    recordCount: records.length,
    source: 'https://www.ebi.ac.uk/gwas/',
    license: 'CC0'
  });
}

describe('GWASLoader', () => {
  describe('Static utility methods', () => {
    describe('formatPValue', () => {
      it('should format large p-values', () => {
        expect(GWASLoader.formatPValue(0.05)).toBe('0.050');
        expect(GWASLoader.formatPValue(0.123)).toBe('0.123');
      });

      it('should format small p-values in scientific notation', () => {
        expect(GWASLoader.formatPValue(1e-10)).toBe('1.00e-10');
        expect(GWASLoader.formatPValue(5e-8)).toBe('5.00e-8');
      });

      it('should handle zero', () => {
        expect(GWASLoader.formatPValue(0)).toBe('0');
      });
    });

    describe('getSignificanceText', () => {
      it('should return correct text for each significance level', () => {
        expect(GWASLoader.getSignificanceText(1e-10)).toBe('Genome-wide significant');
        expect(GWASLoader.getSignificanceText(1e-6)).toBe('Suggestive');
        expect(GWASLoader.getSignificanceText(0.01)).toBe('Nominally significant');
        expect(GWASLoader.getSignificanceText(0.1)).toBe('Not significant');
      });
    });

    describe('getSignificanceLevel', () => {
      it('should return correct severity levels', () => {
        expect(GWASLoader.getSignificanceLevel(1e-10)).toBe(4);
        expect(GWASLoader.getSignificanceLevel(1e-6)).toBe(3);
        expect(GWASLoader.getSignificanceLevel(0.01)).toBe(2);
        expect(GWASLoader.getSignificanceLevel(0.1)).toBe(1);
      });
    });

    describe('formatEffect', () => {
      it('should format odds ratio', () => {
        expect(GWASLoader.formatEffect(1.5)).toBe('1.50');
        expect(GWASLoader.formatEffect(0.75)).toBe('0.75');
      });

      it('should handle undefined', () => {
        expect(GWASLoader.formatEffect(undefined)).toBe('N/A');
      });
    });

    describe('isRiskIncreasing', () => {
      it('should identify risk-increasing effects', () => {
        expect(GWASLoader.isRiskIncreasing(1.5)).toBe(true);
        expect(GWASLoader.isRiskIncreasing(0.5)).toBe(false);
        expect(GWASLoader.isRiskIncreasing(1)).toBe(false);
      });

      it('should handle undefined', () => {
        expect(GWASLoader.isRiskIncreasing(undefined)).toBeNull();
      });
    });

    describe('getPubMedUrl', () => {
      it('should build PubMed URL', () => {
        expect(GWASLoader.getPubMedUrl('12345')).toBe('https://pubmed.ncbi.nlm.nih.gov/12345/');
      });

      it('should handle undefined', () => {
        expect(GWASLoader.getPubMedUrl(undefined)).toBeNull();
      });
    });

    describe('getStudyUrl', () => {
      it('should build study URL', () => {
        expect(GWASLoader.getStudyUrl('GCST001234')).toBe('https://www.ebi.ac.uk/gwas/studies/GCST001234');
      });
    });
  });

  describe('Database status methods', () => {
    describe('isLoaded', () => {
      it('should return false when database is empty', async () => {
        expect(await GWASLoader.isLoaded()).toBe(false);
      });

      it('should return true when database has records', async () => {
        await insertSampleRecords();
        expect(await GWASLoader.isLoaded()).toBe(true);
      });
    });

    describe('getMetadata', () => {
      it('should return undefined when no metadata', async () => {
        expect(await GWASLoader.getMetadata()).toBeUndefined();
      });

      it('should return metadata when loaded', async () => {
        await insertSampleRecords();
        const metadata = await GWASLoader.getMetadata();
        expect(metadata).toBeDefined();
        expect(metadata?.version).toBe('2024-01-25');
        expect(metadata?.license).toBe('CC0');
      });
    });

    describe('getVersionInfo', () => {
      it('should return empty info when database not loaded', async () => {
        const info = await GWASLoader.getVersionInfo();
        expect(info.currentVersion).toBeNull();
        expect(info.recordCount).toBe(0);
        expect(info.needsUpdate).toBe(true);
      });

      it('should return version info when loaded', async () => {
        await insertSampleRecords();
        const info = await GWASLoader.getVersionInfo();
        expect(info.currentVersion).toBe('2024-01-25');
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
      it('should find records by rsID', async () => {
        const records = await GWASLoader.lookup('rs12913832');
        expect(records.length).toBe(1);
        expect(records[0].trait).toBe('Eye color');
      });

      it('should normalize rsID case', async () => {
        const records = await GWASLoader.lookup('RS12913832');
        expect(records.length).toBe(1);
      });

      it('should return empty array for non-existent rsID', async () => {
        const records = await GWASLoader.lookup('rs99999999');
        expect(records.length).toBe(0);
      });
    });

    describe('lookupBatch', () => {
      it('should find multiple rsIDs', async () => {
        const rsids = ['rs12913832', 'rs9939609', 'rs7903146'];
        const results = await GWASLoader.lookupBatch(rsids);

        expect(results.size).toBe(3);
        expect(results.get('rs12913832')?.length).toBe(1);
        expect(results.get('rs9939609')?.length).toBe(1);
      });

      it('should handle empty array', async () => {
        const results = await GWASLoader.lookupBatch([]);
        expect(results.size).toBe(0);
      });
    });

    describe('lookupByTrait', () => {
      it('should find records by trait', async () => {
        const records = await GWASLoader.lookupByTrait('diabetes');
        expect(records.length).toBe(2);
      });

      it('should be case-insensitive', async () => {
        const records = await GWASLoader.lookupByTrait('DIABETES');
        expect(records.length).toBe(2);
      });
    });
  });

  describe('Query methods', () => {
    beforeEach(async () => {
      await insertSampleRecords();
    });

    describe('query', () => {
      it('should filter by trait', async () => {
        const results = await GWASLoader.query({ trait: 'Body mass' });
        expect(results.length).toBe(2);
      });

      it('should filter by chromosome', async () => {
        const results = await GWASLoader.query({ chromosome: '10' });
        expect(results.length).toBe(3);
      });

      it('should filter by max p-value', async () => {
        const results = await GWASLoader.query({ maxPValue: 5e-8 });
        // Genome-wide significant: rs12913832, rs1426654, rs9939609, rs1558902, rs7903146, rs4988235
        expect(results.length).toBe(6);
      });

      it('should filter by min effect', async () => {
        const results = await GWASLoader.query({ minEffect: 2 });
        expect(results.length).toBe(2); // rs12913832 (2.5), rs10490924 (2.76)
      });

      it('should apply limit', async () => {
        const results = await GWASLoader.query({ limit: 3 });
        expect(results.length).toBe(3);
      });

      it('should combine filters', async () => {
        const results = await GWASLoader.query({
          chromosome: '10',
          maxPValue: 5e-8
        });
        expect(results.length).toBe(1); // Only rs7903146
      });
    });

    describe('getGenomeWideSignificant', () => {
      it('should return genome-wide significant associations', async () => {
        const records = await GWASLoader.getGenomeWideSignificant();
        expect(records.length).toBe(6);
        records.forEach(r => expect(r.pValue).toBeLessThan(5e-8));
      });

      it('should apply limit', async () => {
        const records = await GWASLoader.getGenomeWideSignificant(2);
        expect(records.length).toBe(2);
      });
    });

    describe('getTopAssociations', () => {
      it('should return top associations sorted by p-value', async () => {
        const records = await GWASLoader.getTopAssociations(3);
        expect(records.length).toBe(3);
        expect(records[0].rsid).toBe('rs12913832'); // Lowest p-value
      });
    });

    describe('getByChromosome', () => {
      it('should filter by chromosome', async () => {
        const records = await GWASLoader.getByChromosome('15');
        expect(records.length).toBe(2);
      });

      it('should normalize chromosome format', async () => {
        const records = await GWASLoader.getByChromosome('chr15');
        expect(records.length).toBe(2);
      });
    });

    describe('getByRegion', () => {
      it('should filter by genomic region', async () => {
        const records = await GWASLoader.getByRegion('10', 112998000, 113000000);
        expect(records.length).toBe(2); // rs7903146, rs12255372
      });
    });

    describe('searchTraits', () => {
      it('should search and summarize traits', async () => {
        const summaries = await GWASLoader.searchTraits('body');
        expect(summaries.length).toBe(1);
        expect(summaries[0].trait).toBe('Body mass index');
        expect(summaries[0].associationCount).toBe(2);
      });
    });

    describe('getAllTraits', () => {
      it('should return all unique traits', async () => {
        const traits = await GWASLoader.getAllTraits();
        expect(traits.length).toBe(8);
        expect(traits).toContain('Eye color');
        expect(traits).toContain('Type 2 diabetes');
      });
    });

    describe('getAllStudies', () => {
      it('should return all unique studies', async () => {
        const studies = await GWASLoader.getAllStudies();
        expect(studies.length).toBeGreaterThan(0);
        expect(studies).toContain('GCST001840');
      });
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      await insertSampleRecords();
    });

    describe('getStats', () => {
      it('should return correct total count', async () => {
        const stats = await GWASLoader.getStats();
        expect(stats.totalRecords).toBe(sampleRecords.length);
      });

      it('should count unique rsIDs', async () => {
        const stats = await GWASLoader.getStats();
        expect(stats.uniqueRsids).toBe(sampleRecords.length);
      });

      it('should count unique traits', async () => {
        const stats = await GWASLoader.getStats();
        expect(stats.uniqueTraits).toBe(8);
      });

      it('should count by chromosome', async () => {
        const stats = await GWASLoader.getStats();
        expect(stats.byChromosome['15']).toBe(2);
        expect(stats.byChromosome['10']).toBe(3);
      });

      it('should calculate p-value distribution', async () => {
        const stats = await GWASLoader.getStats();
        expect(stats.pValueDistribution.genomeWideSignificant).toBe(6);
        expect(stats.pValueDistribution.suggestive).toBe(1);
        expect(stats.pValueDistribution.nominal).toBe(2);
        expect(stats.pValueDistribution.other).toBe(1);
      });
    });
  });

  describe('Data management', () => {
    describe('clear', () => {
      it('should clear all GWAS data', async () => {
        await insertSampleRecords();
        expect(await GWASLoader.isLoaded()).toBe(true);

        await GWASLoader.clear();

        expect(await GWASLoader.isLoaded()).toBe(false);
        expect(await db.gwas.count()).toBe(0);
      });
    });
  });

  describe('Load from bundle', () => {
    it('should load data from gzipped bundle', async () => {
      const mockBundle = createMockBundle();

      global.fetch = vi.fn().mockResolvedValue({
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

      const loader = new GWASLoader({
        bundleUrl: 'https://example.com/gwas.json.gz'
      });

      await loader.loadFromBundle();

      expect(await GWASLoader.isLoaded()).toBe(true);
      expect(await db.gwas.count()).toBe(sampleRecords.length);
    });

    it('should require bundle URL', async () => {
      const loader = new GWASLoader({});

      await expect(loader.loadFromBundle()).rejects.toThrow('Bundle URL is required');
    });

    it('should handle abort signal', async () => {
      const controller = new AbortController();
      controller.abort();

      const loader = new GWASLoader({
        bundleUrl: 'https://example.com/gwas.json.gz',
        abortSignal: controller.signal
      });

      await expect(loader.loadFromBundle()).rejects.toThrow('Loading aborted');
    });
  });
});
