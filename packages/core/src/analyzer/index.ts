/**
 * Genetic analysis module
 *
 * Performs comprehensive genetic analysis including:
 * - Risk assessment from ClinVar pathogenic variants
 * - Pharmacogenomics phenotype prediction
 * - Carrier status detection for recessive conditions
 * - GWAS trait association analysis
 * - Polygenic risk score calculation
 *
 * @packageDocumentation
 */

import type {
  MatchResult,
  AnnotatedSNP,
  RiskLevel,
  TraitAssociation,
  TraitCategory,
  PolygenicRiskScore,
  EnhancedAnalysisResult,
  RiskAssessment,
  EnhancedMetabolizerPhenotype,
  MetabolizerStatus,
  DrugRecommendation,
  EnhancedCarrierStatus,
  EnhancedAnalysisSummary,
  KeyFinding,
  GWASAssociation
} from '@genomeforge/types';

// ============================================================================
// Constants
// ============================================================================

/** Standard pharmacogenes with known metabolizer phenotypes */
export const PHARMACOGENES = [
  'CYP2D6', 'CYP2C19', 'CYP2C9', 'CYP3A4', 'CYP3A5',
  'CYP1A2', 'CYP2B6', 'DPYD', 'TPMT', 'NUDT15',
  'UGT1A1', 'SLCO1B1', 'VKORC1', 'G6PD', 'NAT2'
] as const;

/** Drug therapeutic categories for classification */
const THERAPEUTIC_CATEGORIES: Record<string, string[]> = {
  'cardiovascular': ['warfarin', 'clopidogrel', 'simvastatin', 'atorvastatin'],
  'psychiatric': ['sertraline', 'citalopram', 'escitalopram', 'fluoxetine', 'paroxetine', 'amitriptyline'],
  'pain': ['codeine', 'tramadol', 'oxycodone', 'morphine'],
  'oncology': ['fluorouracil', 'capecitabine', 'mercaptopurine', 'thioguanine', 'irinotecan'],
  'immunosuppressant': ['azathioprine', 'tacrolimus', 'cyclosporine'],
  'antiinfective': ['voriconazole', 'efavirenz', 'abacavir'],
  'gastrointestinal': ['omeprazole', 'lansoprazole', 'pantoprazole']
};

/** Trait category keywords for classification */
const TRAIT_CATEGORY_KEYWORDS: Record<TraitCategory, string[]> = {
  disease: ['disease', 'syndrome', 'disorder'],
  cardiovascular: ['heart', 'cardiac', 'coronary', 'hypertension', 'blood pressure', 'stroke', 'arrhythmia', 'atrial'],
  metabolic: ['diabetes', 'obesity', 'bmi', 'lipid', 'cholesterol', 'triglyceride', 'glucose', 'insulin', 'metabolic'],
  neurological: ['alzheimer', 'parkinson', 'epilepsy', 'migraine', 'schizophrenia', 'depression', 'bipolar', 'adhd', 'autism'],
  autoimmune: ['rheumatoid', 'lupus', 'celiac', 'crohn', 'psoriasis', 'multiple sclerosis', 'autoimmune'],
  cancer: ['cancer', 'carcinoma', 'melanoma', 'leukemia', 'lymphoma', 'tumor', 'neoplasm'],
  physical_trait: ['height', 'eye color', 'hair', 'skin', 'freckles', 'baldness'],
  response: ['response', 'sensitivity', 'tolerance', 'metabolism'],
  other: []
};

// ============================================================================
// Types (Local)
// ============================================================================

export interface AnalysisOptions {
  /** Include GWAS trait associations */
  includeTraitAssociations?: boolean;
  /** Include polygenic risk scores */
  includePolygenicScores?: boolean;
  /** Minimum p-value for GWAS associations */
  minGwasPValue?: number;
  /** Minimum variants for PRS calculation */
  minPrsVariants?: number;
}

// ============================================================================
// Risk Assessment
// ============================================================================

