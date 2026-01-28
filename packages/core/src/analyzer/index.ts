/**
 * Genetic analysis module
 *
 * Performs higher-level analysis on matched variants including:
 * - Risk assessment
 * - Pharmacogenomics phenotype prediction
 * - Carrier status detection
 *
 * @packageDocumentation
 */

import type {
  MatchResult,
  AnnotatedSNP,
  RiskLevel
} from '@genomeforge/types';

// ============================================================================
// Types
// ============================================================================

export interface RiskAssessment {
  condition: string;
  gene: string;
  riskLevel: RiskLevel;
  confidence: number;
  variants: AnnotatedSNP[];
  explanation: string;
}

export interface MetabolizerPhenotype {
  gene: string;
  phenotype: string;
  activityScore?: number;
  affectedDrugs: string[];
  recommendations: string[];
}

export interface CarrierStatus {
  gene: string;
  condition: string;
  inheritance: 'autosomal_recessive' | 'x_linked' | 'other';
  partnerRisk: string;
}

export interface AnalysisResult {
  riskAssessments: RiskAssessment[];
  metabolizerPhenotypes: MetabolizerPhenotype[];
  carrierStatuses: CarrierStatus[];
  summary: AnalysisSummary;
}

export interface AnalysisSummary {
  totalRisks: number;
  highRiskCount: number;
  moderateRiskCount: number;
  pharmacogeneCount: number;
  carrierCount: number;
}

// ============================================================================
// Risk Assessment
// ============================================================================

/**
 * Assess disease risk based on matched variants
 */
export function assessRisks(matchResult: MatchResult): RiskAssessment[] {
  const risks: RiskAssessment[] = [];
  const conditionGroups = new Map<string, AnnotatedSNP[]>();

  // Group variants by condition
  for (const annotated of matchResult.annotatedSNPs) {
    if (!annotated.clinvar) continue;

    for (const condition of annotated.clinvar.conditions) {
      const key = condition.name;
      if (!conditionGroups.has(key)) {
        conditionGroups.set(key, []);
      }
      conditionGroups.get(key)!.push(annotated);
    }
  }

  // Assess each condition
  for (const [condition, variants] of conditionGroups) {
    const highestImpact = Math.max(...variants.map(v => v.impactScore));
    const highestStars = Math.max(...variants.map(v => v.clinvar?.reviewStatus || 0));

    const riskLevel = determineRiskLevel(highestImpact, variants);
    const gene = variants[0].clinvar?.gene || 'Unknown';

    risks.push({
      condition,
      gene,
      riskLevel,
      confidence: highestStars / 4, // Normalize to 0-1
      variants,
      explanation: generateRiskExplanation(condition, riskLevel, variants)
    });
  }

  // Sort by risk level and impact
  const riskOrder: Record<RiskLevel, number> = {
    high: 0,
    moderate: 1,
    low: 2,
    unknown: 3
  };

  risks.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);

  return risks;
}

function determineRiskLevel(impactScore: number, variants: AnnotatedSNP[]): RiskLevel {
  // Check for pathogenic variants
  const hasPathogenic = variants.some(v =>
    v.clinvar?.clinicalSignificance === 'pathogenic'
  );

  const hasLikelyPathogenic = variants.some(v =>
    v.clinvar?.clinicalSignificance === 'likely_pathogenic'
  );

  if (hasPathogenic && impactScore >= 4) {
    return 'high';
  }

  if (hasLikelyPathogenic || impactScore >= 2) {
    return 'moderate';
  }

  if (impactScore >= 1) {
    return 'low';
  }

  return 'unknown';
}

function generateRiskExplanation(
  condition: string,
  riskLevel: RiskLevel,
  variants: AnnotatedSNP[]
): string {
  const variantCount = variants.length;
  const genes = [...new Set(variants.map(v => v.clinvar?.gene).filter(Boolean))];

  const explanations: Record<RiskLevel, string> = {
    high: `${variantCount} variant(s) in ${genes.join(', ')} associated with increased risk for ${condition}. Consultation with a healthcare provider is recommended.`,
    moderate: `${variantCount} variant(s) in ${genes.join(', ')} may be associated with ${condition}. Consider discussing with a healthcare provider.`,
    low: `${variantCount} variant(s) found with possible but limited association with ${condition}.`,
    unknown: `Variants found but clinical significance for ${condition} is uncertain.`
  };

  return explanations[riskLevel];
}

