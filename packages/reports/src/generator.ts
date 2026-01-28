/**
 * Report generation engine
 *
 * Generates Markdown reports from analysis results using templates.
 * Supports multiple report types with customizable sections.
 *
 * @packageDocumentation
 */

import type {
  Report,
  ReportType,
  ReportSection,
  ReportMetadata,
  ReportGenerationOptions,
  SectionContent,
  SummaryContent,
  RiskTableContent,
  VariantListContent,
  DrugInteractionContent,
  RecommendationContent,
  TechnicalContent
} from '@genomeforge/types';

// Template content (embedded for offline use)
import geneticReportTemplate from './templates/genetic-report.md?raw';
import diseaseRiskTemplate from './templates/disease-risk.md?raw';
import healthProtocolTemplate from './templates/health-protocol.md?raw';
import pharmacogenomicsTemplate from './templates/pharmacogenomics.md?raw';

/**
 * Template registry
 */
const TEMPLATES: Record<ReportType, string> = {
  exhaustive_genetic: geneticReportTemplate,
  disease_risk: diseaseRiskTemplate,
  health_protocol: healthProtocolTemplate,
  pharmacogenomics: pharmacogenomicsTemplate
};

/**
 * Report section order configuration
 */
const SECTION_ORDER: Record<ReportType, string[]> = {
  exhaustive_genetic: [
    'summary',
    'pathogenic_variants',
    'carrier_status',
    'methylation',
    'nutrition',
    'technical'
  ],
  disease_risk: [
    'summary',
    'high_risk',
    'moderate_risk',
    'cardiovascular',
    'cancer',
    'neurological'
  ],
  health_protocol: [
    'summary',
    'high_priority',
    'nutrition',
    'supplements',
    'exercise',
    'lifestyle'
  ],
  pharmacogenomics: [
    'summary',
    'high_impact',
    'cyp2d6',
    'cyp2c19',
    'cyp2c9',
    'all_interactions'
  ]
};

/**
 * Simple Mustache-like template engine
 *
 * Supports:
 * - {{variable}} - Variable substitution
 * - {{#section}}...{{/section}} - Conditional sections
 * - {{^section}}...{{/section}} - Inverted sections (if not exists)
 * - {{#array}}...{{/array}} - Array iteration
 * - {{.}} - Current item in array
 */
export function renderTemplate(template: string, data: Record<string, unknown>): string {
  let result = template;

  // Handle array iterations {{#array}}...{{/array}}
  const arrayPattern = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
  result = result.replace(arrayPattern, (_, key, content) => {
    const value = data[key];
    if (Array.isArray(value)) {
      return value.map(item => {
        if (typeof item === 'object' && item !== null) {
          return renderTemplate(content, item as Record<string, unknown>);
        }
        // Handle simple array items with {{.}}
        return content.replace(/\{\{\.\}\}/g, String(item));
      }).join('');
    }
    if (value && typeof value === 'object') {
      return renderTemplate(content, value as Record<string, unknown>);
    }
    if (value) {
      return renderTemplate(content, data);
    }
    return '';
  });

  // Handle inverted sections {{^section}}...{{/section}}
  const invertedPattern = /\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
  result = result.replace(invertedPattern, (_, key, content) => {
    const value = data[key];
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return content;
    }
    return '';
  });

  // Handle variable substitution {{variable}}
  const varPattern = /\{\{(\w+(?:\.\w+)*)\}\}/g;
  result = result.replace(varPattern, (_, path) => {
    const keys = path.split('.');
    let value: unknown = data;
    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, unknown>)[key];
      } else {
        return '';
      }
    }
    return value !== undefined ? String(value) : '';
  });

  return result;
}

/**
 * Report generator class
 */
export class ReportGenerator {
  /**
   * Generate a complete report
   *
   * @param reportType - Type of report to generate
   * @param sections - Report sections with content
   * @param metadata - Report metadata
   * @param options - Generation options
   * @returns Generated report
   */
  generateReport(
    reportType: ReportType,
    sections: ReportSection[],
    metadata: ReportMetadata,
    options: ReportGenerationOptions = { type: reportType }
  ): Report {
    const reportId = crypto.randomUUID();
    const generatedAt = new Date();

    // Sort sections by order
    const orderedSections = this.orderSections(reportType, sections);

    // Apply max variants limit if specified
    if (options.maxVariantsPerSection) {
      orderedSections.forEach(section => {
        if (section.type === 'variant_list') {
          const content = section.content as VariantListContent;
          content.variants = content.variants.slice(0, options.maxVariantsPerSection);
        }
      });
    }

    return {
      id: reportId,
      type: reportType,
      title: this.getReportTitle(reportType),
      generatedAt,
      genomeId: '', // Will be set by caller
      sections: orderedSections,
      metadata
    };
  }