/**
 * Assess disease risk based on matched variants from ClinVar
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

    // Determine inheritance pattern from variant annotations
    const inheritance = inferInheritancePattern(variants);

    risks.push({
      condition,
      gene,
      riskLevel,
      confidence: highestStars / 4, // Normalize to 0-1
      variants,
      explanation: generateRiskExplanation(condition, riskLevel, variants),
      inheritance
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

  // Check review status (higher stars = more confidence)
  const hasHighConfidence = variants.some(v =>
    (v.clinvar?.reviewStatus || 0) >= 2
  );

  if (hasPathogenic && hasHighConfidence && impactScore >= 4) {
    return 'high';
  }

  if (hasPathogenic || (hasLikelyPathogenic && impactScore >= 2)) {
    return 'moderate';
  }

  if (hasLikelyPathogenic || impactScore >= 1) {
    return 'low';
  }

  return 'unknown';
}

function inferInheritancePattern(variants: AnnotatedSNP[]): RiskAssessment['inheritance'] {
  // Check for X chromosome variants
  const hasXLinked = variants.some(v => v.snp.chromosome === 'X');
  if (hasXLinked) return 'x_linked';

  // Check for heterozygous pathogenic (potential carrier)
  const hasHeterozygousPathogenic = variants.some(v =>
    v.clinvar?.clinicalSignificance === 'pathogenic' &&
    v.snp.allele1 !== v.snp.allele2
  );

  // Check for homozygous pathogenic
  const hasHomozygousPathogenic = variants.some(v =>
    v.clinvar?.clinicalSignificance === 'pathogenic' &&
    v.snp.allele1 === v.snp.allele2
  );

  if (hasHeterozygousPathogenic && !hasHomozygousPathogenic) {
    return 'autosomal_dominant';
  }

  if (hasHomozygousPathogenic) {
    return 'autosomal_recessive';
  }

  return 'complex';
}

function generateRiskExplanation(
  condition: string,
  riskLevel: RiskLevel,
  variants: AnnotatedSNP[]
): string {
  const variantCount = variants.length;
  const genes = [...new Set(variants.map(v => v.clinvar?.gene).filter(Boolean))];
  const geneList = genes.length > 3 ? `${genes.slice(0, 3).join(', ')} and others` : genes.join(', ');

  const explanations: Record<RiskLevel, string> = {
    high: `${variantCount} pathogenic variant(s) identified in ${geneList} associated with ${condition}. This finding indicates a significantly elevated risk. Consultation with a healthcare provider or genetic counselor is strongly recommended.`,
    moderate: `${variantCount} variant(s) in ${geneList} may be associated with ${condition}. These findings suggest a possible elevated risk. Consider discussing with a healthcare provider.`,
    low: `${variantCount} variant(s) found with possible but limited association with ${condition}. The clinical significance is uncertain or the evidence is limited.`,
    unknown: `Variants found in ${geneList} but clinical significance for ${condition} is currently uncertain or conflicting.`
  };

  return explanations[riskLevel];
}

// ============================================================================
// Pharmacogenomics Analysis
// ============================================================================

/** Star allele definitions for common pharmacogenes */
const STAR_ALLELE_DEFINITIONS: Record<string, Record<string, { rsid: string; allele: string }[]>> = {
  CYP2D6: {
    '*4': [{ rsid: 'rs3892097', allele: 'A' }],
    '*10': [{ rsid: 'rs1065852', allele: 'T' }],
    '*41': [{ rsid: 'rs28371725', allele: 'T' }]
  },
  CYP2C19: {
    '*2': [{ rsid: 'rs4244285', allele: 'A' }],
    '*3': [{ rsid: 'rs4986893', allele: 'A' }],
    '*17': [{ rsid: 'rs12248560', allele: 'T' }]
  },
  CYP2C9: {
    '*2': [{ rsid: 'rs1799853', allele: 'T' }],
    '*3': [{ rsid: 'rs1057910', allele: 'C' }]
  },
  VKORC1: {
    '-1639A': [{ rsid: 'rs9923231', allele: 'T' }]
  },
  SLCO1B1: {
    '*5': [{ rsid: 'rs4149056', allele: 'C' }]
  }
};

