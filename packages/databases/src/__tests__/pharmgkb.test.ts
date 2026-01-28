/**
 * PharmGKB loader tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PharmGKBLoader } from '../pharmgkb/loader';
import { db } from '../db';
import type { PharmGKBRecord, DrugInteraction } from '../types';
import pako from 'pako';

// Sample drug interactions for testing
const sampleDrugs: DrugInteraction[] = [
  {
    name: 'Codeine',
    genericName: 'codeine',
    categories: ['Opioid', 'Analgesic'],
    phenotypeText: 'Poor metabolizers may have reduced pain relief',
    dosingGuideline: 'Consider alternative analgesic',
    cpicGuideline: 'CPIC_codeine_CYP2D6'
  },
  {
    name: 'Warfarin',
    genericName: 'warfarin',
    categories: ['Anticoagulant'],
    phenotypeText: 'Dose adjustment may be required based on VKORC1 status',
    dosingGuideline: 'Use pharmacogenomic-based dosing'
  },
  {
    name: 'Clopidogrel',
    genericName: 'clopidogrel',
    categories: ['Antiplatelet'],
    phenotypeText: 'Poor metabolizers have reduced drug activation',
    dosingGuideline: 'Consider alternative therapy'
  }
];

// Sample PharmGKB records for testing
const sampleRecords: PharmGKBRecord[] = [
  {
    rsid: 'rs1065852',
    gene: 'CYP2D6',
    drugs: [sampleDrugs[0]], // Codeine
    phenotypes: ['Poor Metabolizer', 'Reduced enzyme activity'],
    evidenceLevel: '1A',
    cpicLevel: 'A'
  },
  {
    rsid: 'rs9923231',
    gene: 'VKORC1',
    drugs: [sampleDrugs[1]], // Warfarin
    phenotypes: ['Low warfarin dose required'],
    evidenceLevel: '1A',
    cpicLevel: 'A'
  },
  {
    rsid: 'rs4244285',
    gene: 'CYP2C19',
    drugs: [sampleDrugs[2]], // Clopidogrel
    phenotypes: ['Poor Metabolizer'],
    evidenceLevel: '1A',
    cpicLevel: 'A'
  },
  {
    rsid: 'rs1800460',
    gene: 'TPMT',
    drugs: [{
      name: 'Azathioprine',
      genericName: 'azathioprine',
      categories: ['Immunosuppressant'],
      phenotypeText: 'Reduced TPMT activity',
      dosingGuideline: 'Reduce dose'
    }],
    phenotypes: ['Intermediate Metabolizer'],
    evidenceLevel: '1B',
    cpicLevel: 'A'
  },
  {
    rsid: 'rs2108622',
    gene: 'CYP4F2',
    drugs: [sampleDrugs[1]], // Warfarin
    phenotypes: ['Altered warfarin metabolism'],
    evidenceLevel: '2A',
    cpicLevel: 'B'
  },
  {
    rsid: 'rs28399504',
    gene: 'CYP2D6',
    drugs: [{
      name: 'Tramadol',
      genericName: 'tramadol',
      categories: ['Opioid', 'Analgesic'],
      phenotypeText: 'Altered metabolism',
      dosingGuideline: 'Dose adjustment'
    }],
    phenotypes: ['Normal Metabolizer'],
    evidenceLevel: '2B',
    cpicLevel: 'C'
  },
  {
    rsid: 'rs12248560',
    gene: 'CYP2C19',
    drugs: [{
      name: 'Omeprazole',
      genericName: 'omeprazole',
      categories: ['Proton pump inhibitor', 'Antacid'],
      phenotypeText: 'Rapid metabolism',
      dosingGuideline: 'Standard dosing'
    }],
    phenotypes: ['Ultrarapid Metabolizer'],
    evidenceLevel: '3'
  },
  {
    rsid: 'rs1801280',
    gene: 'NAT2',
    drugs: [{
      name: 'Isoniazid',
      genericName: 'isoniazid',
      categories: ['Antibiotic', 'Anti-tuberculosis'],
      phenotypeText: 'Slow acetylator',
      dosingGuideline: 'Monitor for toxicity'
    }],
    phenotypes: ['Slow Acetylator'],
    evidenceLevel: '4',
    cpicLevel: 'D'
  }
];

// Helper to create a mock PharmGKB bundle
function createMockBundle(records: PharmGKBRecord[] = sampleRecords) {
  const bundle = {
    version: '2024-01-20',
    generated: '2024-01-20T12:00:00Z',
    recordCount: records.length,
    checksum: 'def456',
    records
  };
  return pako.gzip(JSON.stringify(bundle));
}

// Helper to setup direct database insertion for query tests
async function insertSampleRecords(records: PharmGKBRecord[] = sampleRecords) {
  await db.pharmgkb.bulkPut(records);
  await db.metadata.put({
    name: 'pharmgkb',
    version: '2024-01-20',
    lastUpdated: new Date('2024-01-20T12:00:00Z'),
    recordCount: records.length,
    source: 'https://www.pharmgkb.org',
    license: 'CC BY-SA 4.0'
  });
}

describe('PharmGKBLoader', () => {
  describe('Static utility methods', () => {
    describe('getCpicLevelText', () => {
      it('should return correct text for each CPIC level', () => {
        expect(PharmGKBLoader.getCpicLevelText('A')).toBe('Strong recommendation - prescribing action is recommended');
        expect(PharmGKBLoader.getCpicLevelText('B')).toBe('Moderate recommendation - prescribing action is recommended');
        expect(PharmGKBLoader.getCpicLevelText('C')).toBe('Optional recommendation - may be used to guide prescribing');
        expect(PharmGKBLoader.getCpicLevelText('D')).toBe('Insufficient evidence - no prescribing recommendation');
      });

      it('should handle lowercase', () => {
        expect(PharmGKBLoader.getCpicLevelText('a')).toBe('Strong recommendation - prescribing action is recommended');
      });

      it('should return default for unknown levels', () => {
        expect(PharmGKBLoader.getCpicLevelText('X')).toBe('No CPIC guideline available');
      });
    });

    describe('getCpicLevelSeverity', () => {
      it('should return correct severity for each level', () => {
        expect(PharmGKBLoader.getCpicLevelSeverity('A')).toBe(4);
        expect(PharmGKBLoader.getCpicLevelSeverity('B')).toBe(3);
        expect(PharmGKBLoader.getCpicLevelSeverity('C')).toBe(2);
        expect(PharmGKBLoader.getCpicLevelSeverity('D')).toBe(1);
      });

      it('should return -1 for undefined', () => {
        expect(PharmGKBLoader.getCpicLevelSeverity(undefined)).toBe(-1);
      });
    });

    describe('getEvidenceLevelText', () => {
      it('should return correct text for each evidence level', () => {
        expect(PharmGKBLoader.getEvidenceLevelText('1A')).toContain('CPIC');
        expect(PharmGKBLoader.getEvidenceLevelText('1B')).toContain('strong evidence');
        expect(PharmGKBLoader.getEvidenceLevelText('2A')).toContain('VIP');
        expect(PharmGKBLoader.getEvidenceLevelText('2B')).toContain('moderate');
        expect(PharmGKBLoader.getEvidenceLevelText('3')).toContain('conflicting');
        expect(PharmGKBLoader.getEvidenceLevelText('4')).toContain('case reports');
      });
    });

    describe('getEvidenceLevelSeverity', () => {
      it('should return correct severity for each level', () => {
        expect(PharmGKBLoader.getEvidenceLevelSeverity('1A')).toBe(6);
        expect(PharmGKBLoader.getEvidenceLevelSeverity('1B')).toBe(5);
        expect(PharmGKBLoader.getEvidenceLevelSeverity('2A')).toBe(4);
        expect(PharmGKBLoader.getEvidenceLevelSeverity('2B')).toBe(3);
        expect(PharmGKBLoader.getEvidenceLevelSeverity('3')).toBe(2);
        expect(PharmGKBLoader.getEvidenceLevelSeverity('4')).toBe(1);
      });

      it('should return -1 for undefined', () => {
        expect(PharmGKBLoader.getEvidenceLevelSeverity(undefined)).toBe(-1);
      });
    });

    describe('parsePhenotype', () => {
      it('should parse poor metabolizer', () => {
        const result = PharmGKBLoader.parsePhenotype('Poor Metabolizer');
        expect(result.category).toBe('poor');
        expect(result.clinicalImplication).toContain('dose reduction');
      });

      it('should parse intermediate metabolizer', () => {
        const result = PharmGKBLoader.parsePhenotype('Intermediate Metabolizer');
        expect(result.category).toBe('intermediate');
      });

      it('should parse normal/extensive metabolizer', () => {
        expect(PharmGKBLoader.parsePhenotype('Normal Metabolizer').category).toBe('normal');
        expect(PharmGKBLoader.parsePhenotype('Extensive Metabolizer').category).toBe('normal');
      });

      it('should parse rapid metabolizer', () => {
        const result = PharmGKBLoader.parsePhenotype('Rapid Metabolizer');
        expect(result.category).toBe('rapid');
      });

      it('should parse ultrarapid metabolizer', () => {
        const result = PharmGKBLoader.parsePhenotype('Ultrarapid Metabolizer');
        expect(result.category).toBe('ultrarapid');
        expect(result.clinicalImplication).toContain('prodrugs');
      });

      it('should parse abbreviations', () => {
        expect(PharmGKBLoader.parsePhenotype('PM').category).toBe('poor');
        expect(PharmGKBLoader.parsePhenotype('IM').category).toBe('intermediate');
        expect(PharmGKBLoader.parsePhenotype('NM').category).toBe('normal');
        expect(PharmGKBLoader.parsePhenotype('RM').category).toBe('rapid');
        expect(PharmGKBLoader.parsePhenotype('UM').category).toBe('ultrarapid');
      });

      it('should return unknown for unrecognized phenotypes', () => {
        const result = PharmGKBLoader.parsePhenotype('Something else');
        expect(result.category).toBe('unknown');
      });
    });

    describe('getAttribution', () => {
      it('should return correct attribution text', () => {
        expect(PharmGKBLoader.getAttribution()).toContain('PharmGKB');
        expect(PharmGKBLoader.getAttribution()).toContain('https://www.pharmgkb.org');
      });
    });

    describe('getLicenseInfo', () => {
      it('should return license information', () => {
        const info = PharmGKBLoader.getLicenseInfo();
        expect(info.license).toBe('CC BY-SA 4.0');
        expect(info.attribution).toContain('PharmGKB');
        expect(info.url).toContain('creativecommons.org');
      });
    });

    describe('formatDrugInteraction', () => {
      it('should format drug with different generic name', () => {
        const drug: DrugInteraction = {
          name: 'Plavix',
          genericName: 'clopidogrel',
          categories: ['Antiplatelet'],
          phenotypeText: 'Test'
        };
        expect(PharmGKBLoader.formatDrugInteraction(drug)).toBe('Plavix (clopidogrel) - Antiplatelet');
      });

      it('should format drug with same name', () => {
        const drug: DrugInteraction = {
          name: 'Warfarin',
          genericName: 'warfarin',
          categories: ['Anticoagulant'],
          phenotypeText: 'Test'
        };
        expect(PharmGKBLoader.formatDrugInteraction(drug)).toBe('Warfarin - Anticoagulant');
      });

      it('should format drug without categories', () => {
        const drug: DrugInteraction = {
          name: 'TestDrug',
          genericName: 'testdrug',
          categories: [],
          phenotypeText: 'Test'
        };
        expect(PharmGKBLoader.formatDrugInteraction(drug)).toBe('TestDrug');
      });
    });
  });

  describe('Database status methods', () => {
    describe('isLoaded', () => {
      it('should return false when database is empty', async () => {
        expect(await PharmGKBLoader.isLoaded()).toBe(false);
      });

      it('should return true when database has records', async () => {
        await insertSampleRecords();
        expect(await PharmGKBLoader.isLoaded()).toBe(true);
      });
    });

    describe('getMetadata', () => {
      it('should return undefined when no metadata', async () => {
        expect(await PharmGKBLoader.getMetadata()).toBeUndefined();
      });

      it('should return metadata when loaded', async () => {
        await insertSampleRecords();
        const metadata = await PharmGKBLoader.getMetadata();
        expect(metadata).toBeDefined();
        expect(metadata?.version).toBe('2024-01-20');
        expect(metadata?.license).toBe('CC BY-SA 4.0');
      });
    });

    describe('getVersionInfo', () => {
      it('should return empty info when database not loaded', async () => {
        const info = await PharmGKBLoader.getVersionInfo();
        expect(info.currentVersion).toBeNull();
        expect(info.recordCount).toBe(0);
        expect(info.needsUpdate).toBe(true);
      });

      it('should return version info when loaded', async () => {
        await insertSampleRecords();
        const info = await PharmGKBLoader.getVersionInfo();
        expect(info.currentVersion).toBe('2024-01-20');
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
        const record = await PharmGKBLoader.lookup('rs1065852');
        expect(record).toBeDefined();
        expect(record?.gene).toBe('CYP2D6');
      });

      it('should normalize rsID case', async () => {
        const record = await PharmGKBLoader.lookup('RS1065852');
        expect(record).toBeDefined();
      });

      it('should return undefined for non-existent rsID', async () => {
        const record = await PharmGKBLoader.lookup('rs99999999');
        expect(record).toBeUndefined();
      });
    });

    describe('lookupBatch', () => {
      it('should find multiple records', async () => {
        const rsids = ['rs1065852', 'rs9923231', 'rs4244285'];
        const results = await PharmGKBLoader.lookupBatch(rsids);

        expect(results.size).toBe(3);
        expect(results.get('rs1065852')?.gene).toBe('CYP2D6');
        expect(results.get('rs9923231')?.gene).toBe('VKORC1');
        expect(results.get('rs4244285')?.gene).toBe('CYP2C19');
      });

      it('should handle empty array', async () => {
        const results = await PharmGKBLoader.lookupBatch([]);
        expect(results.size).toBe(0);
      });
    });

    describe('lookupByGene', () => {
      it('should find all records for a gene', async () => {
        const records = await PharmGKBLoader.lookupByGene('CYP2D6');
        expect(records.length).toBe(2);
      });

      it('should normalize gene name case', async () => {
        const records = await PharmGKBLoader.lookupByGene('cyp2d6');
        expect(records.length).toBe(2);
      });
    });
  });

  describe('Query methods', () => {
    beforeEach(async () => {
      await insertSampleRecords();
    });

    describe('query', () => {
      it('should filter by evidence level', async () => {
        const results = await PharmGKBLoader.query({ evidenceLevels: ['1A'] });
        expect(results.length).toBe(3);
        results.forEach(r => expect(r.evidenceLevel).toBe('1A'));
      });

      it('should filter by CPIC level', async () => {
        const results = await PharmGKBLoader.query({ cpicLevels: ['A'] });
        expect(results.length).toBe(4);
      });

      it('should filter by gene', async () => {
        const results = await PharmGKBLoader.query({ gene: 'CYP2C19' });
        expect(results.length).toBe(2);
      });

      it('should filter by phenotype', async () => {
        const results = await PharmGKBLoader.query({ phenotype: 'Poor' });
        expect(results.length).toBe(2);
      });

      it('should apply limit', async () => {
        const results = await PharmGKBLoader.query({ limit: 3 });
        expect(results.length).toBe(3);
      });

      it('should combine filters', async () => {
        const results = await PharmGKBLoader.query({
          evidenceLevels: ['1A', '1B'],
          cpicLevels: ['A']
        });
        expect(results.length).toBe(4);
      });
    });

    describe('getVariantsForDrug', () => {
      it('should find variants by drug name', async () => {
        const records = await PharmGKBLoader.getVariantsForDrug('Warfarin');
        expect(records.length).toBe(2);
      });

      it('should match generic name', async () => {
        const records = await PharmGKBLoader.getVariantsForDrug('codeine');
        expect(records.length).toBe(1);
      });
    });

    describe('getByEvidenceLevel', () => {
      it('should filter by exact evidence level', async () => {
        const records = await PharmGKBLoader.getByEvidenceLevel('1A');
        expect(records.length).toBe(3);
      });
    });

    describe('getByCpicLevel', () => {
      it('should filter by CPIC level', async () => {
        const records = await PharmGKBLoader.getByCpicLevel('A');
        expect(records.length).toBe(4);
      });
    });

    describe('getHighEvidenceVariants', () => {
      it('should return 1A and 1B variants', async () => {
        const records = await PharmGKBLoader.getHighEvidenceVariants();
        expect(records.length).toBe(4);
        records.forEach(r => {
          expect(['1A', '1B']).toContain(r.evidenceLevel);
        });
      });
    });

    describe('getActionableVariants', () => {
      it('should return A and B CPIC level variants', async () => {
        const records = await PharmGKBLoader.getActionableVariants();
        expect(records.length).toBe(5);
        records.forEach(r => {
          expect(['A', 'B']).toContain(r.cpicLevel);
        });
      });
    });

    describe('searchDrugs', () => {
      it('should search by drug name', async () => {
        const results = await PharmGKBLoader.searchDrugs('Codeine');
        expect(results.length).toBe(1);
        expect(results[0].drug.name).toBe('Codeine');
      });

      it('should search by drug category', async () => {
        const results = await PharmGKBLoader.searchDrugs('Opioid');
        expect(results.length).toBe(2);
      });
    });

    describe('getAllDrugs', () => {
      it('should return all unique drugs', async () => {
        const drugs = await PharmGKBLoader.getAllDrugs();
        expect(drugs.length).toBeGreaterThan(0);
        expect(drugs).toContain('codeine');
        expect(drugs).toContain('warfarin');
      });
    });

    describe('getAllGenes', () => {
      it('should return all unique genes', async () => {
        const genes = await PharmGKBLoader.getAllGenes();
        expect(genes.length).toBe(6);
        expect(genes).toContain('CYP2D6');
        expect(genes).toContain('VKORC1');
      });
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      await insertSampleRecords();
    });

    describe('getStats', () => {
      it('should return correct total count', async () => {
        const stats = await PharmGKBLoader.getStats();
        expect(stats.totalRecords).toBe(sampleRecords.length);
      });

      it('should count by evidence level', async () => {
        const stats = await PharmGKBLoader.getStats();
        expect(stats.byEvidenceLevel['1A']).toBe(3);
        expect(stats.byEvidenceLevel['1B']).toBe(1);
      });

      it('should count by CPIC level', async () => {
        const stats = await PharmGKBLoader.getStats();
        expect(stats.byCpicLevel['A']).toBe(4);
        expect(stats.byCpicLevel['B']).toBe(1);
      });

      it('should count unique genes', async () => {
        const stats = await PharmGKBLoader.getStats();
        expect(stats.uniqueGenes).toBe(6);
      });

      it('should count unique drugs', async () => {
        const stats = await PharmGKBLoader.getStats();
        expect(stats.uniqueDrugs).toBeGreaterThan(0);
      });

      it('should count total drug interactions', async () => {
        const stats = await PharmGKBLoader.getStats();
        expect(stats.totalDrugInteractions).toBe(sampleRecords.length);
      });
    });
  });

  describe('Data management', () => {
    describe('clear', () => {
      it('should clear all PharmGKB data', async () => {
        await insertSampleRecords();
        expect(await PharmGKBLoader.isLoaded()).toBe(true);

        await PharmGKBLoader.clear();

        expect(await PharmGKBLoader.isLoaded()).toBe(false);
        expect(await db.pharmgkb.count()).toBe(0);
      });
    });
  });

  describe('Load method', () => {
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

      const progressValues: number[] = [];

      const loader = new PharmGKBLoader({
        bundleUrl: 'https://example.com/pharmgkb.json.gz',
        onProgress: (p) => progressValues.push(p)
      });

      await loader.load();

      expect(await PharmGKBLoader.isLoaded()).toBe(true);
      expect(progressValues[progressValues.length - 1]).toBe(100);
    });

    it('should handle fetch errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const loader = new PharmGKBLoader({
        bundleUrl: 'https://example.com/pharmgkb.json.gz'
      });

      await expect(loader.load()).rejects.toThrow('Failed to download PharmGKB bundle');
    });

    it('should handle abort signal', async () => {
      const controller = new AbortController();
      controller.abort();

      const loader = new PharmGKBLoader({
        bundleUrl: 'https://example.com/pharmgkb.json.gz',
        abortSignal: controller.signal
      });

      await expect(loader.load()).rejects.toThrow('Loading aborted');
    });
  });
});
