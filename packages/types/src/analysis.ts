/**
 * Analysis and database-related type definitions
 * @packageDocumentation
 */

import type { SNP } from './genome';
import type { RiskLevel } from './reports';

// ============================================================================
// ClinVar Types
// ============================================================================

export type ClinicalSignificance =
  | 'pathogenic'
  | 'likely_pathogenic'
  | 'uncertain_significance'
  | 'likely_benign'
  | 'benign'
  | 'conflicting'
  | 'not_provided';

/** ClinVar review status (0-4 stars) */
export type ReviewStatus = 0 | 1 | 2 | 3 | 4;

export interface ClinVarVariant {
  /** rsID */
  rsid: string;
  /** VCV accession (e.g., VCV000123456) */
  vcv: string;
  /** Gene symbol */
  gene: string;
  /** Entrez Gene ID */
  geneId: number;
  /** Clinical significance classification */
  clinicalSignificance: ClinicalSignificance;
  /** Review status (star rating) */
  reviewStatus: ReviewStatus;
  /** Associated conditions */
  conditions: ClinVarCondition[];
  /** HGVS nomenclature */
  hgvs?: string;
  /** Molecular consequence (e.g., "missense_variant") */
  molecularConsequence?: string;
  /** Last evaluation date */
  lastEvaluated?: string;
}

export interface ClinVarCondition {
  /** Condition name */
  name: string;
  /** MedGen concept ID */
  medgenId?: string;
  /** Associated traits */
  traits: string[];
}

// ============================================================================
// PharmGKB Types
// ============================================================================

export type EvidenceLevel = '1A' | '1B' | '2A' | '2B' | '3' | '4';

export interface PharmGKBVariant {
  /** rsID */
  rsid: string;
  /** Gene symbol */
  gene: string;
  /** Drug-gene interactions */
  drugs: DrugGeneInteraction[];
  /** Has CPIC guideline */
  hasCPICGuideline: boolean;
  /** Has DPWG guideline */
  hasDPWGGuideline: boolean;
}

export interface DrugGeneInteraction {
  /** Drug name */
  drugName: string;
  /** PharmGKB drug ID */
  drugId: string;
  /** Evidence level */
  evidenceLevel: EvidenceLevel;
  /** Phenotype category (e.g., "Toxicity") */
  phenotypeCategory?: string;
  /** Statistical significance */
  significance: string;
  /** Annotation summary */
  annotation: string;
  /** CPIC classification level */
  cpicLevel?: string;
  /** Has FDA label annotation */
  fdaLabel?: boolean;
}

export interface CPICGuideline {
  /** Guideline ID */
  guidelineId: string;
  /** Gene symbol */
  gene: string;
  /** Drug name */
  drug: string;
  /** Diplotype-specific recommendations */
  diplotypes: DiplotypeRecommendation[];
}

export interface DiplotypeRecommendation {
  /** Diplotype (e.g., "*1/*2") */
  diplotype: string;
  /** Phenotype (e.g., "Intermediate Metabolizer") */
  phenotype: string;
  /** Dosing recommendation */
  recommendation: string;
  /** Recommendation strength */
  strength: 'Strong' | 'Moderate' | 'Optional';
}

// ============================================================================
// gnomAD Types
// ============================================================================

export type Population =
  | 'afr'   // African/African American
  | 'amr'   // Latino/Admixed American
  | 'asj'   // Ashkenazi Jewish
  | 'eas'   // East Asian
  | 'fin'   // Finnish
  | 'mid'   // Middle Eastern
  | 'nfe'   // Non-Finnish European
  | 'sas'   // South Asian
  | 'oth';  // Other

export interface GnomADFrequency {
  /** rsID */
  rsid: string;
  /** Global allele frequency */
  totalAF: number;
  /** Population-specific allele frequencies */
  populationAF: Record<Population, number>;
  /** Homozygote count */
  homozygoteCount: number;
  /** Heterozygote count */
  heterozygoteCount: number;
}

// ============================================================================
// Match Result Types
// ============================================================================

export type VariantCategory =
  | 'pathogenic'
  | 'drug'
  | 'carrier'
  | 'protective'
  | 'neutral';

export interface AnnotatedSNP {
  /** Original SNP data */
  snp: SNP;
  /** ClinVar annotation (if matched) */
  clinvar?: ClinVarVariant;
  /** PharmGKB annotation (if matched) */
  pharmgkb?: PharmGKBVariant;
  /** gnomAD frequency (if matched) */
  gnomad?: GnomADFrequency;
  /** GWAS associations (if matched) */
  gwas?: GWASAssociation[];
  /** Calculated impact score (0-6) */
  impactScore: number;
  /** Variant category */
  category: VariantCategory;
}

