/**
 * Report Templates
 *
 * Predefined templates for different report types.
 */

import type {
  ReportTemplate,
  ReportConfig,
  ReportSectionConfig,
  ReportColors,
  ColorScheme,
} from './types';

/**
 * Default color schemes
 */
export const COLOR_SCHEMES: Record<ColorScheme, ReportColors> = {
  clinical: {
    primary: '#1e40af',
    secondary: '#475569',
    accent: '#0d9488',
    success: '#16a34a',
    warning: '#d97706',
    danger: '#dc2626',
    info: '#0284c7',
    text: '#1e293b',
    textLight: '#64748b',
    background: '#ffffff',
    border: '#e2e8f0',
  },
  modern: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#ec4899',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    text: '#111827',
    textLight: '#6b7280',
    background: '#ffffff',
    border: '#e5e7eb',
  },
  accessible: {
    primary: '#003366',
    secondary: '#333333',
    accent: '#006600',
    success: '#006600',
    warning: '#996600',
    danger: '#990000',
    info: '#003366',
    text: '#000000',
    textLight: '#333333',
    background: '#ffffff',
    border: '#666666',
  },
  monochrome: {
    primary: '#374151',
    secondary: '#4b5563',
    accent: '#6b7280',
    success: '#374151',
    warning: '#4b5563',
    danger: '#1f2937',
    info: '#6b7280',
    text: '#111827',
    textLight: '#6b7280',
    background: '#ffffff',
    border: '#d1d5db',
  },
  custom: {
    primary: '#3b82f6',
    secondary: '#64748b',
    accent: '#8b5cf6',
    success: '#22c55e',
    warning: '#eab308',
    danger: '#ef4444',
    info: '#06b6d4',
    text: '#0f172a',
    textLight: '#64748b',
    background: '#ffffff',
    border: '#e2e8f0',
  },
};

/**
 * Default section configurations
 */
const DEFAULT_SECTIONS: Record<string, Omit<ReportSectionConfig, 'order'>> = {
  header: {
    type: 'header',
    title: 'Genetic Analysis Report',
    enabled: true,
  },
  summary: {
    type: 'summary',
    title: 'Executive Summary',
    enabled: true,
  },
  clinical_findings: {
    type: 'clinical_findings',
    title: 'Clinical Findings',
    subtitle: 'Variants with medical significance',
    enabled: true,
  },
  drug_responses: {
    type: 'drug_responses',
    title: 'Pharmacogenomic Results',
    subtitle: 'Drug metabolism and response',
    enabled: true,
  },
  trait_associations: {
    type: 'trait_associations',
    title: 'Trait Associations',
    subtitle: 'Genetic predispositions',
    enabled: true,
  },
  ancestry: {
    type: 'ancestry',
    title: 'Ancestry Analysis',
    enabled: true,
  },
  risk_factors: {
    type: 'risk_factors',
    title: 'Health Risk Factors',
    enabled: true,
  },
  recommendations: {
    type: 'recommendations',
    title: 'Recommendations',
    subtitle: 'Suggested actions based on findings',
    enabled: true,
  },
  methodology: {
    type: 'methodology',
    title: 'Methodology',
    subtitle: 'Analysis methods and databases used',
    enabled: true,
  },
  limitations: {
    type: 'limitations',
    title: 'Limitations & Disclaimers',
    enabled: true,
  },
  references: {
    type: 'references',
    title: 'References',
    enabled: true,
  },
  appendix: {
    type: 'appendix',
    title: 'Appendix',
    subtitle: 'Additional data and variant details',
    enabled: false,
  },
};

/**
 * Create sections with order
 */
function createSections(
  sectionKeys: string[],
  overrides: Partial<Record<string, Partial<ReportSectionConfig>>> = {}
): ReportSectionConfig[] {
  return sectionKeys.map((key, index) => {
    const base = DEFAULT_SECTIONS[key];
    if (!base) {
      throw new Error(`Unknown section: ${key}`);
    }
    const override = overrides[key] || {};
    return {
      ...base,
      ...override,
      order: index * 10,
    };
  });
}