/** Activity scores for star alleles */
const ACTIVITY_SCORES: Record<string, Record<string, number>> = {
  CYP2D6: {
    '*1': 1, '*2': 1, '*4': 0, '*5': 0, '*10': 0.25, '*41': 0.5
  },
  CYP2C19: {
    '*1': 1, '*2': 0, '*3': 0, '*17': 1.5
  },
  CYP2C9: {
    '*1': 1, '*2': 0.5, '*3': 0
  }
};

/**
 * Determine metabolizer phenotypes for pharmacogenes
 */
export function analyzePharmacogenomics(matchResult: MatchResult): EnhancedMetabolizerPhenotype[] {
  const phenotypes: EnhancedMetabolizerPhenotype[] = [];
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
    // Attempt diplotype calling
    const diplotype = callDiplotype(gene, variants, matchResult);
    const activityScore = calculateActivityScore(gene, diplotype);
    const phenotype = determinePhenotype(gene, activityScore);

    // Collect affected drugs with enhanced recommendations
    const affectedDrugs = collectDrugRecommendations(gene, variants, phenotype);
    const contributingVariants = variants.map(v => v.snp.rsid);

    phenotypes.push({
      gene,
      diplotype,
      phenotype,
      activityScore,
      affectedDrugs,
      cpicStatus: variants.some(v =>
        v.pharmgkb?.hasCPICGuideline
      ) ? 'available' : 'not_available',
      contributingVariants
    });
  }

  return phenotypes;
}

function callDiplotype(
  gene: string,
  _variants: AnnotatedSNP[],
  matchResult: MatchResult
): string | undefined {
  const definitions = STAR_ALLELE_DEFINITIONS[gene];
  if (!definitions) return undefined;

  const detectedAlleles: string[] = [];
  const snpMap = new Map(
    matchResult.annotatedSNPs.map(a => [a.snp.rsid, a])
  );

  // Check for each defined star allele
  for (const [allele, markers] of Object.entries(definitions)) {
    let alleleCount = 0;

    for (const marker of markers) {
      const snp = snpMap.get(marker.rsid);
      if (!snp) continue;

      // Count how many copies of the variant allele
      const genotype = snp.snp.genotype;
      const copies = countAllele(genotype, marker.allele);

      if (copies > 0) {
        alleleCount = Math.max(alleleCount, copies);
      }
    }

    // Add detected alleles
    for (let i = 0; i < alleleCount; i++) {
      detectedAlleles.push(allele);
    }
  }

  // Fill remaining with *1 (reference)
  while (detectedAlleles.length < 2) {
    detectedAlleles.push('*1');
  }

  // Sort and format diplotype
  detectedAlleles.sort();
  return `${detectedAlleles[0]}/${detectedAlleles[1]}`;
}

function countAllele(genotype: string, allele: string): number {
  let count = 0;
  for (const char of genotype.toUpperCase()) {
    if (char === allele.toUpperCase()) count++;
  }
  return Math.min(count, 2);
}

function calculateActivityScore(gene: string, diplotype?: string): number | undefined {
  if (!diplotype) return undefined;

  const scores = ACTIVITY_SCORES[gene];
  if (!scores) return undefined;

  const [allele1, allele2] = diplotype.split('/');
  const score1 = scores[allele1] ?? 1;
  const score2 = scores[allele2] ?? 1;

  return score1 + score2;
}

function determinePhenotype(_gene: string, activityScore?: number): MetabolizerStatus {
  if (activityScore === undefined) return 'unknown';

  // Standard CPIC activity score thresholds (varies by gene)
  if (activityScore === 0) return 'poor';
  if (activityScore < 1) return 'intermediate';
  if (activityScore <= 2) return 'normal';
  if (activityScore <= 2.5) return 'rapid';
  return 'ultrarapid';
}

