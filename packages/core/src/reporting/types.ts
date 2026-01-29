/**
 * Advanced Reporting Types
 *
 * Type definitions for comprehensive genetic report generation.
 */

/**
 * Report types
 */
export type ReportType =
  | 'clinical'
  | 'research'
  | 'personal'
  | 'practitioner'
  | 'summary'
  | 'detailed'
  | 'custom';

/**
 * Report format for export
 */
export type ReportFormat = 'pdf' | 'html' | 'json' | 'markdown' | 'docx';

/**
 * Report section types
 */
export type ReportSectionType =
  | 'header'
  | 'summary'
  | 'clinical_findings'
  | 'drug_responses'
  | 'trait_associations'
  | 'ancestry'
  | 'risk_factors'
  | 'recommendations'
  | 'methodology'
  | 'limitations'
  | 'references'
  | 'appendix'
  | 'custom';

/**
 * Chart types for visualizations
 */
export type ChartType =
  | 'bar'
  | 'pie'
  | 'line'
  | 'scatter'
  | 'heatmap'
  | 'donut'
  | 'radar'
  | 'treemap';

/**
 * Color scheme for reports
 */
export type ColorScheme = 'clinical' | 'modern' | 'accessible' | 'monochrome' | 'custom';

/**
 * Report configuration
 */
