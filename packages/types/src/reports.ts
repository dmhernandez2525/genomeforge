/**
 * Report generation type definitions
 * @packageDocumentation
 */

export type ReportType =
  | 'exhaustive_genetic'
  | 'disease_risk'
  | 'health_protocol'
  | 'pharmacogenomics';

export type RiskLevel = 'high' | 'moderate' | 'low' | 'unknown';

/**
 * Complete report structure
 */
export interface Report {
  /** Unique identifier */
  id: string;
  /** Report type */
  type: ReportType;
  /** Report title */
  title: string;
  /** Generation timestamp */
  generatedAt: Date;
  /** Associated genome ID */
  genomeId: string;
  /** Report sections */
  sections: ReportSection[];
  /** Report metadata */
  metadata: ReportMetadata;
}

export interface ReportSection {
  /** Section ID */
  id: string;
  /** Section title */
  title: string;
  /** Section type */
  type: SectionType;
  /** Section content */
  content: SectionContent;
  /** Display order */
  order: number;
}

export type SectionType =
  | 'summary'
  | 'risk_table'
  | 'variant_list'
  | 'drug_interactions'
  | 'recommendations'
  | 'technical';

export type SectionContent =
  | SummaryContent
  | RiskTableContent
  | VariantListContent
  | DrugInteractionContent
  | RecommendationContent
  | TechnicalContent;

// ============================================================================
// Section Content Types
// ============================================================================

export interface SummaryContent {
  type: 'summary';
  /** Summary text */
  text: string;
  /** Key highlights */
  highlights: string[];
}

export interface RiskTableContent {
  type: 'risk_table';
  /** Table rows */
  rows: RiskRow[];
}

export interface RiskRow {
  /** Condition name */
  condition: string;
  /** Gene symbol */
  gene: string;
  /** Risk level */
  riskLevel: RiskLevel;
  /** Confidence (0-4 stars) */
  confidence: number;
  /** Additional notes */
  notes: string;
}

export interface VariantListContent {
  type: 'variant_list';
  /** Category label */
  category: string;
  /** Variant entries */
  variants: VariantEntry[];
}

export interface VariantEntry {
  /** rsID */
  rsid: string;
  /** Gene symbol */
  gene: string;
  /** User's genotype */
  genotype: string;
  /** Clinical significance */
  significance: string;
  /** Associated condition */
  condition: string;
  /** ClinVar star rating */
  stars: number;
  /** Impact score */
  impact: number;
}

export interface DrugInteractionContent {
  type: 'drug_interactions';
  /** Gene symbol */
  gene: string;
  /** Metabolizer phenotype */
  phenotype: string;
  /** Drug interactions */
  interactions: DrugEntry[];
}

export interface DrugEntry {
  /** Drug name */
  drugName: string;
  /** Dosing recommendation */
  recommendation: string;
  /** Severity level */
  severity: RiskLevel;
  /** Evidence level */
  evidenceLevel: string;
  /** Has FDA label */
  hasFDALabel: boolean;
}

export interface RecommendationContent {
  type: 'recommendations';
  /** Category (nutrition, lifestyle, etc.) */
  category: string;
  /** Recommendation items */
  items: RecommendationItem[];
}

export interface RecommendationItem {
  /** Recommendation text */
  recommendation: string;
  /** Scientific rationale */
  rationale: string;
  /** Related genes */
  relatedGenes: string[];
  /** Priority level */
  priority: 'high' | 'medium' | 'low';
}

export interface TechnicalContent {
  type: 'technical';
  /** Technical details */
  details: TechnicalDetail[];
}

export interface TechnicalDetail {
  /** Label */
  label: string;
  /** Value */
  value: string;
}

// ============================================================================
// Report Metadata
// ============================================================================

export interface ReportMetadata {
  /** Total SNPs analyzed */
  snpCount: number;
  /** SNPs matched to databases */
  matchedCount: number;
  /** Genome build version */
  buildVersion: string;
  /** Database versions */
  databaseVersions: {
    clinvar: string;
    pharmgkb: string;
  };
}

// ============================================================================
// Report Generation Options
// ============================================================================

export interface ReportGenerationOptions {
  /** Report type to generate */
  type: ReportType;
  /** Custom filename */
  filename?: string;
  /** Include technical appendix */
  includeTechnical?: boolean;
  /** Maximum variants per section */
  maxVariantsPerSection?: number;
}

// ============================================================================
// Conversation & Settings Types
// ============================================================================

/**
 * AI conversation record
 */
export interface Conversation {
  /** Unique identifier */
  id: string;
  /** Associated genome ID */
  genomeId: string;
  /** Conversation title */
  title: string;
  /** Message history */
  messages: ConversationMessage[];
  /** Creation timestamp */
  createdAt: Date;
  /** Last message timestamp */
  lastMessageAt: Date;
}

export interface ConversationMessage {
  /** Message role */
  role: 'user' | 'assistant' | 'system';
  /** Message content */
  content: string;
  /** Timestamp */
  timestamp: Date;
}

/**
 * Settings key-value pair
 */
export interface Setting {
  /** Setting key */
  key: string;
  /** Setting value (any serializable type) */
  value: unknown;
  /** Is the value encrypted */
  encrypted: boolean;
}