function collectDrugRecommendations(
  gene: string,
  variants: AnnotatedSNP[],
  phenotype: MetabolizerStatus
): DrugRecommendation[] {
  const drugs: DrugRecommendation[] = [];
  const seenDrugs = new Set<string>();

  for (const variant of variants) {
    if (!variant.pharmgkb) continue;

    for (const drug of variant.pharmgkb.drugs) {
      if (seenDrugs.has(drug.drugName)) continue;
      seenDrugs.add(drug.drugName);

      // Determine therapeutic category
      const category = findTherapeuticCategory(drug.drugName.toLowerCase());

      // Determine severity based on evidence level and phenotype
      const severity = determineDrugSeverity(drug.evidenceLevel, phenotype);

      // Generate recommendation based on phenotype
      const recommendation = generateDrugRecommendation(
        drug.drugName,
        gene,
        phenotype,
        drug.annotation
      );

      drugs.push({
        drugName: drug.drugName,
        genericName: drug.drugName, // PharmGKB usually uses generic names
        recommendation,
        severity,
        evidenceLevel: drug.evidenceLevel,
        hasFDALabel: drug.fdaLabel || false,
        cpicLevel: drug.cpicLevel,
        therapeuticCategory: category
      });
    }
  }

  // Sort by severity and evidence level
  const severityOrder = { critical: 0, moderate: 1, informational: 2 };
  drugs.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return drugs;
}

function findTherapeuticCategory(drugName: string): string | undefined {
  for (const [category, drugs] of Object.entries(THERAPEUTIC_CATEGORIES)) {
    if (drugs.some(d => drugName.includes(d))) {
      return category;
    }
  }
  return undefined;
}

function determineDrugSeverity(
  evidenceLevel: string,
  phenotype: MetabolizerStatus
): 'critical' | 'moderate' | 'informational' {
  // High evidence + poor/ultrarapid = critical
  if (
    (evidenceLevel === '1A' || evidenceLevel === '1B') &&
    (phenotype === 'poor' || phenotype === 'ultrarapid')
  ) {
    return 'critical';
  }

  // Level 2 evidence or intermediate phenotype = moderate
  if (
    evidenceLevel.startsWith('2') ||
    phenotype === 'intermediate' ||
    phenotype === 'rapid'
  ) {
    return 'moderate';
  }

  return 'informational';
}

function generateDrugRecommendation(
  drugName: string,
  gene: string,
  phenotype: MetabolizerStatus,
  annotation?: string
): string {
  const phenotypeRecommendations: Record<MetabolizerStatus, string> = {
    poor: `Consider alternative medication or reduced dose. ${gene} poor metabolizer status may result in increased drug exposure and risk of adverse effects.`,
    intermediate: `Standard dosing may be appropriate, but monitoring is recommended. ${gene} intermediate metabolizer status may affect drug response.`,
    normal: `Standard dosing is expected to be appropriate based on ${gene} normal metabolizer status.`,
    rapid: `Standard dosing may be appropriate, but increased metabolism could reduce efficacy. Monitor therapeutic response.`,
    ultrarapid: `Consider increased dose or alternative medication. ${gene} ultrarapid metabolizer status may result in reduced drug efficacy.`,
    unknown: `Metabolizer status uncertain. Follow standard prescribing guidelines and monitor response.`
  };

  if (annotation) {
    return `${annotation} ${phenotypeRecommendations[phenotype]}`;
  }

  return `${drugName}: ${phenotypeRecommendations[phenotype]}`;
}

// ============================================================================
// Carrier Status
// ============================================================================

/**
 * Identify carrier statuses for recessive conditions
 */
export function identifyCarrierStatus(matchResult: MatchResult): EnhancedCarrierStatus[] {
  const carriers: EnhancedCarrierStatus[] = [];
  const seenConditions = new Set<string>();

  for (const annotated of matchResult.annotatedSNPs) {
    if (!annotated.clinvar) continue;

    // Check for heterozygous pathogenic variants (carrier)
    const isHeterozygous = annotated.snp.allele1 !== annotated.snp.allele2;
    const isPathogenic =
      annotated.clinvar.clinicalSignificance === 'pathogenic' ||
      annotated.clinvar.clinicalSignificance === 'likely_pathogenic';

    if (!isHeterozygous || !isPathogenic) continue;

    // Determine inheritance type
    const isXLinked = annotated.snp.chromosome === 'X';

    for (const condition of annotated.clinvar.conditions) {
      const key = `${annotated.clinvar.gene}:${condition.name}`;
      if (seenConditions.has(key)) continue;
      seenConditions.add(key);

      carriers.push({
        gene: annotated.clinvar.gene,
        condition: condition.name,
        inheritance: isXLinked ? 'x_linked' : 'autosomal_recessive',
        carrierType: isXLinked ? 'x_linked_female' : 'heterozygous',
        partnerRisk: generatePartnerRiskExplanation(isXLinked),
        variantAccession: annotated.clinvar.vcv
      });
    }
  }

  return carriers;
}

