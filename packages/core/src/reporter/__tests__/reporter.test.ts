/**
 * Tests for the report generator module
 * @packageDocumentation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ReportGenerator,
  generateReport,
  generateExhaustiveReport,
  generateDiseaseRiskReport,
  generatePharmacogenomicsReport,
  generateHealthProtocolReport,
  reportToText,
  reportToJSON
} from '../index';
import type {
  MatchResult,
  AnnotatedSNP,
  EnhancedAnalysisResult,
  RiskAssessment,
  EnhancedMetabolizerPhenotype,
  EnhancedCarrierStatus,
  TraitAssociation,
  PolygenicRiskScore,
  Report
} from '@genomeforge/types';

// ============================================================================
// Test Data Factories
// ============================================================================

function createMockMatchResult(): MatchResult {
  return {
    genomeId: 'test-genome-123',
    totalSNPs: 700000,
    matchedSNPs: 150,
    pathogenicCount: 5,
    drugInteractionCount: 10,
    carrierCount: 3,
    gwasAssociationCount: 50,
    annotatedSNPs: createMockAnnotatedSNPs(),
    summary: {
      highImpact: ['BRCA1: Breast Cancer'],
      moderateImpact: ['TP53', 'MLH1'],
      pharmacogenes: ['CYP2D6', 'CYP2C19'],
      carrierStatuses: ['CFTR (Cystic Fibrosis)'],
      gwasTraits: ['Type 2 Diabetes', 'Coronary Artery Disease']
    },
    buildVersion: 'GRCh38',
    databaseVersions: {
      clinvar: '2024-01',
      pharmgkb: '2024-01',
      gwas: '2024-01'
    }
  };
}

function createMockAnnotatedSNPs(): AnnotatedSNP[] {
  return [
    {
      snp: {
        rsid: 'rs80357906',
        chromosome: '17',
        position: 41245466,
        genotype: 'AG',
        allele1: 'A',
        allele2: 'G'
      },
      clinvar: {
        rsid: 'rs80357906',
        vcv: 'VCV000123456',
        gene: 'BRCA1',
        geneId: 672,
        clinicalSignificance: 'pathogenic',
        reviewStatus: 4,
        conditions: [{ name: 'Hereditary breast cancer', traits: ['cancer'] }]
      },
      impactScore: 4.5,
      category: 'pathogenic'
    },
    {
      snp: {
        rsid: 'rs3892097',
        chromosome: '22',
        position: 42523943,
        genotype: 'AA',
        allele1: 'A',
        allele2: 'A'
      },
      pharmgkb: {
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
        hasCPICGuideline: true,
        hasDPWGGuideline: true
      },
      impactScore: 3,
      category: 'drug'
    }
  ];
}

function createMockAnalysisResult(): EnhancedAnalysisResult {
  return {
    genomeId: 'test-genome-123',
    analyzedAt: new Date('2024-01-15T10:00:00Z'),
    riskAssessments: createMockRiskAssessments(),
    metabolizerPhenotypes: createMockMetabolizerPhenotypes(),
    carrierStatuses: createMockCarrierStatuses(),
    traitAssociations: createMockTraitAssociations(),
    polygenicRiskScores: createMockPolygenicRiskScores(),
    summary: {
      totalVariantsAnalyzed: 150,
      pathogenicCount: 5,
      highRiskCount: 2,
      moderateRiskCount: 3,
      pharmacogeneCount: 2,
      carrierCount: 1,
      traitAssociationCount: 5,
      prsCount: 2,
      keyFindings: [
        {
          type: 'pathogenic',
          priority: 'urgent',
          title: 'Pathogenic BRCA1 variant',
          description: 'High-risk finding for breast cancer',
          relatedItem: 'BRCA1'
        },
        {
          type: 'drug',
          priority: 'urgent',
          title: 'CYP2D6 drug interaction',
          description: 'Poor metabolizer affects codeine response',
          relatedItem: 'CYP2D6'
        }
      ]
    },
    databaseVersions: {
      clinvar: '2024-01',
      pharmgkb: '2024-01',
      gwas: '2024-01'
    }
  };
}

function createMockRiskAssessments(): RiskAssessment[] {
  return [
    {
      condition: 'Hereditary breast cancer',
      gene: 'BRCA1',
      riskLevel: 'high',
      confidence: 1.0,
      variants: createMockAnnotatedSNPs().filter(s => s.clinvar?.gene === 'BRCA1'),
      explanation: 'Pathogenic variant identified in BRCA1.',
      inheritance: 'autosomal_dominant'
    },
    {
      condition: 'Lynch syndrome',
      gene: 'MLH1',
      riskLevel: 'moderate',
      confidence: 0.75,
      variants: [],
      explanation: 'Likely pathogenic variant in MLH1.',
      inheritance: 'autosomal_dominant'
    }
  ];
}

function createMockMetabolizerPhenotypes(): EnhancedMetabolizerPhenotype[] {
  return [
    {
      gene: 'CYP2D6',
      diplotype: '*4/*4',
      phenotype: 'poor',
      activityScore: 0,
      affectedDrugs: [
        {
          drugName: 'codeine',
          genericName: 'codeine',
          recommendation: 'Consider alternative pain medication.',
          severity: 'critical',
          evidenceLevel: '1A',
          hasFDALabel: true,
          cpicLevel: 'A',
          therapeuticCategory: 'pain'
        },
        {
          drugName: 'tramadol',
          genericName: 'tramadol',
          recommendation: 'May have reduced efficacy.',
          severity: 'moderate',
          evidenceLevel: '1B',
          hasFDALabel: true
        }
      ],
      cpicStatus: 'available',
      contributingVariants: ['rs3892097']
    },
    {
      gene: 'CYP2C19',
      diplotype: '*1/*2',
      phenotype: 'intermediate',
      activityScore: 1,
      affectedDrugs: [
        {
          drugName: 'clopidogrel',
          genericName: 'clopidogrel',
          recommendation: 'Standard dosing with monitoring.',
          severity: 'moderate',
          evidenceLevel: '1A',
          hasFDALabel: true
        }
      ],
      cpicStatus: 'available',
      contributingVariants: ['rs4244285']
    }
  ];
}

function createMockCarrierStatuses(): EnhancedCarrierStatus[] {
  return [
    {
      gene: 'CFTR',
      condition: 'Cystic Fibrosis',
      inheritance: 'autosomal_recessive',
      carrierType: 'heterozygous',
      partnerRisk: 'If partner is also a carrier, 25% chance of affected child.',
      variantAccession: 'VCV000007105'
    }
  ];
}

function createMockTraitAssociations(): TraitAssociation[] {
  return [
    {
      trait: 'Type 2 Diabetes',
      category: 'metabolic',
      variantCount: 5,
      associations: [
        {
          rsid: 'rs7903146',
          trait: 'Type 2 Diabetes',
          pValue: 1e-50,
          orBeta: 1.4,
          riskAllele: 'T',
          studyAccession: 'GCST001234',
          hasRiskAllele: true,
          riskAlleleCopies: 2
        }
      ],
      riskScore: 0.72,
      interpretation: 'increased',
      confidence: 'high'
    },
    {
      trait: 'Coronary Artery Disease',
      category: 'cardiovascular',
      variantCount: 3,
      associations: [],
      riskScore: 0.55,
      interpretation: 'typical',
      confidence: 'moderate'
    }
  ];
}

function createMockPolygenicRiskScores(): PolygenicRiskScore[] {
  return [
    {
      trait: 'Type 2 Diabetes',
      rawScore: 1.8,
      zScore: 1.5,
      percentile: 93,
      riskCategory: 'high',
      variantsUsed: 4,
      variantsMissing: 1,
      coverage: 80,
      relativeRisk: 1.6
    },
    {
      trait: 'Coronary Artery Disease',
      rawScore: 1.1,
      zScore: 0.3,
      percentile: 62,
      riskCategory: 'moderate',
      variantsUsed: 3,
      variantsMissing: 1,
      coverage: 75,
      relativeRisk: 1.1
    }
  ];
}

function createReportGeneratorInput() {
  return {
    analysisResult: createMockAnalysisResult(),
    matchResult: createMockMatchResult()
  };
}

// ============================================================================
// Test Suites
// ============================================================================

describe('Report Generator', () => {
  describe('ReportGenerator Class', () => {
    it('should create a report generator instance', () => {
      const input = createReportGeneratorInput();
      const generator = new ReportGenerator(input, { type: 'exhaustive_genetic' });
      expect(generator).toBeDefined();
    });

    it('should generate a report with basic structure', () => {
      const input = createReportGeneratorInput();
      const generator = new ReportGenerator(input, { type: 'exhaustive_genetic' });
      const report = generator.generate();

      expect(report).toBeDefined();
      expect(report.id).toBeTruthy();
      expect(report.type).toBe('exhaustive_genetic');
      expect(report.title).toBeTruthy();
      expect(report.generatedAt).toBeInstanceOf(Date);
      expect(report.genomeId).toBe('test-genome-123');
      expect(report.sections.length).toBeGreaterThan(0);
      expect(report.metadata).toBeDefined();
    });

    it('should use custom filename when provided', () => {
      const input = createReportGeneratorInput();
      const generator = new ReportGenerator(input, {
        type: 'exhaustive_genetic',
        filename: 'my_custom_report'
      });
      const report = generator.generate();

      expect(report).toBeDefined();
    });

    it('should respect maxVariantsPerSection option', () => {
      const input = createReportGeneratorInput();
      const generator = new ReportGenerator(input, {
        type: 'exhaustive_genetic',
        maxVariantsPerSection: 10
      });
      const report = generator.generate();

      // Check that variant lists are limited
      for (const section of report.sections) {
        if (section.type === 'variant_list') {
          const content = section.content as { variants: unknown[] };
          expect(content.variants.length).toBeLessThanOrEqual(10);
        }
      }
    });

    it('should exclude technical section when includeTechnical is false', () => {
      const input = createReportGeneratorInput();
      const generator = new ReportGenerator(input, {
        type: 'exhaustive_genetic',
        includeTechnical: false
      });
      const report = generator.generate();

      const technicalSection = report.sections.find(s => s.type === 'technical');
      expect(technicalSection).toBeUndefined();
    });
  });

  describe('Report Types', () => {
    describe('Exhaustive Genetic Report', () => {
      it('should generate comprehensive sections', () => {
        const report = generateExhaustiveReport(createReportGeneratorInput());

        expect(report.type).toBe('exhaustive_genetic');
        expect(report.title).toContain('Comprehensive');

        // Should have summary
        const summary = report.sections.find(s => s.type === 'summary');
        expect(summary).toBeDefined();

        // Should have risk table if there are risk assessments
        const riskTable = report.sections.find(s => s.type === 'risk_table');
        expect(riskTable).toBeDefined();

        // Should have drug interactions if there are pharmacogenes
        const drugSection = report.sections.find(s => s.type === 'drug_interactions');
        expect(drugSection).toBeDefined();
      });

      it('should include trait associations and PRS', () => {
        const report = generateExhaustiveReport(createReportGeneratorInput());

        // Find sections related to GWAS/PRS
        const riskTables = report.sections.filter(s => s.type === 'risk_table');

        // Should have multiple risk tables (conditions, carriers, traits, PRS)
        expect(riskTables.length).toBeGreaterThan(1);
      });
    });

    describe('Disease Risk Report', () => {
      it('should focus on disease-related findings', () => {
        const report = generateDiseaseRiskReport(createReportGeneratorInput());

        expect(report.type).toBe('disease_risk');
        expect(report.title).toContain('Disease Risk');

        // Should have summary
        const summary = report.sections.find(s => s.type === 'summary');
        expect(summary).toBeDefined();
      });

      it('should include high-risk findings prominently', () => {
        const report = generateDiseaseRiskReport(createReportGeneratorInput());

        // Should have risk assessment section
        const riskSections = report.sections.filter(s => s.type === 'risk_table');
        expect(riskSections.length).toBeGreaterThan(0);
      });
    });

    describe('Pharmacogenomics Report', () => {
      it('should focus on drug interactions', () => {
        const report = generatePharmacogenomicsReport(createReportGeneratorInput());

        expect(report.type).toBe('pharmacogenomics');
        expect(report.title).toContain('Pharmacogenomics');

        // Should have drug interaction sections
        const drugSections = report.sections.filter(s => s.type === 'drug_interactions');
        expect(drugSections.length).toBeGreaterThan(0);
      });

      it('should include pharmacogene summary', () => {
        const report = generatePharmacogenomicsReport(createReportGeneratorInput());

        // Should have a summary table for pharmacogenes
        const riskTables = report.sections.filter(s => s.type === 'risk_table');
        const pharmacogeneSummary = riskTables.find(s =>
          s.title.toLowerCase().includes('pharmacogene')
        );
        expect(pharmacogeneSummary).toBeDefined();
      });

      it('should list drugs with severity levels', () => {
        const report = generatePharmacogenomicsReport(createReportGeneratorInput());

        const drugSection = report.sections.find(s => s.type === 'drug_interactions');
        expect(drugSection).toBeDefined();

        const content = drugSection!.content as {
          interactions: Array<{ severity: string }>
        };
        expect(content.interactions.length).toBeGreaterThan(0);

        for (const interaction of content.interactions) {
          expect(['high', 'moderate', 'low']).toContain(interaction.severity);
        }
      });
    });

    describe('Health Protocol Report', () => {
      it('should include recommendations', () => {
        const report = generateHealthProtocolReport(createReportGeneratorInput());

        expect(report.type).toBe('health_protocol');
        expect(report.title).toContain('Health Protocol');

        // Should have recommendations section
        const recommendations = report.sections.find(s => s.type === 'recommendations');
        expect(recommendations).toBeDefined();
      });

      it('should prioritize recommendations', () => {
        const report = generateHealthProtocolReport(createReportGeneratorInput());

        const recommendations = report.sections.find(s => s.type === 'recommendations');
        expect(recommendations).toBeDefined();

        const content = recommendations!.content as {
          items: Array<{ priority: string }>
        };

        for (const item of content.items) {
          expect(['high', 'medium', 'low']).toContain(item.priority);
        }
      });
    });
  });

  describe('Summary Section', () => {
    it('should include key highlights', () => {
      const report = generateExhaustiveReport(createReportGeneratorInput());

      const summary = report.sections.find(s => s.type === 'summary');
      expect(summary).toBeDefined();

      const content = summary!.content as { highlights: string[] };
      expect(content.highlights.length).toBeGreaterThan(0);
    });

    it('should include summary text with disclaimer', () => {
      const report = generateExhaustiveReport(createReportGeneratorInput());

      const summary = report.sections.find(s => s.type === 'summary');
      const content = summary!.content as { text: string };

      expect(content.text).toContain('Disclaimer');
    });
  });

  describe('Metadata', () => {
    it('should include SNP counts', () => {
      const report = generateExhaustiveReport(createReportGeneratorInput());

      expect(report.metadata.snpCount).toBe(700000);
      expect(report.metadata.matchedCount).toBe(150);
    });

    it('should include database versions', () => {
      const report = generateExhaustiveReport(createReportGeneratorInput());

      expect(report.metadata.databaseVersions.clinvar).toBe('2024-01');
      expect(report.metadata.databaseVersions.pharmgkb).toBe('2024-01');
    });

    it('should include build version', () => {
      const report = generateExhaustiveReport(createReportGeneratorInput());

      expect(report.metadata.buildVersion).toBe('GRCh38');
    });
  });

  describe('Technical Section', () => {
    it('should include technical details when enabled', () => {
      const report = generateReport(createReportGeneratorInput(), {
        type: 'exhaustive_genetic',
        includeTechnical: true
      });

      const technical = report.sections.find(s => s.type === 'technical');
      expect(technical).toBeDefined();

      const content = technical!.content as { details: Array<{ label: string; value: string }> };
      expect(content.details.length).toBeGreaterThan(0);

      // Should include standard technical fields
      const labels = content.details.map(d => d.label);
      expect(labels).toContain('Genome ID');
      expect(labels).toContain('Build Version');
      expect(labels).toContain('Total SNPs');
    });
  });

  describe('Section Ordering', () => {
    it('should have sections in logical order', () => {
      const report = generateExhaustiveReport(createReportGeneratorInput());

      // Summary should be first
      expect(report.sections[0].type).toBe('summary');

      // Technical should be last if present
      const lastSection = report.sections[report.sections.length - 1];
      if (lastSection.type === 'technical') {
        expect(lastSection.order).toBe(report.sections.length - 1);
      }

      // Orders should be sequential
      for (let i = 0; i < report.sections.length; i++) {
        expect(report.sections[i].order).toBe(i);
      }
    });
  });

  describe('Export Functions', () => {
    describe('reportToText', () => {
      it('should convert report to readable text', () => {
        const report = generateExhaustiveReport(createReportGeneratorInput());
        const text = reportToText(report);

        expect(text).toBeTruthy();
        expect(text).toContain(report.title);
        expect(text).toContain('Executive Summary');
      });

      it('should include markdown formatting', () => {
        const report = generateExhaustiveReport(createReportGeneratorInput());
        const text = reportToText(report);

        // Should have headers
        expect(text).toContain('#');
        // Should have table formatting
        expect(text).toContain('|');
      });

      it('should format risk tables correctly', () => {
        const report = generateExhaustiveReport(createReportGeneratorInput());
        const text = reportToText(report);

        // Should have table headers
        expect(text).toContain('| Condition | Gene |');
        // Should have star ratings
        expect(text).toMatch(/[★☆]/);
      });

      it('should format recommendations with priority indicators', () => {
        const report = generateHealthProtocolReport(createReportGeneratorInput());
        const text = reportToText(report);

        // Should have priority indicators
        expect(text).toMatch(/[🔴🟡🟢]/);
      });
    });

    describe('reportToJSON', () => {
      it('should convert report to valid JSON', () => {
        const report = generateExhaustiveReport(createReportGeneratorInput());
        const json = reportToJSON(report);

        expect(() => JSON.parse(json)).not.toThrow();
      });

      it('should preserve report structure', () => {
        const report = generateExhaustiveReport(createReportGeneratorInput());
        const json = reportToJSON(report);
        const parsed = JSON.parse(json);

        expect(parsed.id).toBe(report.id);
        expect(parsed.type).toBe(report.type);
        expect(parsed.title).toBe(report.title);
        expect(parsed.sections.length).toBe(report.sections.length);
      });

      it('should be properly formatted', () => {
        const report = generateExhaustiveReport(createReportGeneratorInput());
        const json = reportToJSON(report);

        // Should be formatted with indentation
        expect(json).toContain('\n');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty analysis results', () => {
      const input = {
        analysisResult: {
          genomeId: 'empty-genome',
          analyzedAt: new Date(),
          riskAssessments: [],
          metabolizerPhenotypes: [],
          carrierStatuses: [],
          traitAssociations: [],
          polygenicRiskScores: [],
          summary: {
            totalVariantsAnalyzed: 0,
            pathogenicCount: 0,
            highRiskCount: 0,
            moderateRiskCount: 0,
            pharmacogeneCount: 0,
            carrierCount: 0,
            traitAssociationCount: 0,
            prsCount: 0,
            keyFindings: []
          },
          databaseVersions: {
            clinvar: '2024-01',
            pharmgkb: '2024-01'
          }
        },
        matchResult: {
          genomeId: 'empty-genome',
          totalSNPs: 700000,
          matchedSNPs: 0,
          pathogenicCount: 0,
          drugInteractionCount: 0,
          carrierCount: 0,
          gwasAssociationCount: 0,
          annotatedSNPs: [],
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
            pharmgkb: '2024-01'
          }
        }
      };

      const report = generateExhaustiveReport(input);

      expect(report).toBeDefined();
      expect(report.sections.length).toBeGreaterThan(0); // Should still have summary
    });

    it('should handle missing optional fields', () => {
      const input = createReportGeneratorInput();
      // Remove optional fields
      input.analysisResult.databaseVersions = {} as any;

      const report = generateExhaustiveReport(input);

      expect(report).toBeDefined();
      expect(report.metadata.databaseVersions.clinvar).toBe('unknown');
    });

    it('should handle all report types', () => {
      const input = createReportGeneratorInput();
      const reportTypes = ['exhaustive_genetic', 'disease_risk', 'health_protocol', 'pharmacogenomics'] as const;

      for (const type of reportTypes) {
        const report = generateReport(input, { type });
        expect(report.type).toBe(type);
        expect(report.sections.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Convenience Functions', () => {
    it('generateReport should work with all options', () => {
      const input = createReportGeneratorInput();
      const report = generateReport(input, {
        type: 'exhaustive_genetic',
        filename: 'test_report',
        includeTechnical: true,
        maxVariantsPerSection: 25
      });

      expect(report).toBeDefined();
      expect(report.type).toBe('exhaustive_genetic');
    });

    it('generateExhaustiveReport should use exhaustive type', () => {
      const report = generateExhaustiveReport(createReportGeneratorInput());
      expect(report.type).toBe('exhaustive_genetic');
    });

    it('generateDiseaseRiskReport should use disease_risk type', () => {
      const report = generateDiseaseRiskReport(createReportGeneratorInput());
      expect(report.type).toBe('disease_risk');
    });

    it('generatePharmacogenomicsReport should use pharmacogenomics type', () => {
      const report = generatePharmacogenomicsReport(createReportGeneratorInput());
      expect(report.type).toBe('pharmacogenomics');
    });

    it('generateHealthProtocolReport should use health_protocol type', () => {
      const report = generateHealthProtocolReport(createReportGeneratorInput());
      expect(report.type).toBe('health_protocol');
    });
  });
});