/**
 * Clinical Report Template
 * Designed for healthcare providers with comprehensive medical information
 */
export const CLINICAL_REPORT_TEMPLATE: ReportTemplate = {
  id: 'clinical',
  name: 'Clinical Report',
  description: 'Comprehensive report for healthcare providers with detailed clinical findings',
  type: 'clinical',
  isSystem: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  config: {
    type: 'clinical',
    title: 'Clinical Genetic Analysis Report',
    subtitle: 'Comprehensive Genomic Evaluation',
    sections: createSections([
      'header',
      'summary',
      'clinical_findings',
      'drug_responses',
      'risk_factors',
      'recommendations',
      'methodology',
      'limitations',
      'references',
      'appendix',
    ], {
      appendix: { enabled: true },
    }),
    colorScheme: 'clinical',
    includeToc: true,
    includePageNumbers: true,
    includeDate: true,
    includeDisclaimers: true,
    language: 'en',
    paperSize: 'letter',
    orientation: 'portrait',
    margins: { top: 1, right: 1, bottom: 1, left: 1 },
  },
};

/**
 * Research Report Template
 * Detailed data for research purposes
 */
export const RESEARCH_REPORT_TEMPLATE: ReportTemplate = {
  id: 'research',
  name: 'Research Report',
  description: 'Detailed report with raw data for research purposes',
  type: 'research',
  isSystem: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  config: {
    type: 'research',
    title: 'Genomic Analysis Research Report',
    sections: createSections([
      'header',
      'summary',
      'clinical_findings',
      'drug_responses',
      'trait_associations',
      'ancestry',
      'risk_factors',
      'methodology',
      'references',
      'appendix',
    ], {
      appendix: { enabled: true },
      methodology: {
        options: { includeStatistics: true, includeDatabaseVersions: true },
      },
    }),
    colorScheme: 'modern',
    includeToc: true,
    includePageNumbers: true,
    includeDate: true,
    includeDisclaimers: true,
    language: 'en',
    paperSize: 'a4',
    orientation: 'portrait',
    margins: { top: 1, right: 1, bottom: 1, left: 1 },
  },
};

/**
 * Personal Report Template
 * User-friendly report for consumers
 */
export const PERSONAL_REPORT_TEMPLATE: ReportTemplate = {
  id: 'personal',
  name: 'Personal Report',
  description: 'Easy-to-understand report for personal use',
  type: 'personal',
  isSystem: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  config: {
    type: 'personal',
    title: 'Your Genetic Analysis Report',
    subtitle: 'Understanding Your DNA',
    sections: createSections([
      'header',
      'summary',
      'trait_associations',
      'ancestry',
      'drug_responses',
      'recommendations',
      'limitations',
    ], {
      trait_associations: {
        title: 'Your Genetic Traits',
        subtitle: 'What your DNA says about you',
      },
      drug_responses: {
        title: 'Medication Insights',
        subtitle: 'How you may respond to certain medications',
      },
      recommendations: {
        title: 'What This Means For You',
      },
    }),
    colorScheme: 'modern',
    includeToc: false,
    includePageNumbers: true,
    includeDate: true,
    includeDisclaimers: true,
    language: 'en',
    paperSize: 'letter',
    orientation: 'portrait',
    margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
  },
};

/**
 * Practitioner Report Template
 * HIPAA-compliant report for healthcare practitioners
 */
export const PRACTITIONER_REPORT_TEMPLATE: ReportTemplate = {
  id: 'practitioner',
  name: 'Practitioner Report',
  description: 'HIPAA-compliant report for healthcare practitioners managing patient data',
  type: 'practitioner',
  isSystem: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  config: {
    type: 'practitioner',
    title: 'Patient Genetic Analysis Report',
    subtitle: 'For Healthcare Provider Use Only',
    sections: createSections([
      'header',
      'summary',
      'clinical_findings',
      'drug_responses',
      'risk_factors',
      'recommendations',
      'methodology',
      'limitations',
      'references',
    ], {
      header: {
        options: { includePatientId: true, includeProviderInfo: true },
      },
      clinical_findings: {
        options: { sortBySignificance: true, includeEvidence: true },
      },
    }),
    colorScheme: 'clinical',
    includeToc: true,
    includePageNumbers: true,
    includeDate: true,
    includeDisclaimers: true,
    footerText: 'CONFIDENTIAL - For Healthcare Provider Use Only',
    language: 'en',
    paperSize: 'letter',
    orientation: 'portrait',
    margins: { top: 1, right: 1, bottom: 1, left: 1 },
  },
};