function generatePartnerRiskExplanation(isXLinked: boolean): string {
  if (isXLinked) {
    return 'As a carrier of an X-linked condition, male children have a 50% chance of being affected if the variant is inherited. Female children who inherit the variant would be carriers.';
  }

  return 'If your partner is also a carrier for this condition, each pregnancy has a 25% chance of resulting in an affected child, 50% chance of a carrier child, and 25% chance of a non-carrier child.';
}

// ============================================================================
// GWAS Trait Association Analysis
// ============================================================================

/**
 * Analyze GWAS trait associations from matched variants
 */
export function analyzeTraitAssociations(matchResult: MatchResult): TraitAssociation[] {
  const traitGroups = new Map<string, GWASAssociation[]>();

  // Group associations by trait
  for (const annotated of matchResult.annotatedSNPs) {
    if (!annotated.gwas) continue;

    for (const association of annotated.gwas) {
      if (!traitGroups.has(association.trait)) {
        traitGroups.set(association.trait, []);
      }
      traitGroups.get(association.trait)!.push(association);
    }
  }

  const traitAssociations: TraitAssociation[] = [];

  for (const [trait, associations] of traitGroups) {
    // Calculate risk score based on effect sizes and risk allele presence
    const riskScore = calculateTraitRiskScore(associations);
    const interpretation = interpretRiskScore(riskScore, associations);
    const confidence = determineConfidence(associations);
    const category = categorizeTraitByKeywords(trait);

    traitAssociations.push({
      trait,
      category,
      variantCount: associations.length,
      associations,
      riskScore,
      interpretation,
      confidence
    });
  }

  // Sort by number of variants and risk score
  traitAssociations.sort((a, b) => {
    if (b.variantCount !== a.variantCount) {
      return b.variantCount - a.variantCount;
    }
    return Math.abs(b.riskScore - 0.5) - Math.abs(a.riskScore - 0.5);
  });

  return traitAssociations;
}

function calculateTraitRiskScore(associations: GWASAssociation[]): number {
  if (associations.length === 0) return 0.5;

  let weightedSum = 0;
  let weightSum = 0;

  for (const assoc of associations) {
    // Weight by -log10(pValue) to give more weight to stronger associations
    const weight = -Math.log10(assoc.pValue);

    // Calculate effect based on risk allele copies
    let effect = 0;
    if (assoc.riskAlleleCopies !== undefined && assoc.orBeta !== undefined) {
      // For odds ratios > 1, more copies = higher risk
      // For odds ratios < 1, more copies = lower risk
      const oddsRatio = assoc.orBeta > 0 ? assoc.orBeta : 1 / Math.abs(assoc.orBeta);
      effect = assoc.riskAlleleCopies * Math.log(oddsRatio);
    } else if (assoc.hasRiskAllele !== undefined) {
      // Simple binary: has risk allele or not
      effect = assoc.hasRiskAllele ? 0.5 : -0.5;
    }

    weightedSum += weight * effect;
    weightSum += weight;
  }

  // Convert to 0-1 scale (0.5 is average risk)
  const rawScore = weightSum > 0 ? weightedSum / weightSum : 0;
  const normalizedScore = 1 / (1 + Math.exp(-rawScore)); // Sigmoid to bound 0-1

  return normalizedScore;
}

function interpretRiskScore(
  riskScore: number,
  associations: GWASAssociation[]
): TraitAssociation['interpretation'] {
  // Check if we have enough information
  const hasRiskAlleleInfo = associations.some(a => a.hasRiskAllele !== undefined);

  if (!hasRiskAlleleInfo) return 'unknown';

  if (riskScore >= 0.65) return 'increased';
  if (riskScore <= 0.35) return 'decreased';
  return 'typical';
}