export interface MatchResult {
  /** Genome ID */
  genomeId: string;
  /** Total SNPs in genome */
  totalSNPs: number;
  /** SNPs matched against databases */
  matchedSNPs: number;
  /** Count of pathogenic variants */
  pathogenicCount: number;
  /** Count of drug interactions */
  drugInteractionCount: number;
  /** Count of carrier statuses */
  carrierCount: number;
  /** Count of GWAS associations */
  gwasAssociationCount: number;
  /** All annotated SNPs sorted by impact */
  annotatedSNPs: AnnotatedSNP[];
  /** Summary statistics */
  summary: MatchSummary;
  /** Genome build version */
  buildVersion: string;
  /** Database versions used */
  databaseVersions: {
    clinvar: string;
    pharmgkb: string;
    gnomad?: string;
    gwas?: string;
  };
}

export interface MatchSummary {
  /** High-impact findings summary */
  highImpact: string[];
  /** Moderate-impact findings */
  moderateImpact: string[];
  /** Key pharmacogenes identified */
  pharmacogenes: string[];
  /** Carrier statuses identified */
  carrierStatuses: string[];
  /** Top GWAS traits with associations */
  gwasTraits: string[];
}

// ============================================================================
// Database Metadata
// ============================================================================

export interface DatabaseMetadata {
  /** Database name */
  database: 'clinvar' | 'pharmgkb' | 'gnomad' | 'gwas';
  /** Version string */
  version: string;
  /** Last update timestamp */
  lastUpdated: Date;
  /** Number of records */
  recordCount: number;
  /** Data integrity checksum */
  checksum: string;
}

export interface DatabaseStatus {
  clinvar: { loaded: boolean; version: string | null; recordCount: number };
  pharmgkb: { loaded: boolean; version: string | null; recordCount: number };
  gnomad: { loaded: boolean; version: string | null; recordCount: number };
  gwas: { loaded: boolean; version: string | null; recordCount: number };
}

// ============================================================================
// GWAS Association Types
// ============================================================================

export interface GWASAssociation {
  /** rsID */
  rsid: string;
  /** Trait or phenotype */
  trait: string;
  /** p-value from study */
  pValue: number;
  /** Odds ratio or beta coefficient */
  orBeta?: number;
  /** Risk allele */
  riskAllele?: string;
  /** Study accession */
  studyAccession: string;
  /** PubMed ID */
  pubmedId?: string;
  /** User's genotype */
  userGenotype?: string;
  /** Whether user has risk allele */
  hasRiskAllele?: boolean;
  /** Number of risk allele copies (0, 1, or 2) */
  riskAlleleCopies?: number;
}

export interface TraitAssociation {
  /** Trait name */
  trait: string;
  /** Normalized trait category */
  category: TraitCategory;
  /** Number of associated variants */
  variantCount: number;
  /** Associated GWAS records */
  associations: GWASAssociation[];
  /** Combined risk score for this trait (0-1) */
  riskScore: number;
  /** Risk interpretation */
  interpretation: 'increased' | 'typical' | 'decreased' | 'unknown';
  /** Confidence level based on study count and effect sizes */
  confidence: 'high' | 'moderate' | 'low';
}

export type TraitCategory =
  | 'disease'
  | 'cardiovascular'
  | 'metabolic'
  | 'neurological'
  | 'autoimmune'
  | 'cancer'
  | 'physical_trait'
  | 'response'
  | 'other';

// ============================================================================
// Polygenic Risk Score Types
// ============================================================================

export interface PolygenicRiskScore {
  /** Trait or condition */
  trait: string;
  /** Raw PRS value (sum of weighted effect alleles) */
  rawScore: number;
  /** Z-score (standardized relative to reference population) */
  zScore: number;
  /** Percentile in reference population (0-100) */
  percentile: number;
  /** Risk category */
  riskCategory: 'very_high' | 'high' | 'moderate' | 'average' | 'low' | 'very_low';
  /** Number of variants included in calculation */
  variantsUsed: number;
  /** Number of variants missing from user's data */
  variantsMissing: number;
  /** Coverage percentage */
  coverage: number;
  /** Relative risk compared to average */
  relativeRisk?: number;
  /** Confidence interval if available */
  confidenceInterval?: { lower: number; upper: number };
}

export interface PRSModelInfo {
  /** Model identifier */
  modelId: string;
  /** Trait being scored */
  trait: string;
  /** Number of variants in model */
  variantCount: number;
  /** Reference population */
  referencePopulation: string;
  /** Model source/publication */
  source: string;
  /** Model validation metrics */
  validation?: {
    auc?: number;
    r2?: number;
    sampleSize?: number;
  };
}

