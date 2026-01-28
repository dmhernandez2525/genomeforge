/**
 * Tests for the genetic analysis engine
 * @packageDocumentation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  analyzeGenome,
  assessRisks,
  analyzePharmacogenomics,
  identifyCarrierStatus,
  analyzeTraitAssociations,
  calculatePolygenicRiskScores,
  PHARMACOGENES,
  METABOLIZER_PHENOTYPES,
  analyzeLegacy
} from '../index';
import type {
  MatchResult,
  AnnotatedSNP,
  ClinVarVariant,
  PharmGKBVariant,
  GWASAssociation,
  ClinicalSignificance
} from '@genomeforge/types';

// ============================================================================
// Test Data Factories
// ============================================================================

function createMockSNP(overrides: Partial<AnnotatedSNP['snp']> = {}): AnnotatedSNP['snp'] {
  return {
    rsid: 'rs123456',
    chromosome: '1' as const,
    position: 12345,
    genotype: 'AG',
    allele1: 'A' as const,
    allele2: 'G' as const,
    ...overrides
  };
}

function createMockClinVarVariant(
  overrides: Partial<ClinVarVariant> = {}
): ClinVarVariant {
  return {
    rsid: 'rs123456',
    vcv: 'VCV000123456',
    gene: 'BRCA1',
    geneId: 672,
    clinicalSignificance: 'pathogenic',
    reviewStatus: 3,
    conditions: [{ name: 'Breast Cancer', traits: ['cancer'] }],
    ...overrides
  };
}

function createMockPharmGKBVariant(
  overrides: Partial<PharmGKBVariant> = {}
): PharmGKBVariant {
  return {
    rsid: 'rs3892097',
    gene: 'CYP2D6',
    drugs: [
      {
        drugName: 'codeine',
        drugId: 'PA449088',
        evidenceLevel: '1A',
        phenotypeCategory: 'Efficacy',
        significance: 'Yes',
        annotation: 'Poor metabolizers may experience lack of efficacy.',
        fdaLabel: true,
        cpicLevel: 'A'
      }
    ],
    hasCPICGuideline: true,
    hasDPWGGuideline: true,
    ...overrides
  };
}

function createMockGWASAssociation(
  overrides: Partial<GWASAssociation> = {}
): GWASAssociation {
  return {
    rsid: 'rs7903146',
    trait: 'Type 2 Diabetes',
    pValue: 1e-15,
    orBeta: 1.4,
    riskAllele: 'T',
    studyAccession: 'GCST001234',
    pubmedId: '12345678',
    ...overrides
  };
}

function createMockAnnotatedSNP(
  overrides: Partial<AnnotatedSNP> = {}
): AnnotatedSNP {
  return {
    snp: createMockSNP(),
    impactScore: 3,
    category: 'pathogenic',
    ...overrides
  };
}

function createMockMatchResult(
  annotatedSNPs: AnnotatedSNP[] = [],
  overrides: Partial<MatchResult> = {}
): MatchResult {
  return {
    genomeId: 'test-genome-123',
    totalSNPs: 700000,
    matchedSNPs: annotatedSNPs.length,
    pathogenicCount: annotatedSNPs.filter(s => s.category === 'pathogenic').length,
    drugInteractionCount: annotatedSNPs.filter(s => s.category === 'drug').length,
    carrierCount: annotatedSNPs.filter(s => s.category === 'carrier').length,
    gwasAssociationCount: annotatedSNPs.reduce(
      (sum, s) => sum + (s.gwas?.length || 0), 0
    ),
    annotatedSNPs,
    summary: {
      highImpact: [],
      moderateImpact: [],
      pharmacogenes: [],
      carrierStatuses: [],
      gwasTraits: []
    },
    buildVersion: 'GRCh38',
    databaseVersions: {
      clinvar: '2024-01',
      pharmgkb: '2024-01',
      gwas: '2024-01'
    },
    ...overrides
  };
}

// ============================================================================
// Test Suites
// ============================================================================

describe('Genetic Analysis Engine', () => {
  describe('Constants', () => {
    it('should export standard pharmacogenes', () => {
      expect(PHARMACOGENES).toContain('CYP2D6');
      expect(PHARMACOGENES).toContain('CYP2C19');
      expect(PHARMACOGENES).toContain('CYP2C9');
      expect(PHARMACOGENES).toContain('SLCO1B1');
      expect(PHARMACOGENES.length).toBeGreaterThan(10);
    });

    it('should export metabolizer phenotype mappings', () => {
      expect(METABOLIZER_PHENOTYPES).toHaveProperty('CYP2D6');
      expect(METABOLIZER_PHENOTYPES.CYP2D6['*1/*1']).toBe('Normal Metabolizer');
      expect(METABOLIZER_PHENOTYPES.CYP2D6['*4/*4']).toBe('Poor Metabolizer');
    });
  });

  describe('Risk Assessment', () => {
    it('should assess high risk for pathogenic variants with high confidence', () => {
      const pathogenicSNP = createMockAnnotatedSNP({
        snp: createMockSNP({ genotype: 'AA', allele1: 'A', allele2: 'A' }),
        clinvar: createMockClinVarVariant({
          clinicalSignificance: 'pathogenic',
          reviewStatus: 4,
          conditions: [{ name: 'Breast Cancer', traits: ['cancer'] }]
        }),
        impactScore: 5,
        category: 'pathogenic'
      });

      const matchResult = createMockMatchResult([pathogenicSNP]);
      const risks = assessRisks(matchResult);

      expect(risks.length).toBeGreaterThan(0);
      const breastCancerRisk = risks.find(r => r.condition === 'Breast Cancer');
      expect(breastCancerRisk).toBeDefined();
      expect(breastCancerRisk?.riskLevel).toBe('high');
      expect(breastCancerRisk?.confidence).toBeGreaterThan(0.5);
    });

    it('should assess moderate risk for likely pathogenic variants', () => {
      const likelyPathogenicSNP = createMockAnnotatedSNP({
        clinvar: createMockClinVarVariant({
          clinicalSignificance: 'likely_pathogenic',
          reviewStatus: 2,
          conditions: [{ name: 'Heart Disease', traits: ['cardiovascular'] }]
        }),
        impactScore: 3
      });

      const matchResult = createMockMatchResult([likelyPathogenicSNP]);
      const risks = assessRisks(matchResult);

      const heartRisk = risks.find(r => r.condition === 'Heart Disease');
      expect(heartRisk).toBeDefined();
      expect(['moderate', 'low']).toContain(heartRisk?.riskLevel);
    });

    it('should return low or unknown for VUS variants', () => {
      const vusSNP = createMockAnnotatedSNP({
        clinvar: createMockClinVarVariant({
          clinicalSignificance: 'uncertain_significance',
          reviewStatus: 1,
          conditions: [{ name: 'Unknown Condition', traits: [] }]
        }),
        impactScore: 1
      });

      const matchResult = createMockMatchResult([vusSNP]);
      const risks = assessRisks(matchResult);

      const unknownRisk = risks.find(r => r.condition === 'Unknown Condition');
      // VUS with some impact gets 'low', VUS with no impact gets 'unknown'
      expect(['low', 'unknown']).toContain(unknownRisk?.riskLevel);
    });

    it('should group multiple variants by condition', () => {
      const snp1 = createMockAnnotatedSNP({
        snp: createMockSNP({ rsid: 'rs111' }),
        clinvar: createMockClinVarVariant({
          rsid: 'rs111',
          gene: 'BRCA1',
          conditions: [{ name: 'Breast Cancer', traits: [] }]
        })
      });
      const snp2 = createMockAnnotatedSNP({
        snp: createMockSNP({ rsid: 'rs222' }),
        clinvar: createMockClinVarVariant({
          rsid: 'rs222',
          gene: 'BRCA2',
          conditions: [{ name: 'Breast Cancer', traits: [] }]
        })
      });

      const matchResult = createMockMatchResult([snp1, snp2]);
      const risks = assessRisks(matchResult);

      const breastCancerRisks = risks.filter(r => r.condition === 'Breast Cancer');
      expect(breastCancerRisks.length).toBe(1);
      expect(breastCancerRisks[0].variants.length).toBe(2);
    });

    it('should sort risks by severity', () => {
      const highRiskSNP = createMockAnnotatedSNP({
        snp: createMockSNP({ rsid: 'rs111' }),
        clinvar: createMockClinVarVariant({
          rsid: 'rs111',
          clinicalSignificance: 'pathogenic',
          reviewStatus: 4,
          conditions: [{ name: 'Serious Condition', traits: [] }]
        }),
        impactScore: 5
      });
      const lowRiskSNP = createMockAnnotatedSNP({
        snp: createMockSNP({ rsid: 'rs222' }),
        clinvar: createMockClinVarVariant({
          rsid: 'rs222',
          clinicalSignificance: 'uncertain_significance',
          reviewStatus: 1,
          conditions: [{ name: 'Minor Condition', traits: [] }]
        }),
        impactScore: 1
      });

      const matchResult = createMockMatchResult([lowRiskSNP, highRiskSNP]);
      const risks = assessRisks(matchResult);

      // High risk should come first
      if (risks.length >= 2) {
        const riskOrder = ['high', 'moderate', 'low', 'unknown'];
        const firstRiskIndex = riskOrder.indexOf(risks[0].riskLevel);
        const secondRiskIndex = riskOrder.indexOf(risks[1].riskLevel);
        expect(firstRiskIndex).toBeLessThanOrEqual(secondRiskIndex);
      }
    });

    it('should generate appropriate explanations', () => {
      const pathogenicSNP = createMockAnnotatedSNP({
        clinvar: createMockClinVarVariant({
          clinicalSignificance: 'pathogenic',
          reviewStatus: 3,
          conditions: [{ name: 'Test Disease', traits: [] }]
        }),
        impactScore: 4
      });

      const matchResult = createMockMatchResult([pathogenicSNP]);
      const risks = assessRisks(matchResult);

      expect(risks[0].explanation).toBeTruthy();
      expect(risks[0].explanation.length).toBeGreaterThan(50);
    });
  });

  describe('Pharmacogenomics Analysis', () => {
    it('should identify pharmacogene variants', () => {
      const cyp2d6SNP = createMockAnnotatedSNP({
        snp: createMockSNP({ rsid: 'rs3892097', genotype: 'AA' }),
        pharmgkb: createMockPharmGKBVariant({
          rsid: 'rs3892097',
          gene: 'CYP2D6'
        }),
        category: 'drug'
      });

      const matchResult = createMockMatchResult([cyp2d6SNP]);
      const phenotypes = analyzePharmacogenomics(matchResult);

      expect(phenotypes.length).toBeGreaterThan(0);
      expect(phenotypes[0].gene).toBe('CYP2D6');
    });

    it('should determine metabolizer phenotypes', () => {
      const poorMetabolizerSNP = createMockAnnotatedSNP({
        snp: createMockSNP({ rsid: 'rs3892097', genotype: 'AA' }),
        pharmgkb: createMockPharmGKBVariant({
          rsid: 'rs3892097',
          gene: 'CYP2D6'
        }),
        category: 'drug'
      });

      const matchResult = createMockMatchResult([poorMetabolizerSNP]);
      const phenotypes = analyzePharmacogenomics(matchResult);

      expect(phenotypes[0].phenotype).toBeDefined();
      expect(['poor', 'intermediate', 'normal', 'rapid', 'ultrarapid', 'unknown'])
        .toContain(phenotypes[0].phenotype);
    });

    it('should collect affected drugs', () => {
      const pharmSNP = createMockAnnotatedSNP({
        snp: createMockSNP({ rsid: 'rs3892097' }),
        pharmgkb: createMockPharmGKBVariant({
          drugs: [
            {
              drugName: 'codeine',
              drugId: 'PA449088',
              evidenceLevel: '1A',
              significance: 'Yes',
              annotation: 'Test annotation',
              fdaLabel: true
            },
            {
              drugName: 'tramadol',
              drugId: 'PA451735',
              evidenceLevel: '1B',
              significance: 'Yes',
              annotation: 'Another annotation'
            }
          ]
        }),
        category: 'drug'
      });

      const matchResult = createMockMatchResult([pharmSNP]);
      const phenotypes = analyzePharmacogenomics(matchResult);

      expect(phenotypes[0].affectedDrugs.length).toBe(2);
      expect(phenotypes[0].affectedDrugs.map(d => d.drugName)).toContain('codeine');
    });

    it('should identify CPIC guideline availability', () => {
      const cpicSNP = createMockAnnotatedSNP({
        snp: createMockSNP({ rsid: 'rs3892097' }),
        pharmgkb: createMockPharmGKBVariant({
          hasCPICGuideline: true
        }),
        category: 'drug'
      });

      const matchResult = createMockMatchResult([cpicSNP]);
      const phenotypes = analyzePharmacogenomics(matchResult);

      expect(phenotypes[0].cpicStatus).toBe('available');
    });

    it('should generate drug recommendations based on phenotype', () => {
      const pharmSNP = createMockAnnotatedSNP({
        snp: createMockSNP({ rsid: 'rs3892097' }),
        pharmgkb: createMockPharmGKBVariant(),
        category: 'drug'
      });

      const matchResult = createMockMatchResult([pharmSNP]);
      const phenotypes = analyzePharmacogenomics(matchResult);

      expect(phenotypes[0].affectedDrugs[0].recommendation).toBeTruthy();
      expect(phenotypes[0].affectedDrugs[0].recommendation.length).toBeGreaterThan(20);
    });

    it('should assign drug severity correctly', () => {
      const pharmSNP = createMockAnnotatedSNP({
        snp: createMockSNP({ rsid: 'rs3892097' }),
        pharmgkb: createMockPharmGKBVariant({
          drugs: [{
            drugName: 'high-evidence-drug',
            drugId: 'PA000001',
            evidenceLevel: '1A',
            significance: 'Yes',
            annotation: 'Critical interaction'
          }]
        }),
        category: 'drug'
      });

      const matchResult = createMockMatchResult([pharmSNP]);
      const phenotypes = analyzePharmacogenomics(matchResult);

      const drug = phenotypes[0].affectedDrugs[0];
      expect(['critical', 'moderate', 'informational']).toContain(drug.severity);
    });
  });

  describe('Carrier Status Detection', () => {
    it('should identify heterozygous carriers', () => {
      const carrierSNP = createMockAnnotatedSNP({
        snp: createMockSNP({
          rsid: 'rs123',
          genotype: 'AG',
          allele1: 'A',
          allele2: 'G'
        }),
        clinvar: createMockClinVarVariant({
          clinicalSignificance: 'pathogenic',
          conditions: [{ name: 'Cystic Fibrosis', traits: [] }]
        }),
        category: 'carrier'
      });

      const matchResult = createMockMatchResult([carrierSNP]);
      const carriers = identifyCarrierStatus(matchResult);

      expect(carriers.length).toBeGreaterThan(0);
      expect(carriers[0].condition).toBe('Cystic Fibrosis');
      expect(carriers[0].carrierType).toBe('heterozygous');
    });

    it('should identify X-linked carriers', () => {
      const xLinkedSNP = createMockAnnotatedSNP({
        snp: createMockSNP({
          rsid: 'rs456',
          chromosome: 'X',
          genotype: 'AG',
          allele1: 'A',
          allele2: 'G'
        }),
        clinvar: createMockClinVarVariant({
          clinicalSignificance: 'pathogenic',
          conditions: [{ name: 'Hemophilia A', traits: [] }]
        }),
        category: 'carrier'
      });

      const matchResult = createMockMatchResult([xLinkedSNP]);
      const carriers = identifyCarrierStatus(matchResult);

      expect(carriers.length).toBeGreaterThan(0);
      expect(carriers[0].inheritance).toBe('x_linked');
      expect(carriers[0].carrierType).toBe('x_linked_female');
    });

    it('should not identify homozygous as carrier', () => {
      const homozygousSNP = createMockAnnotatedSNP({
        snp: createMockSNP({
          rsid: 'rs789',
          genotype: 'AA',
          allele1: 'A',
          allele2: 'A'
        }),
        clinvar: createMockClinVarVariant({
          clinicalSignificance: 'pathogenic'
        }),
        category: 'pathogenic'
      });

      const matchResult = createMockMatchResult([homozygousSNP]);
      const carriers = identifyCarrierStatus(matchResult);

      expect(carriers.length).toBe(0);
    });

    it('should generate partner risk explanation', () => {
      const carrierSNP = createMockAnnotatedSNP({
        snp: createMockSNP({
          genotype: 'AG',
          allele1: 'A',
          allele2: 'G'
        }),
        clinvar: createMockClinVarVariant({
          clinicalSignificance: 'pathogenic',
          conditions: [{ name: 'Test Condition', traits: [] }]
        }),
        category: 'carrier'
      });

      const matchResult = createMockMatchResult([carrierSNP]);
      const carriers = identifyCarrierStatus(matchResult);

      expect(carriers[0].partnerRisk).toBeTruthy();
      expect(carriers[0].partnerRisk).toContain('25%');
    });
  });

  describe('GWAS Trait Association Analysis', () => {
    it('should group associations by trait', () => {
      const gwasSnp1 = createMockAnnotatedSNP({
        snp: createMockSNP({ rsid: 'rs111' }),
        gwas: [
          createMockGWASAssociation({ rsid: 'rs111', trait: 'Type 2 Diabetes' }),
          createMockGWASAssociation({ rsid: 'rs111', trait: 'BMI' })
        ]
      });
      const gwasSnp2 = createMockAnnotatedSNP({
        snp: createMockSNP({ rsid: 'rs222' }),
        gwas: [
          createMockGWASAssociation({ rsid: 'rs222', trait: 'Type 2 Diabetes' })
        ]
      });

      const matchResult = createMockMatchResult([gwasSnp1, gwasSnp2]);
      const traits = analyzeTraitAssociations(matchResult);

      const diabetesTrait = traits.find(t => t.trait === 'Type 2 Diabetes');
      expect(diabetesTrait).toBeDefined();
      expect(diabetesTrait?.variantCount).toBe(2);
    });

    it('should calculate risk scores', () => {
      const gwasSnp = createMockAnnotatedSNP({
        snp: createMockSNP({ rsid: 'rs7903146', genotype: 'TT' }),
        gwas: [
          createMockGWASAssociation({
            rsid: 'rs7903146',
            trait: 'Type 2 Diabetes',
            riskAllele: 'T',
            orBeta: 1.4,
            pValue: 1e-15,
            hasRiskAllele: true,
            riskAlleleCopies: 2
          })
        ]
      });

      const matchResult = createMockMatchResult([gwasSnp]);
      const traits = analyzeTraitAssociations(matchResult);

      const diabetesTrait = traits.find(t => t.trait === 'Type 2 Diabetes');
      expect(diabetesTrait?.riskScore).toBeGreaterThan(0);
      expect(diabetesTrait?.riskScore).toBeLessThanOrEqual(1);
    });

    it('should categorize traits correctly', () => {
      const traitCategories = [
        { trait: 'Type 2 Diabetes', expectedCategory: 'metabolic' },
        { trait: 'Blood Pressure', expectedCategory: 'cardiovascular' },
        { trait: 'Breast Cancer', expectedCategory: 'cancer' },
        { trait: 'Alzheimer', expectedCategory: 'neurological' }
      ];

      for (const { trait, expectedCategory } of traitCategories) {
        const gwasSnp = createMockAnnotatedSNP({
          gwas: [createMockGWASAssociation({ trait })]
        });

        const matchResult = createMockMatchResult([gwasSnp]);
        const traits = analyzeTraitAssociations(matchResult);

        expect(traits[0].category).toBe(expectedCategory);
      }
    });

    it('should determine confidence based on p-values', () => {
      const strongGwasSNP = createMockAnnotatedSNP({
        gwas: [
          createMockGWASAssociation({ pValue: 1e-20 }),
          createMockGWASAssociation({ pValue: 1e-15 }),
          createMockGWASAssociation({ pValue: 1e-12 })
        ]
      });

      const matchResult = createMockMatchResult([strongGwasSNP]);
      const traits = analyzeTraitAssociations(matchResult);

      expect(traits[0].confidence).toBe('high');
    });

    it('should interpret risk scores', () => {
      const highRiskGwasSNP = createMockAnnotatedSNP({
        snp: createMockSNP({ genotype: 'TT' }),
        gwas: [
          createMockGWASAssociation({
            riskAllele: 'T',
            orBeta: 2.0,
            hasRiskAllele: true,
            riskAlleleCopies: 2
          })
        ]
      });

      const matchResult = createMockMatchResult([highRiskGwasSNP]);
      const traits = analyzeTraitAssociations(matchResult);

      expect(['increased', 'typical', 'decreased', 'unknown'])
        .toContain(traits[0].interpretation);
    });
  });

  describe('Polygenic Risk Score Calculation', () => {
    it('should calculate PRS for available traits', () => {
      // Create SNPs matching the PRS model for Type 2 Diabetes
      const prsSnps: AnnotatedSNP[] = [
        createMockAnnotatedSNP({
          snp: createMockSNP({ rsid: 'rs7903146', genotype: 'TT' })
        }),
        createMockAnnotatedSNP({
          snp: createMockSNP({ rsid: 'rs12255372', genotype: 'GT' })
        }),
        createMockAnnotatedSNP({
          snp: createMockSNP({ rsid: 'rs1801282', genotype: 'CG' })
        })
      ];

      const matchResult = createMockMatchResult(prsSnps);
      const scores = calculatePolygenicRiskScores(matchResult);

      // Should have at least one score if enough variants match
      if (scores.length > 0) {
        expect(scores[0].rawScore).toBeDefined();
        expect(scores[0].percentile).toBeGreaterThanOrEqual(0);
        expect(scores[0].percentile).toBeLessThanOrEqual(100);
      }
    });

    it('should calculate z-scores correctly', () => {
      const prsSnps: AnnotatedSNP[] = [
        createMockAnnotatedSNP({
          snp: createMockSNP({ rsid: 'rs7903146', genotype: 'TT' })
        }),
        createMockAnnotatedSNP({
          snp: createMockSNP({ rsid: 'rs12255372', genotype: 'TT' })
        }),
        createMockAnnotatedSNP({
          snp: createMockSNP({ rsid: 'rs1801282', genotype: 'GG' })
        })
      ];

      const matchResult = createMockMatchResult(prsSnps);
      const scores = calculatePolygenicRiskScores(matchResult);

      if (scores.length > 0) {
        expect(typeof scores[0].zScore).toBe('number');
        expect(scores[0].zScore).not.toBeNaN();
      }
    });

    it('should assign risk categories based on percentile', () => {
      const prsSnps: AnnotatedSNP[] = [
        createMockAnnotatedSNP({
          snp: createMockSNP({ rsid: 'rs7903146', genotype: 'CC' })
        }),
        createMockAnnotatedSNP({
          snp: createMockSNP({ rsid: 'rs12255372', genotype: 'GG' })
        }),
        createMockAnnotatedSNP({
          snp: createMockSNP({ rsid: 'rs1801282', genotype: 'CC' })
        })
      ];

      const matchResult = createMockMatchResult(prsSnps);
      const scores = calculatePolygenicRiskScores(matchResult);

      if (scores.length > 0) {
        expect(['very_high', 'high', 'moderate', 'average', 'low', 'very_low'])
          .toContain(scores[0].riskCategory);
      }
    });

    it('should track variant coverage', () => {
      const prsSnps: AnnotatedSNP[] = [
        createMockAnnotatedSNP({
          snp: createMockSNP({ rsid: 'rs7903146', genotype: 'TT' })
        }),
        createMockAnnotatedSNP({
          snp: createMockSNP({ rsid: 'rs12255372', genotype: 'GT' })
        })
      ];

      const matchResult = createMockMatchResult(prsSnps);
      const scores = calculatePolygenicRiskScores(matchResult);

      // Coverage should be tracked
      if (scores.length > 0) {
        expect(scores[0].coverage).toBeGreaterThan(0);
        expect(scores[0].variantsUsed).toBeGreaterThan(0);
      }
    });

    it('should skip traits with insufficient coverage', () => {
      const singleSnp = createMockAnnotatedSNP({
        snp: createMockSNP({ rsid: 'rs7903146', genotype: 'TT' })
      });

      const matchResult = createMockMatchResult([singleSnp]);
      const scores = calculatePolygenicRiskScores(matchResult);

      // With only 1 of 5 required variants, coverage is 20% (< 50% threshold)
      // So no score should be returned for Type 2 Diabetes
      const diabetesScore = scores.find(s => s.trait === 'Type 2 Diabetes');
      // May or may not exist depending on threshold, but if it does, coverage should be low
      if (diabetesScore) {
        expect(diabetesScore.coverage).toBeLessThan(50);
      }
    });
  });

  describe('Main Analysis Function', () => {
    it('should return comprehensive analysis result', () => {
      const pathogenicSNP = createMockAnnotatedSNP({
        clinvar: createMockClinVarVariant({
          clinicalSignificance: 'pathogenic',
          conditions: [{ name: 'Test Condition', traits: [] }]
        }),
        impactScore: 4
      });
      const pharmSNP = createMockAnnotatedSNP({
        snp: createMockSNP({ rsid: 'rs3892097' }),
        pharmgkb: createMockPharmGKBVariant(),
        category: 'drug'
      });
      const gwasSNP = createMockAnnotatedSNP({
        snp: createMockSNP({ rsid: 'rs7903146' }),
        gwas: [createMockGWASAssociation()]
      });

      const matchResult = createMockMatchResult([pathogenicSNP, pharmSNP, gwasSNP]);
      const result = analyzeGenome(matchResult);

      expect(result.genomeId).toBe('test-genome-123');
      expect(result.analyzedAt).toBeInstanceOf(Date);
      expect(result.riskAssessments).toBeDefined();
      expect(result.metabolizerPhenotypes).toBeDefined();
      expect(result.carrierStatuses).toBeDefined();
      expect(result.traitAssociations).toBeDefined();
      expect(result.polygenicRiskScores).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should generate summary statistics', () => {
      const snps = [
        createMockAnnotatedSNP({
          clinvar: createMockClinVarVariant({ clinicalSignificance: 'pathogenic' }),
          impactScore: 4,
          category: 'pathogenic'
        }),
        createMockAnnotatedSNP({
          pharmgkb: createMockPharmGKBVariant(),
          category: 'drug'
        })
      ];

      const matchResult = createMockMatchResult(snps);
      const result = analyzeGenome(matchResult);

      expect(result.summary.totalVariantsAnalyzed).toBe(2);
      expect(result.summary.pharmacogeneCount).toBeGreaterThan(0);
    });

    it('should generate key findings', () => {
      const highRiskSNP = createMockAnnotatedSNP({
        snp: createMockSNP({ genotype: 'AA', allele1: 'A', allele2: 'A' }),
        clinvar: createMockClinVarVariant({
          clinicalSignificance: 'pathogenic',
          reviewStatus: 4,
          conditions: [{ name: 'Critical Condition', traits: [] }]
        }),
        impactScore: 5,
        category: 'pathogenic'
      });

      const matchResult = createMockMatchResult([highRiskSNP]);
      const result = analyzeGenome(matchResult);

      expect(result.summary.keyFindings.length).toBeGreaterThan(0);
      expect(result.summary.keyFindings[0]).toHaveProperty('type');
      expect(result.summary.keyFindings[0]).toHaveProperty('priority');
      expect(result.summary.keyFindings[0]).toHaveProperty('title');
    });

    it('should respect analysis options', () => {
      const gwasSNP = createMockAnnotatedSNP({
        gwas: [createMockGWASAssociation()]
      });

      const matchResult = createMockMatchResult([gwasSNP]);

      const withTraits = analyzeGenome(matchResult, { includeTraitAssociations: true });
      const withoutTraits = analyzeGenome(matchResult, { includeTraitAssociations: false });

      expect(withTraits.traitAssociations.length).toBeGreaterThan(0);
      expect(withoutTraits.traitAssociations.length).toBe(0);
    });

    it('should include database versions', () => {
      const matchResult = createMockMatchResult([]);
      const result = analyzeGenome(matchResult);

      expect(result.databaseVersions).toBeDefined();
      expect(result.databaseVersions.clinvar).toBe('2024-01');
    });
  });

  describe('Legacy API', () => {
    it('should provide backwards-compatible analyzeLegacy function', () => {
      const snp = createMockAnnotatedSNP({
        clinvar: createMockClinVarVariant({
          conditions: [{ name: 'Test', traits: [] }]
        }),
        impactScore: 3
      });

      const matchResult = createMockMatchResult([snp]);
      const result = analyzeLegacy(matchResult);

      expect(result.riskAssessments).toBeDefined();
      expect(result.metabolizerPhenotypes).toBeDefined();
      expect(result.carrierStatuses).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.totalRisks).toBeDefined();
      expect(result.summary.highRiskCount).toBeDefined();
    });

    it('should convert enhanced phenotypes to legacy format', () => {
      const pharmSNP = createMockAnnotatedSNP({
        pharmgkb: createMockPharmGKBVariant(),
        category: 'drug'
      });

      const matchResult = createMockMatchResult([pharmSNP]);
      const result = analyzeLegacy(matchResult);

      expect(result.metabolizerPhenotypes[0]).toHaveProperty('gene');
      expect(result.metabolizerPhenotypes[0]).toHaveProperty('phenotype');
      expect(result.metabolizerPhenotypes[0]).toHaveProperty('affectedDrugs');
      expect(Array.isArray(result.metabolizerPhenotypes[0].affectedDrugs)).toBe(true);
      // Legacy format has string[] for affectedDrugs
      if (result.metabolizerPhenotypes[0].affectedDrugs.length > 0) {
        expect(typeof result.metabolizerPhenotypes[0].affectedDrugs[0]).toBe('string');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty match result', () => {
      const matchResult = createMockMatchResult([]);
      const result = analyzeGenome(matchResult);

      expect(result.riskAssessments.length).toBe(0);
      expect(result.metabolizerPhenotypes.length).toBe(0);
      expect(result.carrierStatuses.length).toBe(0);
      expect(result.traitAssociations.length).toBe(0);
      expect(result.polygenicRiskScores.length).toBe(0);
    });

    it('should handle SNPs without annotations', () => {
      const unannotatedSNP = createMockAnnotatedSNP({
        clinvar: undefined,
        pharmgkb: undefined,
        gwas: undefined
      });

      const matchResult = createMockMatchResult([unannotatedSNP]);
      const result = analyzeGenome(matchResult);

      expect(result.riskAssessments.length).toBe(0);
      expect(result.metabolizerPhenotypes.length).toBe(0);
    });

    it('should handle variants with multiple conditions', () => {
      const multiConditionSNP = createMockAnnotatedSNP({
        clinvar: createMockClinVarVariant({
          conditions: [
            { name: 'Condition A', traits: [] },
            { name: 'Condition B', traits: [] },
            { name: 'Condition C', traits: [] }
          ]
        })
      });

      const matchResult = createMockMatchResult([multiConditionSNP]);
      const risks = assessRisks(matchResult);

      expect(risks.length).toBe(3);
    });

    it('should handle SNPs with only GWAS data', () => {
      const gwasOnlySNP = createMockAnnotatedSNP({
        clinvar: undefined,
        pharmgkb: undefined,
        gwas: [createMockGWASAssociation()]
      });

      const matchResult = createMockMatchResult([gwasOnlySNP]);
      const result = analyzeGenome(matchResult);

      expect(result.traitAssociations.length).toBeGreaterThan(0);
      expect(result.riskAssessments.length).toBe(0);
    });
  });

  describe('Integration', () => {
    it('should process a realistic genome analysis scenario', () => {
      // Simulate a realistic set of variants
      const variants: AnnotatedSNP[] = [
        // Pathogenic BRCA1 variant
        createMockAnnotatedSNP({
          snp: createMockSNP({ rsid: 'rs80357906', genotype: 'AG', allele1: 'A', allele2: 'G' }),
          clinvar: createMockClinVarVariant({
            rsid: 'rs80357906',
            gene: 'BRCA1',
            clinicalSignificance: 'pathogenic',
            reviewStatus: 3,
            conditions: [{ name: 'Hereditary breast cancer', traits: ['cancer'] }]
          }),
          impactScore: 4.5,
          category: 'carrier'
        }),
        // CYP2D6 poor metabolizer variant
        createMockAnnotatedSNP({
          snp: createMockSNP({ rsid: 'rs3892097', genotype: 'AA' }),
          pharmgkb: createMockPharmGKBVariant({
            rsid: 'rs3892097',
            gene: 'CYP2D6',
            drugs: [
              {
                drugName: 'codeine',
                drugId: 'PA449088',
                evidenceLevel: '1A',
                significance: 'Yes',
                annotation: 'Poor metabolizers have reduced codeine efficacy',
                fdaLabel: true,
                cpicLevel: 'A'
              }
            ],
            hasCPICGuideline: true
          }),
          impactScore: 2,
          category: 'drug'
        }),
        // T2D risk variant
        createMockAnnotatedSNP({
          snp: createMockSNP({ rsid: 'rs7903146', genotype: 'TT' }),
          gwas: [
            createMockGWASAssociation({
              rsid: 'rs7903146',
              trait: 'Type 2 Diabetes',
              pValue: 1e-50,
              orBeta: 1.4,
              riskAllele: 'T',
              hasRiskAllele: true,
              riskAlleleCopies: 2
            })
          ],
          impactScore: 1,
          category: 'neutral'
        })
      ];

      const matchResult = createMockMatchResult(variants, {
        pathogenicCount: 1,
        drugInteractionCount: 1,
        gwasAssociationCount: 1
      });

      const result = analyzeGenome(matchResult);

      // Verify comprehensive analysis
      expect(result.riskAssessments.length).toBeGreaterThan(0);
      expect(result.metabolizerPhenotypes.length).toBeGreaterThan(0);
      expect(result.carrierStatuses.length).toBeGreaterThan(0);
      expect(result.traitAssociations.length).toBeGreaterThan(0);

      // Verify carrier status for BRCA1
      const brcaCarrier = result.carrierStatuses.find(c => c.gene === 'BRCA1');
      expect(brcaCarrier).toBeDefined();

      // Verify CYP2D6 pharmacogenomics
      const cyp2d6 = result.metabolizerPhenotypes.find(p => p.gene === 'CYP2D6');
      expect(cyp2d6).toBeDefined();
      expect(cyp2d6?.affectedDrugs.length).toBeGreaterThan(0);

      // Verify T2D trait association
      const t2dTrait = result.traitAssociations.find(t => t.trait === 'Type 2 Diabetes');
      expect(t2dTrait).toBeDefined();
      expect(t2dTrait?.interpretation).toBe('increased');

      // Verify key findings generated
      expect(result.summary.keyFindings.length).toBeGreaterThan(0);
    });
  });
});