// ============================================================================
// Pharmacogenomics Analysis
// ============================================================================

// Common pharmacogenes and their metabolizer phenotypes
// Exported for use in phenotype determination when full star allele calling is implemented
export const METABOLIZER_PHENOTYPES: Record<string, Record<string, string>> = {
  CYP2D6: {
    '*1/*1': 'Normal Metabolizer',
    '*1/*4': 'Intermediate Metabolizer',
    '*4/*4': 'Poor Metabolizer',
    '*1/*1xN': 'Ultrarapid Metabolizer'
  },
  CYP2C19: {
    '*1/*1': 'Normal Metabolizer',
    '*1/*2': 'Intermediate Metabolizer',
    '*2/*2': 'Poor Metabolizer',
    '*1/*17': 'Rapid Metabolizer',
    '*17/*17': 'Ultrarapid Metabolizer'
  },
  CYP2C9: {
    '*1/*1': 'Normal Metabolizer',
    '*1/*2': 'Intermediate Metabolizer',
    '*1/*3': 'Intermediate Metabolizer',
    '*2/*2': 'Poor Metabolizer'
  }
};

/**
 * Determine metabolizer phenotypes for pharmacogenes
 */
export function analyzePharmacogenomics(matchResult: MatchResult): MetabolizerPhenotype[] {
  const phenotypes: MetabolizerPhenotype[] = [];
  const geneVariants = new Map<string, AnnotatedSNP[]>();

  // Group by gene
  for (const annotated of matchResult.annotatedSNPs) {
    if (!annotated.pharmgkb) continue;

    const gene = annotated.pharmgkb.gene;
    if (!geneVariants.has(gene)) {
      geneVariants.set(gene, []);
    }
    geneVariants.get(gene)!.push(annotated);
  }

  // Analyze each gene
  for (const [gene, variants] of geneVariants) {
    // Collect affected drugs
    const affectedDrugs = new Set<string>();
    const recommendations: string[] = [];

    for (const variant of variants) {
      if (variant.pharmgkb) {
        for (const drug of variant.pharmgkb.drugs) {
          affectedDrugs.add(drug.drugName);
          if (drug.annotation) {
            recommendations.push(`${drug.drugName}: ${drug.annotation}`);
          }
        }
      }
    }

    // Note: Full diplotype calling requires more complex analysis
    // This is a simplified representation
    phenotypes.push({
      gene,
      phenotype: 'See variant details', // Would need full star allele calling
      affectedDrugs: [...affectedDrugs],
      recommendations: recommendations.slice(0, 5)
    });
  }

  return phenotypes;
}

// ============================================================================
// Carrier Status
// ============================================================================

/**
 * Identify carrier statuses for recessive conditions
 */
export function identifyCarrierStatus(matchResult: MatchResult): CarrierStatus[] {
  const carriers: CarrierStatus[] = [];

  for (const annotated of matchResult.annotatedSNPs) {
    if (annotated.category !== 'carrier') continue;
    if (!annotated.clinvar) continue;

    // Check if this is for a recessive condition
    // (Would need inheritance pattern data from database)
    const condition = annotated.clinvar.conditions[0]?.name || 'Unknown condition';

    carriers.push({
      gene: annotated.clinvar.gene,
      condition,
      inheritance: 'autosomal_recessive', // Simplified
      partnerRisk: 'If partner is also a carrier, there is a 25% chance each child would be affected.'
    });
  }

  return carriers;
}

// ============================================================================
// Main Analysis Function
// ============================================================================

/**
 * Perform complete genetic analysis
 */
export function analyzeGenome(matchResult: MatchResult): AnalysisResult {
  const riskAssessments = assessRisks(matchResult);
  const metabolizerPhenotypes = analyzePharmacogenomics(matchResult);
  const carrierStatuses = identifyCarrierStatus(matchResult);

  const summary: AnalysisSummary = {
    totalRisks: riskAssessments.length,
    highRiskCount: riskAssessments.filter(r => r.riskLevel === 'high').length,
    moderateRiskCount: riskAssessments.filter(r => r.riskLevel === 'moderate').length,
    pharmacogeneCount: metabolizerPhenotypes.length,
    carrierCount: carrierStatuses.length
  };

  return {
    riskAssessments,
    metabolizerPhenotypes,
    carrierStatuses,
    summary
  };
}

// Types are already exported via interface definitions above