// ============================================================================
// Enhanced Analysis Result Types
// ============================================================================

export interface EnhancedAnalysisResult {
  /** Genome identifier */
  genomeId: string;
  /** Analysis timestamp */
  analyzedAt: Date;
  /** Risk assessments from ClinVar */
  riskAssessments: RiskAssessment[];
  /** Metabolizer phenotypes from PharmGKB */
  metabolizerPhenotypes: EnhancedMetabolizerPhenotype[];
  /** Carrier statuses for recessive conditions */
  carrierStatuses: EnhancedCarrierStatus[];
  /** GWAS trait associations */
  traitAssociations: TraitAssociation[];
  /** Polygenic risk scores */
  polygenicRiskScores: PolygenicRiskScore[];
  /** Analysis summary */
  summary: EnhancedAnalysisSummary;
  /** Database versions used */
  databaseVersions: {
    clinvar?: string;
    pharmgkb?: string;
    gwas?: string;
  };
}

export interface RiskAssessment {
  /** Condition name */
  condition: string;
  /** Gene symbol */
  gene: string;
  /** Risk level */
  riskLevel: RiskLevel;
  /** Confidence score (0-1) */
  confidence: number;
  /** Contributing variants */
  variants: AnnotatedSNP[];
  /** Human-readable explanation */
  explanation: string;
  /** Inheritance pattern if known */
  inheritance?: 'autosomal_dominant' | 'autosomal_recessive' | 'x_linked' | 'complex';
  /** OMIM ID if available */
  omimId?: string;
}

export interface EnhancedMetabolizerPhenotype {
  /** Gene symbol */
  gene: string;
  /** Diplotype (e.g., "*1/*2") */
  diplotype?: string;
  /** Phenotype classification */
  phenotype: MetabolizerStatus;
  /** Activity score if applicable */
  activityScore?: number;
  /** Affected drugs with dosing recommendations */
  affectedDrugs: DrugRecommendation[];
  /** CPIC guideline status */
  cpicStatus?: 'available' | 'in_progress' | 'not_available';
  /** Key variants contributing to phenotype */
  contributingVariants: string[];
}

export type MetabolizerStatus =
  | 'ultrarapid'
  | 'rapid'
  | 'normal'
  | 'intermediate'
  | 'poor'
  | 'unknown';

export interface DrugRecommendation {
  /** Drug name */
  drugName: string;
  /** Generic name */
  genericName?: string;
  /** Recommendation text */
  recommendation: string;
  /** Severity of interaction */
  severity: 'critical' | 'moderate' | 'informational';
  /** Evidence level (1A, 1B, 2A, 2B, 3, 4) */
  evidenceLevel: string;
  /** Has FDA label */
  hasFDALabel: boolean;
  /** CPIC recommendation strength */
  cpicLevel?: string;
  /** Therapeutic category */
  therapeuticCategory?: string;
}

export interface EnhancedCarrierStatus {
  /** Gene symbol */
  gene: string;
  /** Condition name */
  condition: string;
  /** Inheritance pattern */
  inheritance: 'autosomal_recessive' | 'x_linked' | 'mitochondrial';
  /** Carrier type */
  carrierType: 'heterozygous' | 'compound_heterozygous' | 'x_linked_female';
  /** Risk if partner is also carrier */
  partnerRisk: string;
  /** Condition frequency in general population */
  populationFrequency?: number;
  /** ClinVar variant accession */
  variantAccession?: string;
  /** OMIM ID */
  omimId?: string;
}

export interface EnhancedAnalysisSummary {
  /** Total variants analyzed */
  totalVariantsAnalyzed: number;
  /** Pathogenic/likely pathogenic variants */
  pathogenicCount: number;
  /** High risk conditions */
  highRiskCount: number;
  /** Moderate risk conditions */
  moderateRiskCount: number;
  /** Pharmacogenomic genes with actionable findings */
  pharmacogeneCount: number;
  /** Carrier statuses identified */
  carrierCount: number;
  /** GWAS traits with associations */
  traitAssociationCount: number;
  /** Polygenic risk scores calculated */
  prsCount: number;
  /** Key findings for quick review */
  keyFindings: KeyFinding[];
}

export interface KeyFinding {
  /** Finding type */
  type: 'pathogenic' | 'drug' | 'carrier' | 'trait' | 'prs';
  /** Priority for display */
  priority: 'urgent' | 'important' | 'informational';
  /** Short title */
  title: string;
  /** Description */
  description: string;
  /** Related gene or trait */
  relatedItem: string;
}