/**
 * Summary Report Template
 * Quick overview with key findings
 */
export const SUMMARY_REPORT_TEMPLATE: ReportTemplate = {
  id: 'summary',
  name: 'Summary Report',
  description: 'Quick overview highlighting key findings',
  type: 'summary',
  isSystem: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  config: {
    type: 'summary',
    title: 'Genetic Analysis Summary',
    sections: createSections([
      'header',
      'summary',
      'recommendations',
      'limitations',
    ], {
      summary: {
        options: { highlightsOnly: true, maxItems: 10 },
      },
    }),
    colorScheme: 'modern',
    includeToc: false,
    includePageNumbers: false,
    includeDate: true,
    includeDisclaimers: true,
    language: 'en',
    paperSize: 'letter',
    orientation: 'portrait',
    margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
  },
};

/**
 * Detailed Report Template
 * Most comprehensive report with all sections
 */
export const DETAILED_REPORT_TEMPLATE: ReportTemplate = {
  id: 'detailed',
  name: 'Detailed Report',
  description: 'Most comprehensive report with all available sections',
  type: 'detailed',
  isSystem: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  config: {
    type: 'detailed',
    title: 'Comprehensive Genetic Analysis Report',
    subtitle: 'Complete Genomic Evaluation',
    sections: createSections([
      'header',
      'summary',
      'clinical_findings',
      'drug_responses',
      'trait_associations',
      'ancestry',
      'risk_factors',
      'recommendations',
      'methodology',
      'limitations',
      'references',
      'appendix',
    ], {
      appendix: { enabled: true },
    }),
    colorScheme: 'clinical',
    includeToc: true,
    includePageNumbers: true,
    includeDate: true,
    includeDisclaimers: true,
    language: 'en',
    paperSize: 'letter',
    orientation: 'portrait',
    margins: { top: 1, right: 1, bottom: 1, left: 1 },
  },
};

/**
 * All system templates
 */
export const SYSTEM_TEMPLATES: ReportTemplate[] = [
  CLINICAL_REPORT_TEMPLATE,
  RESEARCH_REPORT_TEMPLATE,
  PERSONAL_REPORT_TEMPLATE,
  PRACTITIONER_REPORT_TEMPLATE,
  SUMMARY_REPORT_TEMPLATE,
  DETAILED_REPORT_TEMPLATE,
];

/**
 * Get template by ID
 */
export function getTemplate(id: string): ReportTemplate | null {
  return SYSTEM_TEMPLATES.find((t) => t.id === id) || null;
}

/**
 * Get all templates
 */
export function getAllTemplates(): ReportTemplate[] {
  return [...SYSTEM_TEMPLATES];
}

/**
 * Get color scheme
 */
export function getColorScheme(scheme: ColorScheme): ReportColors {
  return COLOR_SCHEMES[scheme];
}

/**
 * Create custom template from base
 */
export function createCustomTemplate(
  name: string,
  description: string,
  baseTemplate: ReportTemplate,
  configOverrides: Partial<ReportConfig>
): ReportTemplate {
  const now = new Date().toISOString();
  return {
    id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    name,
    description,
    type: 'custom',
    isSystem: false,
    createdAt: now,
    updatedAt: now,
    config: {
      ...baseTemplate.config,
      ...configOverrides,
      type: 'custom',
      sections: configOverrides.sections || baseTemplate.config.sections,
    },
  };
}

/**
 * Get default configuration for a report type
 */
export function getDefaultConfig(type: string): ReportConfig {
  const template = getTemplate(type);
  if (template) {
    return { ...template.config };
  }
  return { ...PERSONAL_REPORT_TEMPLATE.config, type: 'custom' };
}
