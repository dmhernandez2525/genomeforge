/**
 * Report generation module
 *
 * Provides report generation capabilities for GenomeForge.
 * Supports multiple report types with customizable templates.
 *
 * @packageDocumentation
 */

export {
  ReportGenerator,
  renderTemplate,
  createSummarySection,
  createRiskTableSection,
  createVariantListSection,
  createDrugInteractionSection,
  createRecommendationSection
} from './generator';