export interface ReportConfig {
  /** Report type */
  type: ReportType;
  /** Report title */
  title: string;
  /** Report subtitle */
  subtitle?: string;
  /** Report description */
  description?: string;
  /** Sections to include */
  sections: ReportSectionConfig[];
  /** Color scheme */
  colorScheme: ColorScheme;
  /** Custom colors (if colorScheme is 'custom') */
  customColors?: ReportColors;
  /** Include table of contents */
  includeToc: boolean;
  /** Include page numbers */
  includePageNumbers: boolean;
  /** Include generation date */
  includeDate: boolean;
  /** Include disclaimers */
  includeDisclaimers: boolean;
  /** Custom logo URL or base64 */
  logo?: string;
  /** Footer text */
  footerText?: string;
  /** Language code */
  language: string;
  /** Paper size */
  paperSize: 'letter' | 'a4' | 'legal';
  /** Orientation */
  orientation: 'portrait' | 'landscape';
  /** Margins in inches */
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * Report colors
 */
export interface ReportColors {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  text: string;
  textLight: string;
  background: string;
  border: string;
}

/**
 * Report section configuration
 */
export interface ReportSectionConfig {
  /** Section type */
  type: ReportSectionType;
  /** Custom section ID (for custom sections) */
  id?: string;
  /** Section title */
  title: string;
  /** Section subtitle */
  subtitle?: string;
  /** Whether section is enabled */
  enabled: boolean;
  /** Section order (lower = first) */
  order: number;
  /** Section-specific options */
  options?: Record<string, unknown>;
  /** Custom content (for custom sections) */
  customContent?: string;
}

/**
 * Report data input
 */
export interface ReportData {
  /** Patient/User information */
  subject?: ReportSubject;
  /** Analysis information */
  analysis: ReportAnalysisInfo;
  /** Findings summary */
  summary: ReportSummary;
  /** Clinical findings */
  clinicalFindings: ClinicalFinding[];
  /** Drug responses */
  drugResponses: DrugResponse[];
  /** Trait associations */
  traitAssociations: TraitAssociation[];
  /** Risk factors */
  riskFactors: RiskFactor[];
  /** Recommendations */
  recommendations: Recommendation[];
  /** Ancestry information */
  ancestry?: AncestryInfo;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Report subject (patient/user) information
 */
export interface ReportSubject {
  /** Subject ID */
  id?: string;
  /** Name (optional, privacy-sensitive) */
  name?: string;
  /** Date of birth */
  dateOfBirth?: string;
  /** Sex */
  sex?: 'male' | 'female' | 'other' | 'unknown';
  /** Ethnicity */
  ethnicity?: string;
  /** Additional demographics */
  demographics?: Record<string, string>;
}

/**
 * Analysis information
 */
export interface ReportAnalysisInfo {
  /** Analysis ID */
  analysisId: string;
  /** Analysis date */
  date: string;
  /** File format */
  fileFormat: string;
  /** Genome build */
  genomeBuild: string;
  /** Total variants analyzed */
  totalVariants: number;
  /** Quality score */
  qualityScore?: number;
  /** Call rate */
  callRate?: number;
  /** Databases used */
  databasesUsed: string[];
  /** Analysis version */
  analysisVersion: string;
}

/**
 * Report summary
 */
export interface ReportSummary {
  /** Total findings */
  totalFindings: number;
  /** Clinical findings count */
  clinicalFindingsCount: number;
  /** High-priority findings count */
  highPriorityCount: number;
  /** Drug responses count */
  drugResponsesCount: number;
  /** Trait associations count */
  traitAssociationsCount: number;
  /** Actionable findings count */
  actionableCount: number;
  /** Key highlights */
  highlights: string[];
}

/**
 * Clinical finding
 */
export interface ClinicalFinding {
  /** Finding ID */
  id: string;
  /** RS ID */
  rsid: string;
  /** Gene */
  gene?: string;
  /** Condition */
  condition: string;
  /** Clinical significance */
  significance: ClinicalSignificance;
  /** Inheritance pattern */
  inheritance?: string;
  /** Genotype */
  genotype: string;
  /** Risk level */
  riskLevel: RiskLevel;
  /** Description */
  description: string;
  /** Recommendations */
  recommendations?: string[];
  /** Evidence level */
  evidenceLevel: EvidenceLevel;
  /** Source */
  source: string;
  /** References */
  references?: Reference[];
}

/**
 * Clinical significance
 */
export type ClinicalSignificance =
  | 'pathogenic'
  | 'likely_pathogenic'
  | 'uncertain_significance'
  | 'likely_benign'
  | 'benign'
  | 'risk_factor'
  | 'protective'
  | 'drug_response';

/**
 * Risk level
 */
export type RiskLevel = 'high' | 'moderate' | 'low' | 'protective' | 'unknown';

/**
 * Evidence level
 */
export type EvidenceLevel = '1A' | '1B' | '2A' | '2B' | '3' | '4' | 'expert_opinion' | 'unknown';

/**
 * Drug response
 */
export interface DrugResponse {
  /** Response ID */
  id: string;
  /** RS ID */
  rsid: string;
  /** Gene */
  gene: string;
  /** Genotype */
  genotype: string;
  /** Drug name */
  drugName: string;
  /** Drug class */
  drugClass?: string;
  /** Phenotype */
  phenotype: MetabolizerPhenotype;
  /** Recommendation */
  recommendation: string;
  /** Clinical action */
  clinicalAction?: string;
  /** Dosing guidance */
  dosingGuidance?: string;
  /** Evidence level */
  evidenceLevel: EvidenceLevel;
  /** Guideline source */
  guidelineSource?: string;
  /** References */
  references?: Reference[];
}

/**
 * Metabolizer phenotype
 */
export type MetabolizerPhenotype =
  | 'poor_metabolizer'
  | 'intermediate_metabolizer'
  | 'normal_metabolizer'
  | 'rapid_metabolizer'
  | 'ultrarapid_metabolizer'
  | 'indeterminate';

/**
 * Trait association
 */
export interface TraitAssociation {
  /** Association ID */
  id: string;
  /** RS ID */
  rsid: string;
  /** Gene */
  gene?: string;
  /** Genotype */
  genotype: string;
  /** Trait name */
  traitName: string;
  /** Trait category */
  category: TraitCategory;
  /** Effect description */
  effect: string;
  /** Effect direction */
  effectDirection: 'increased' | 'decreased' | 'associated' | 'unknown';
  /** Effect size (odds ratio, beta, etc.) */
  effectSize?: number;
  /** Confidence level */
  confidence: 'high' | 'moderate' | 'low';
  /** Population */
  population?: string;
  /** References */
  references?: Reference[];
}

/**
 * Trait category
 */
export type TraitCategory =
  | 'physical'
  | 'metabolic'
  | 'cognitive'
  | 'behavioral'
  | 'nutritional'
  | 'athletic'
  | 'longevity'
  | 'other';

/**
 * Risk factor
 */
export interface RiskFactor {
  /** Risk factor ID */
  id: string;
  /** Condition/disease */
  condition: string;
  /** Category */
  category: string;
  /** Contributing variants */
  variants: {
    rsid: string;
    gene?: string;
    genotype: string;
    contribution: 'increases' | 'decreases' | 'modifies';
  }[];
  /** Overall risk level */
  overallRisk: RiskLevel;
  /** Relative risk (if available) */
  relativeRisk?: number;
  /** Population risk comparison */
  populationComparison?: string;
  /** Modifiable factors */
  modifiableFactors?: string[];
  /** Recommendations */
  recommendations?: string[];
}

/**
 * Recommendation
 */
export interface Recommendation {
  /** Recommendation ID */
  id: string;
  /** Title */
  title: string;
  /** Description */
  description: string;
  /** Category */
  category: RecommendationCategory;
  /** Priority */
  priority: 'high' | 'medium' | 'low';
  /** Action type */
  actionType: 'screening' | 'lifestyle' | 'medication' | 'consultation' | 'monitoring' | 'other';
  /** Related findings */
  relatedFindings: string[];
  /** Evidence level */
  evidenceLevel?: EvidenceLevel;
}

/**
 * Recommendation category
 */
export type RecommendationCategory =
  | 'medical'
  | 'lifestyle'
  | 'dietary'
  | 'exercise'
  | 'screening'
  | 'medication'
  | 'family_planning'
  | 'other';

/**
 * Ancestry information
 */
export interface AncestryInfo {
  /** Population breakdown */
  populations: {
    population: string;
    percentage: number;
    confidence: number;
  }[];
  /** Maternal haplogroup */
  maternalHaplogroup?: string;
  /** Paternal haplogroup */
  paternalHaplogroup?: string;
  /** Neanderthal percentage */
  neanderthalPercentage?: number;
}

/**
 * Reference
 */
export interface Reference {
  /** Reference ID (e.g., PMID) */
  id: string;
  /** Reference type */
  type: 'pubmed' | 'doi' | 'url' | 'other';
  /** Title */
  title?: string;
  /** Authors */
  authors?: string;
  /** Journal */
  journal?: string;
  /** Year */
  year?: number;
  /** URL */
  url?: string;
}

/**
 * Chart data structure
 */
export interface ChartData {
  /** Chart ID */
  id: string;
  /** Chart type */
  type: ChartType;
  /** Chart title */
  title: string;
  /** Chart subtitle */
  subtitle?: string;
  /** Labels */
  labels: string[];
  /** Data series */
  series: ChartSeries[];
  /** Chart options */
  options?: ChartOptions;
}

/**
 * Chart series
 */
export interface ChartSeries {
  /** Series name */
  name: string;
  /** Data values */
  data: number[];
  /** Series color */
  color?: string;
}

/**
 * Chart options
 */
export interface ChartOptions {
  /** Show legend */
  showLegend?: boolean;
  /** Legend position */
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  /** Show data labels */
  showDataLabels?: boolean;
  /** Show grid */
  showGrid?: boolean;
  /** Axis labels */
  xAxisLabel?: string;
  yAxisLabel?: string;
  /** Stacked (for bar charts) */
  stacked?: boolean;
  /** Animation enabled */
  animation?: boolean;
}

/**
 * Generated report
 */
export interface GeneratedReport {
  /** Report ID */
  id: string;
  /** Configuration used */
  config: ReportConfig;
  /** Generated content */
  content: ReportContent;
  /** Generation timestamp */
  generatedAt: string;
  /** Generation duration in milliseconds */
  generationDuration: number;
  /** Warnings during generation */
  warnings: string[];
}

/**
 * Report content
 */
export interface ReportContent {
  /** Rendered sections */
  sections: RenderedSection[];
  /** Charts data */
  charts: ChartData[];
  /** Table of contents */
  tableOfContents?: TocEntry[];
  /** Total pages (for PDF) */
  totalPages?: number;
}

/**
 * Rendered section
 */
export interface RenderedSection {
  /** Section ID */
  id: string;
  /** Section type */
  type: ReportSectionType;
  /** Section title */
  title: string;
  /** HTML content */
  html: string;
  /** Markdown content */
  markdown: string;
  /** Page number (for PDF) */
  pageNumber?: number;
}

/**
 * Table of contents entry
 */
export interface TocEntry {
  /** Entry title */
  title: string;
  /** Section ID */
  sectionId: string;
  /** Page number */
  pageNumber: number;
  /** Nesting level */
  level: number;
}

/**
 * Report template
 */
export interface ReportTemplate {
  /** Template ID */
  id: string;
  /** Template name */
  name: string;
  /** Description */
  description: string;
  /** Report type */
  type: ReportType;
  /** Template configuration */
  config: ReportConfig;
  /** Is system template */
  isSystem: boolean;
  /** Created at */
  createdAt: string;
  /** Updated at */
  updatedAt: string;
}

/**
 * Report generation options
 */
export interface ReportGenerationOptions {
  /** Output format */
  format: ReportFormat;
  /** Template to use */
  template?: string | ReportTemplate;
  /** Configuration overrides */
  configOverrides?: Partial<ReportConfig>;
  /** Include raw data */
  includeRawData?: boolean;
  /** Compress output */
  compress?: boolean;
  /** Watermark text */
  watermark?: string;
  /** Password protection (for PDF) */
  password?: string;
}

/**
 * Report event types
 */
export type ReportEventType =
  | 'generation_started'
  | 'section_rendered'
  | 'chart_generated'
  | 'generation_completed'
  | 'generation_failed'
  | 'export_started'
  | 'export_completed';

/**
 * Report event
 */
export interface ReportEvent {
  /** Event type */
  type: ReportEventType;
  /** Report ID */
  reportId: string;
  /** Timestamp */
  timestamp: string;
  /** Event data */
  data?: Record<string, unknown>;
}

/**
 * Report event listener
 */
export type ReportEventListener = (event: ReportEvent) => void;