function determineConfidence(associations: GWASAssociation[]): TraitAssociation['confidence'] {
  // Confidence based on number of studies and p-values
  const strongAssociations = associations.filter(a => a.pValue < 1e-10);

  if (strongAssociations.length >= 3) return 'high';
  if (strongAssociations.length >= 1 || associations.length >= 3) return 'moderate';
  return 'low';
}

function categorizeTraitByKeywords(trait: string): TraitCategory {
  const lowerTrait = trait.toLowerCase();

  for (const [category, keywords] of Object.entries(TRAIT_CATEGORY_KEYWORDS)) {
    if (category === 'other') continue;
    if (keywords.some(keyword => lowerTrait.includes(keyword))) {
      return category as TraitCategory;
    }
  }

  return 'other';
}

// ============================================================================
// Polygenic Risk Score Calculation
// ============================================================================

/** Pre-defined PRS models for common traits */
const PRS_MODELS: Record<string, PRSVariant[]> = {
  'Type 2 Diabetes': [
    { rsid: 'rs7903146', riskAllele: 'T', weight: 0.35 },
    { rsid: 'rs12255372', riskAllele: 'T', weight: 0.25 },
    { rsid: 'rs1801282', riskAllele: 'G', weight: 0.15 },
    { rsid: 'rs5219', riskAllele: 'T', weight: 0.20 },
    { rsid: 'rs13266634', riskAllele: 'C', weight: 0.18 }
  ],
  'Coronary Artery Disease': [
    { rsid: 'rs10757274', riskAllele: 'G', weight: 0.30 },
    { rsid: 'rs2383206', riskAllele: 'G', weight: 0.28 },
    { rsid: 'rs1333049', riskAllele: 'C', weight: 0.32 },
    { rsid: 'rs4977574', riskAllele: 'G', weight: 0.29 }
  ],
  'Body Mass Index': [
    { rsid: 'rs9939609', riskAllele: 'A', weight: 0.39 },
    { rsid: 'rs17782313', riskAllele: 'C', weight: 0.22 },
    { rsid: 'rs6548238', riskAllele: 'C', weight: 0.18 }
  ]
};

interface PRSVariant {
  rsid: string;
  riskAllele: string;
  weight: number;
}

/**
 * Calculate polygenic risk scores for available traits
 */
export function calculatePolygenicRiskScores(matchResult: MatchResult): PolygenicRiskScore[] {
  const scores: PolygenicRiskScore[] = [];
  const snpMap = new Map(matchResult.annotatedSNPs.map(a => [a.snp.rsid, a]));

  // Also include SNPs that weren't annotated but exist in genome
  // We need access to the full genome for comprehensive PRS
  // For now, use what we have in annotatedSNPs

  for (const [trait, variants] of Object.entries(PRS_MODELS)) {
    let rawScore = 0;
    let variantsUsed = 0;
    let variantsMissing = 0;

    for (const prsVariant of variants) {
      const snp = snpMap.get(prsVariant.rsid);

      if (!snp) {
        variantsMissing++;
        continue;
      }

      variantsUsed++;
      const copies = countAllele(snp.snp.genotype, prsVariant.riskAllele);
      rawScore += copies * prsVariant.weight;
    }

    // Skip if insufficient coverage
    const coverage = variantsUsed / variants.length;
    if (coverage < 0.5) continue;

    // Calculate Z-score (assuming population mean = sum of weights, SD = 1)
    const expectedMean = variants.reduce((sum, v) => sum + v.weight, 0);
    const zScore = (rawScore - expectedMean) / (expectedMean * 0.5);

    // Convert Z-score to percentile
    const percentile = zScoreToPercentile(zScore);

    // Determine risk category
    const riskCategory = percentileToRiskCategory(percentile);

    // Calculate relative risk (approximate)
    const relativeRisk = Math.exp(zScore * 0.3); // Simplified model

    scores.push({
      trait,
      rawScore,
      zScore,
      percentile,
      riskCategory,
      variantsUsed,
      variantsMissing,
      coverage: coverage * 100,
      relativeRisk
    });
  }

  // Sort by percentile deviation from 50 (most significant first)
  scores.sort((a, b) => Math.abs(b.percentile - 50) - Math.abs(a.percentile - 50));

  return scores;
}

