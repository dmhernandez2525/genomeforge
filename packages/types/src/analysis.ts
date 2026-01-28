/**
 * Analysis and database-related type definitions
 * @packageDocumentation
 */

import type { SNP } from './genome';

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
}