  /**
   * Render a report to Markdown
   *
   * @param report - Report to render
   * @returns Markdown string
   */
  renderToMarkdown(report: Report): string {
    const template = TEMPLATES[report.type];
    if (!template) {
      throw new Error(`Unknown report type: ${report.type}`);
    }

    // Build template data from sections
    const data: Record<string, unknown> = {
      reportId: report.id,
      generatedAt: report.generatedAt.toISOString(),
      build: report.metadata.buildVersion,
      snpCount: report.metadata.snpCount,
      metadata: report.metadata
    };

    // Add section content to data
    for (const section of report.sections) {
      const sectionData = this.sectionToTemplateData(section);
      Object.assign(data, sectionData);
    }

    return renderTemplate(template, data);
  }

  /**
   * Convert section content to template-compatible data
   */
  private sectionToTemplateData(section: ReportSection): Record<string, unknown> {
    const content = section.content;

    switch (content.type) {
      case 'summary':
        return {
          summary: {
            text: (content as SummaryContent).text,
            highlights: (content as SummaryContent).highlights
          },
          highlights: (content as SummaryContent).highlights
        };

      case 'risk_table':
        return {
          [section.id]: {
            rows: (content as RiskTableContent).rows
          }
        };

      case 'variant_list':
        return {
          [section.id]: {
            category: (content as VariantListContent).category,
            rows: (content as VariantListContent).variants
          }
        };

      case 'drug_interactions':
        return {
          [section.id]: {
            gene: (content as DrugInteractionContent).gene,
            phenotype: (content as DrugInteractionContent).phenotype,
            rows: (content as DrugInteractionContent).interactions
          }
        };

      case 'recommendations':
        return {
          [section.id]: {
            category: (content as RecommendationContent).category,
            items: (content as RecommendationContent).items
          }
        };

      case 'technical':
        return {
          technical: {
            details: (content as TechnicalContent).details
          }
        };

      default:
        return {};
    }
  }

  /**
   * Order sections according to report type configuration
   */
  private orderSections(reportType: ReportType, sections: ReportSection[]): ReportSection[] {
    const order = SECTION_ORDER[reportType] || [];
    const sectionMap = new Map(sections.map(s => [s.id, s]));

    const ordered: ReportSection[] = [];

    // Add sections in configured order
    for (const sectionId of order) {
      const section = sectionMap.get(sectionId);
      if (section) {
        ordered.push(section);
        sectionMap.delete(sectionId);
      }
    }

    // Add remaining sections
    for (const section of sectionMap.values()) {
      ordered.push(section);
    }

    // Update order property
    return ordered.map((section, index) => ({
      ...section,
      order: index
    }));
  }

  /**
   * Get human-readable report title
   */
  private getReportTitle(reportType: ReportType): string {
    const titles: Record<ReportType, string> = {
      exhaustive_genetic: 'Exhaustive Genetic Analysis Report',
      disease_risk: 'Disease Risk Report',
      health_protocol: 'Actionable Health Protocol',
      pharmacogenomics: 'Pharmacogenomics Report'
    };
    return titles[reportType];
  }
}

/**
 * Create a summary section
 */
export function createSummarySection(
  id: string,
  title: string,
  text: string,
  highlights: string[]
): ReportSection {
  return {
    id,
    title,
    type: 'summary',
    content: {
      type: 'summary',
      text,
      highlights
    },
    order: 0
  };
}

/**
 * Create a risk table section
 */
export function createRiskTableSection(
  id: string,
  title: string,
  rows: RiskTableContent['rows']
): ReportSection {
  return {
    id,
    title,
    type: 'risk_table',
    content: {
      type: 'risk_table',
      rows
    },
    order: 0
  };
}

/**
 * Create a variant list section
 */
export function createVariantListSection(
  id: string,
  title: string,
  category: string,
  variants: VariantListContent['variants']
): ReportSection {
  return {
    id,
    title,
    type: 'variant_list',
    content: {
      type: 'variant_list',
      category,
      variants
    },
    order: 0
  };
}

/**
 * Create a drug interactions section
 */
export function createDrugInteractionSection(
  id: string,
  title: string,
  gene: string,
  phenotype: string,
  interactions: DrugInteractionContent['interactions']
): ReportSection {
  return {
    id,
    title,
    type: 'drug_interactions',
    content: {
      type: 'drug_interactions',
      gene,
      phenotype,
      interactions
    },
    order: 0
  };
}

/**
 * Create a recommendations section
 */
export function createRecommendationSection(
  id: string,
  title: string,
  category: string,
  items: RecommendationContent['items']
): ReportSection {
  return {
    id,
    title,
    type: 'recommendations',
    content: {
      type: 'recommendations',
      category,
      items
    },
    order: 0
  };
}