function zScoreToPercentile(zScore: number): number {
  // Approximation of normal CDF
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = zScore < 0 ? -1 : 1;
  const x = Math.abs(zScore) / Math.sqrt(2);
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return Math.round((0.5 * (1 + sign * y)) * 100);
}

function percentileToRiskCategory(percentile: number): PolygenicRiskScore['riskCategory'] {
  if (percentile >= 95) return 'very_high';
  if (percentile >= 80) return 'high';
  if (percentile >= 60) return 'moderate';
  if (percentile >= 40) return 'average';
  if (percentile >= 20) return 'low';
  return 'very_low';
}

// ============================================================================
// Key Findings Generation
// ============================================================================

function generateKeyFindings(
  riskAssessments: RiskAssessment[],
  metabolizerPhenotypes: EnhancedMetabolizerPhenotype[],
  carrierStatuses: EnhancedCarrierStatus[],
  traitAssociations: TraitAssociation[],
  polygenicRiskScores: PolygenicRiskScore[]
): KeyFinding[] {
  const findings: KeyFinding[] = [];

  // High-risk pathogenic findings
  for (const risk of riskAssessments.filter(r => r.riskLevel === 'high')) {
    findings.push({
      type: 'pathogenic',
      priority: 'urgent',
      title: `Pathogenic variant in ${risk.gene}`,
      description: `High-risk finding for ${risk.condition}. Consultation recommended.`,
      relatedItem: risk.gene
    });
  }

  // Critical drug interactions
  for (const pheno of metabolizerPhenotypes) {
    const criticalDrugs = pheno.affectedDrugs.filter(d => d.severity === 'critical');
    for (const drug of criticalDrugs.slice(0, 2)) {
      findings.push({
        type: 'drug',
        priority: 'urgent',
        title: `${drug.drugName} interaction`,
        description: `${pheno.gene} ${pheno.phenotype} metabolizer affects ${drug.drugName} response.`,
        relatedItem: pheno.gene
      });
    }
  }

  // Carrier statuses
  for (const carrier of carrierStatuses.slice(0, 3)) {
    findings.push({
      type: 'carrier',
      priority: 'important',
      title: `Carrier: ${carrier.condition}`,
      description: `Carrier of ${carrier.inheritance} condition in ${carrier.gene}.`,
      relatedItem: carrier.gene
    });
  }

  // High PRS findings
  for (const prs of polygenicRiskScores.filter(p =>
    p.riskCategory === 'very_high' || p.riskCategory === 'high'
  ).slice(0, 2)) {
    findings.push({
      type: 'prs',
      priority: 'important',
      title: `Elevated ${prs.trait} risk`,
      description: `${prs.percentile}th percentile polygenic risk score for ${prs.trait}.`,
      relatedItem: prs.trait
    });
  }

  // Notable trait associations
  for (const trait of traitAssociations.filter(t =>
    t.interpretation === 'increased' && t.confidence !== 'low'
  ).slice(0, 3)) {
    findings.push({
      type: 'trait',
      priority: 'informational',
      title: `${trait.trait} association`,
      description: `${trait.variantCount} variants associated with ${trait.interpretation} risk.`,
      relatedItem: trait.trait
    });
  }

  return findings.slice(0, 10);
}

// ============================================================================
// Main Analysis Functions
// ============================================================================

/**
 * Perform comprehensive genetic analysis
 */
