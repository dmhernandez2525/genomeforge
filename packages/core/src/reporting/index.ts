/**
 * Advanced Reporting Module
 *
 * Generate comprehensive genetic analysis reports.
 *
 * Note: Some types are intentionally not re-exported to avoid conflicts
 * with the reporter and analyzer modules. Import directly from ./types if needed.
 */

// Types - only export unique types that don't conflict
export type {
  ReportType as AdvancedReportType,
  ReportFormat,
  ReportSectionType,
  ChartType,
  ColorScheme,
  ReportConfig,
  ReportColors,
  ReportSectionConfig,
  ReportData,
  ReportSubject,
  ReportAnalysisInfo,
  ReportSummary,
  ClinicalSignificance,
  RiskLevel,
  EvidenceLevel,
  ChartData,
  ChartSeries,
  ChartOptions,
  GeneratedReport,
  ReportContent,
  RenderedSection,
  TocEntry,
  ReportTemplate,
  ReportGenerationOptions as AdvancedReportOptions,
  ReportEventType,
  ReportEvent,
  ReportEventListener,
  // Note: MetabolizerPhenotype, TraitAssociation, TraitCategory are in analyzer
  // Note: ClinicalFinding, DrugResponse, RiskFactor, Recommendation, AncestryInfo, Reference also exported but may conflict
} from './types';

export * from './templates';
export * from './charts';

// Generator - renamed to avoid conflict with reporter
export {
  ReportGenerator as AdvancedReportGenerator,
  getReportGenerator as getAdvancedReportGenerator,
} from './generator';

// Export functions - using actual names from export.ts
export {
  exportToHtml,
  exportToMarkdown,
  exportToJson,
  exportToDocx,
  exportReport,
  // Note: formatFileSize excluded to avoid conflict with batch/utils
} from './export';