export function analyzeGenome(
  matchResult: MatchResult,
  options: AnalysisOptions = {}
): EnhancedAnalysisResult {
  const {
    includeTraitAssociations = true,
    includePolygenicScores = true
  } = options;

  // Run all analysis components
  const riskAssessments = assessRisks(matchResult);
  const metabolizerPhenotypes = analyzePharmacogenomics(matchResult);
  const carrierStatuses = identifyCarrierStatus(matchResult);
  const traitAssociations = includeTraitAssociations
    ? analyzeTraitAssociations(matchResult)
    : [];
  const polygenicRiskScores = includePolygenicScores
    ? calculatePolygenicRiskScores(matchResult)
    : [];

  // Generate key findings
  const keyFindings = generateKeyFindings(
    riskAssessments,
    metabolizerPhenotypes,
    carrierStatuses,
    traitAssociations,
    polygenicRiskScores
  );

  // Calculate summary statistics
  const summary: EnhancedAnalysisSummary = {
    totalVariantsAnalyzed: matchResult.matchedSNPs,
    pathogenicCount: matchResult.pathogenicCount,
    highRiskCount: riskAssessments.filter(r => r.riskLevel === 'high').length,
    moderateRiskCount: riskAssessments.filter(r => r.riskLevel === 'moderate').length,
    pharmacogeneCount: metabolizerPhenotypes.length,
    carrierCount: carrierStatuses.length,
    traitAssociationCount: traitAssociations.length,
    prsCount: polygenicRiskScores.length,
    keyFindings
  };

  return {
    genomeId: matchResult.genomeId,
    analyzedAt: new Date(),
    riskAssessments,
    metabolizerPhenotypes,
    carrierStatuses,
    traitAssociations,
    polygenicRiskScores,
    summary,
    databaseVersions: matchResult.databaseVersions
  };
}

// ============================================================================
// Legacy API (backwards compatibility)
// ============================================================================

/** @deprecated Use EnhancedMetabolizerPhenotype instead */
export interface MetabolizerPhenotype {
  gene: string;
  phenotype: string;
  activityScore?: number;
  affectedDrugs: string[];
  recommendations: string[];
}

/** @deprecated Use EnhancedCarrierStatus instead */
export interface CarrierStatus {
  gene: string;
  condition: string;
  inheritance: 'autosomal_recessive' | 'x_linked' | 'other';
  partnerRisk: string;
}

/** @deprecated Use EnhancedAnalysisResult instead */
export interface AnalysisResult {
  riskAssessments: RiskAssessment[];
  metabolizerPhenotypes: MetabolizerPhenotype[];
  carrierStatuses: CarrierStatus[];
  summary: AnalysisSummary;
}

/** @deprecated Use EnhancedAnalysisSummary instead */
export interface AnalysisSummary {
  totalRisks: number;
  highRiskCount: number;
  moderateRiskCount: number;
  pharmacogeneCount: number;
  carrierCount: number;
}

/**
 * @deprecated Use analyzeGenome() which returns EnhancedAnalysisResult
 */
export function analyzeLegacy(matchResult: MatchResult): AnalysisResult {
  const enhanced = analyzeGenome(matchResult);

  // Convert to legacy format
  const legacyPhenotypes: MetabolizerPhenotype[] = enhanced.metabolizerPhenotypes.map(p => ({
    gene: p.gene,
    phenotype: p.phenotype,
    activityScore: p.activityScore,
    affectedDrugs: p.affectedDrugs.map(d => d.drugName),
    recommendations: p.affectedDrugs.map(d => d.recommendation).slice(0, 5)
  }));

  const legacyCarriers: CarrierStatus[] = enhanced.carrierStatuses.map(c => ({
    gene: c.gene,
    condition: c.condition,
    inheritance: c.inheritance === 'mitochondrial' ? 'other' : c.inheritance,
    partnerRisk: c.partnerRisk
  }));

  return {
    riskAssessments: enhanced.riskAssessments,
    metabolizerPhenotypes: legacyPhenotypes,
    carrierStatuses: legacyCarriers,
    summary: {
      totalRisks: enhanced.riskAssessments.length,
      highRiskCount: enhanced.summary.highRiskCount,
      moderateRiskCount: enhanced.summary.moderateRiskCount,
      pharmacogeneCount: enhanced.summary.pharmacogeneCount,
      carrierCount: enhanced.summary.carrierCount
    }
  };
}

// ============================================================================
// Exports
// ============================================================================

// Exported for use in phenotype determination
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

export type {
  RiskAssessment,
  EnhancedMetabolizerPhenotype,
  EnhancedCarrierStatus,
  TraitAssociation,
  PolygenicRiskScore,
  EnhancedAnalysisResult,
  EnhancedAnalysisSummary,
  KeyFinding,
  MetabolizerStatus,
  DrugRecommendation,
  TraitCategory
};
