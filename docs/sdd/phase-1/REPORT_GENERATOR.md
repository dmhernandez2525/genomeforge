# Software Design Document: Report Generator

**Feature:** PDF Report Generation
**Package:** `@genomeforge/reports`
**Phase:** 1 (MVP)
**Status:** Planned

---

## 1. Overview

### 1.1 Purpose
Generate comprehensive, professionally-formatted PDF reports from genetic analysis results. Reports must be understandable by non-experts while providing sufficient detail for healthcare providers.

### 1.2 Scope
- 4 report types: Genetic, Disease Risk, Health Protocol, Pharmacogenomics
- Color-coded risk visualization
- Medical disclaimers
- PDF export using @react-pdf/renderer
- Plain-English summaries with technical appendices

### 1.3 References
- [@react-pdf/renderer](https://react-pdf.org/) - 16K+ stars, MIT license
- Competitor report analysis (Promethease, SelfDecode, StrateGene)
- FDA General Wellness Policy disclaimer requirements

---

## 2. Report Types

### 2.1 Report Overview

| Report | Purpose | Pages | Audience |
|--------|---------|-------|----------|
| **Exhaustive Genetic** | Complete variant analysis | 20-50 | Self, Provider |
| **Disease Risk** | Pathogenic variants, carrier status | 10-20 | Self, Provider |
| **Health Protocol** | Actionable recommendations | 5-10 | Self |
| **Pharmacogenomics** | Drug metabolism, interactions | 10-15 | Self, Provider |

### 2.2 Common Elements

All reports include:
- Cover page with generation date
- Executive summary
- Table of contents
- Medical disclaimer
- Methodology explanation
- References/citations
- Technical appendix (SNP details)

---

## 3. Type Definitions

```typescript
// packages/types/src/reports.ts

export type ReportType =
  | 'exhaustive_genetic'
  | 'disease_risk'
  | 'health_protocol'
  | 'pharmacogenomics';

export type RiskLevel = 'high' | 'moderate' | 'low' | 'unknown';

export interface Report {
  id: string;
  type: ReportType;
  title: string;
  generatedAt: Date;
  genomeId: string;
  sections: ReportSection[];
  metadata: ReportMetadata;
}

export interface ReportSection {
  id: string;
  title: string;
  type: SectionType;
  content: SectionContent;
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

export interface SummaryContent {
  type: 'summary';
  text: string;
  highlights: string[];
}

export interface RiskTableContent {
  type: 'risk_table';
  rows: RiskRow[];
}

export interface RiskRow {
  condition: string;
  gene: string;
  riskLevel: RiskLevel;
  confidence: number; // 0-4 stars
  notes: string;
}

export interface VariantListContent {
  type: 'variant_list';
  category: string;
  variants: VariantEntry[];
}

export interface VariantEntry {
  rsid: string;
  gene: string;
  genotype: string;
  significance: string;
  condition: string;
  stars: number;
  impact: number;
}

export interface DrugInteractionContent {
  type: 'drug_interactions';
  gene: string;
  phenotype: string;
  interactions: DrugEntry[];
}

export interface DrugEntry {
  drugName: string;
  recommendation: string;
  severity: RiskLevel;
  evidenceLevel: string;
  hasFDALabel: boolean;
}

export interface RecommendationContent {
  type: 'recommendations';
  category: string;
  items: RecommendationItem[];
}

export interface RecommendationItem {
  recommendation: string;
  rationale: string;
  relatedGenes: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface ReportMetadata {
  snpCount: number;
  matchedCount: number;
  buildVersion: string;
  databaseVersions: {
    clinvar: string;
    pharmgkb: string;
  };
}
```

---

## 4. Architecture

### 4.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Report Generator                              │
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                  │
│  │  ReportBuilder   │───▶│  SectionFactory  │                  │
│  └──────────────────┘    └──────────────────┘                  │
│           │                      │                              │
│           │                      ▼                              │
│           │              ┌──────────────────┐                  │
│           │              │ Section Builders │                  │
│           │              │ • SummaryBuilder │                  │
│           │              │ • RiskTableBuilder│                 │
│           │              │ • DrugTableBuilder│                 │
│           │              │ • RecommendBuilder│                 │
│           │              └──────────────────┘                  │
│           │                      │                              │
│           ▼                      ▼                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   PDFRenderer                             │   │
│  │  • @react-pdf/renderer components                         │   │
│  │  • Styles and themes                                      │   │
│  │  • Color-coding                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Data Flow

```
MatchResult → ReportBuilder → Section Builders → Report → PDFRenderer → PDF Blob
```

---

## 5. PDF Components

### 5.1 Styles

```typescript
// packages/reports/src/styles.ts

import { StyleSheet } from '@react-pdf/renderer';

export const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.5
  },

  coverPage: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%'
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1a1a2e'
  },

  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#1a1a2e',
    borderBottomWidth: 2,
    borderBottomColor: '#3498db',
    paddingBottom: 5
  },

  paragraph: {
    marginBottom: 10,
    textAlign: 'justify'
  },

  table: {
    display: 'table',
    width: '100%',
    marginVertical: 10
  },

  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },

  tableHeader: {
    backgroundColor: '#f8f9fa',
    fontWeight: 'bold'
  },

  tableCell: {
    padding: 8,
    flex: 1
  },

  // Risk colors
  riskHigh: {
    backgroundColor: '#fee2e2',
    color: '#dc2626'
  },

  riskModerate: {
    backgroundColor: '#fef3c7',
    color: '#d97706'
  },

  riskLow: {
    backgroundColor: '#dcfce7',
    color: '#16a34a'
  },

  riskUnknown: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280'
  },

  disclaimer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 9
  },

  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 9,
    color: '#666',
    textAlign: 'center'
  },

  citation: {
    fontSize: 8,
    color: '#666',
    marginTop: 2
  }
});

// Risk level colors
export const RISK_COLORS: Record<RiskLevel, string> = {
  high: '#dc2626',
  moderate: '#d97706',
  low: '#16a34a',
  unknown: '#6b7280'
};

export const RISK_BG_COLORS: Record<RiskLevel, string> = {
  high: '#fee2e2',
  moderate: '#fef3c7',
  low: '#dcfce7',
  unknown: '#f3f4f6'
};
```

### 5.2 Cover Page Component

```typescript
// packages/reports/src/components/CoverPage.tsx

import { Page, View, Text, Image } from '@react-pdf/renderer';
import { styles } from '../styles';
import { Report } from '@genomeforge/types';

interface CoverPageProps {
  report: Report;
}

export const CoverPage: React.FC<CoverPageProps> = ({ report }) => (
  <Page size="A4" style={styles.page}>
    <View style={styles.coverPage}>
      {/* Logo placeholder */}
      <Text style={{ fontSize: 36, marginBottom: 10 }}>
        GenomeForge
      </Text>

      <Text style={styles.title}>
        {report.title}
      </Text>

      <Text style={styles.subtitle}>
        Generated: {report.generatedAt.toLocaleDateString()}
      </Text>

      <Text style={styles.subtitle}>
        {report.metadata.snpCount.toLocaleString()} variants analyzed
      </Text>

      <View style={{ marginTop: 40 }}>
        <Text style={{ fontSize: 10, color: '#666', textAlign: 'center' }}>
          This report is for informational purposes only.
        </Text>
        <Text style={{ fontSize: 10, color: '#666', textAlign: 'center' }}>
          Not intended for diagnostic or treatment decisions.
        </Text>
      </View>
    </View>
  </Page>
);
```

### 5.3 Risk Table Component

```typescript
// packages/reports/src/components/RiskTable.tsx

import { View, Text } from '@react-pdf/renderer';
import { styles, RISK_COLORS, RISK_BG_COLORS } from '../styles';
import { RiskTableContent, RiskLevel } from '@genomeforge/types';

interface RiskTableProps {
  content: RiskTableContent;
}

const StarRating: React.FC<{ stars: number }> = ({ stars }) => (
  <Text>{'★'.repeat(stars)}{'☆'.repeat(4 - stars)}</Text>
);

const RiskBadge: React.FC<{ level: RiskLevel }> = ({ level }) => (
  <View style={{
    backgroundColor: RISK_BG_COLORS[level],
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4
  }}>
    <Text style={{ color: RISK_COLORS[level], fontSize: 9, fontWeight: 'bold' }}>
      {level.toUpperCase()}
    </Text>
  </View>
);

export const RiskTable: React.FC<RiskTableProps> = ({ content }) => (
  <View style={styles.table}>
    {/* Header */}
    <View style={[styles.tableRow, styles.tableHeader]}>
      <Text style={[styles.tableCell, { flex: 2 }]}>Condition</Text>
      <Text style={[styles.tableCell, { flex: 1 }]}>Gene</Text>
      <Text style={[styles.tableCell, { flex: 1 }]}>Risk</Text>
      <Text style={[styles.tableCell, { flex: 1 }]}>Confidence</Text>
    </View>

    {/* Rows */}
    {content.rows.map((row, i) => (
      <View key={i} style={styles.tableRow}>
        <Text style={[styles.tableCell, { flex: 2 }]}>{row.condition}</Text>
        <Text style={[styles.tableCell, { flex: 1 }]}>{row.gene}</Text>
        <View style={[styles.tableCell, { flex: 1 }]}>
          <RiskBadge level={row.riskLevel} />
        </View>
        <View style={[styles.tableCell, { flex: 1 }]}>
          <StarRating stars={row.confidence} />
        </View>
      </View>
    ))}
  </View>
);
```

### 5.4 Drug Interaction Component

```typescript
// packages/reports/src/components/DrugInteractionTable.tsx

import { View, Text } from '@react-pdf/renderer';
import { styles, RISK_COLORS } from '../styles';
import { DrugInteractionContent } from '@genomeforge/types';

interface DrugInteractionTableProps {
  content: DrugInteractionContent;
}

export const DrugInteractionTable: React.FC<DrugInteractionTableProps> = ({ content }) => (
  <View style={{ marginBottom: 20 }}>
    {/* Gene header */}
    <View style={{
      backgroundColor: '#3498db',
      padding: 10,
      marginBottom: 10
    }}>
      <Text style={{ color: 'white', fontWeight: 'bold' }}>
        {content.gene} - {content.phenotype}
      </Text>
    </View>

    {/* Drug interactions table */}
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeader]}>
        <Text style={[styles.tableCell, { flex: 2 }]}>Drug</Text>
        <Text style={[styles.tableCell, { flex: 3 }]}>Recommendation</Text>
        <Text style={[styles.tableCell, { flex: 1 }]}>Evidence</Text>
      </View>

      {content.interactions.map((drug, i) => (
        <View key={i} style={styles.tableRow}>
          <View style={[styles.tableCell, { flex: 2 }]}>
            <Text style={{ fontWeight: 'bold' }}>{drug.drugName}</Text>
            {drug.hasFDALabel && (
              <Text style={{ fontSize: 8, color: '#666' }}>FDA Label</Text>
            )}
          </View>
          <Text style={[styles.tableCell, { flex: 3 }]}>
            {drug.recommendation}
          </Text>
          <Text style={[styles.tableCell, { flex: 1 }]}>
            Level {drug.evidenceLevel}
          </Text>
        </View>
      ))}
    </View>
  </View>
);
```

### 5.5 Medical Disclaimer Component

```typescript
// packages/reports/src/components/Disclaimer.tsx

import { View, Text } from '@react-pdf/renderer';
import { styles } from '../styles';

export const MedicalDisclaimer: React.FC = () => (
  <View style={styles.disclaimer}>
    <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>
      IMPORTANT MEDICAL DISCLAIMER
    </Text>
    <Text style={{ marginBottom: 5 }}>
      This genetic report is provided for informational and educational purposes only.
      It is NOT intended to diagnose, treat, cure, or prevent any disease or health condition.
    </Text>
    <Text style={{ marginBottom: 5 }}>
      Genetic information represents only one factor in overall health. Your lifestyle,
      environment, medical history, and other factors play significant roles in health outcomes.
    </Text>
    <Text style={{ marginBottom: 5 }}>
      The presence of a genetic variant does not guarantee that a condition will develop,
      and the absence of a variant does not guarantee immunity from a condition.
    </Text>
    <Text style={{ fontWeight: 'bold' }}>
      Always consult qualified healthcare professionals before making any medical decisions,
      including changes to medications, diet, or lifestyle based on genetic information.
    </Text>
  </View>
);

export const PharmacogenomicsDisclaimer: React.FC = () => (
  <View style={styles.disclaimer}>
    <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>
      PHARMACOGENOMICS DISCLAIMER
    </Text>
    <Text style={{ marginBottom: 5 }}>
      Drug response information is based on clinical pharmacogenomics guidelines (CPIC, DPWG)
      and FDA drug labels. However, drug response can be influenced by many factors beyond genetics.
    </Text>
    <Text style={{ fontWeight: 'bold' }}>
      NEVER change your medication regimen without consulting your prescribing physician.
      This report should be shared with and interpreted by qualified healthcare providers.
    </Text>
  </View>
);
```

---

## 6. Report Builder

### 6.1 Main Builder Class

```typescript
// packages/reports/src/builder/ReportBuilder.ts

import { MatchResult, Report, ReportType, ReportSection } from '@genomeforge/types';
import { SectionBuilderFactory } from './SectionBuilderFactory';

export class ReportBuilder {
  private matchResult: MatchResult;
  private type: ReportType;

  constructor(matchResult: MatchResult, type: ReportType) {
    this.matchResult = matchResult;
    this.type = type;
  }

  build(): Report {
    const sections = this.buildSections();

    return {
      id: crypto.randomUUID(),
      type: this.type,
      title: this.getTitle(),
      generatedAt: new Date(),
      genomeId: this.matchResult.genomeId,
      sections,
      metadata: {
        snpCount: this.matchResult.totalSNPs,
        matchedCount: this.matchResult.matchedSNPs,
        buildVersion: this.matchResult.buildVersion,
        databaseVersions: this.matchResult.databaseVersions
      }
    };
  }

  private getTitle(): string {
    const titles: Record<ReportType, string> = {
      exhaustive_genetic: 'Comprehensive Genetic Analysis Report',
      disease_risk: 'Disease Risk Assessment Report',
      health_protocol: 'Personalized Health Protocol',
      pharmacogenomics: 'Pharmacogenomics Report'
    };
    return titles[this.type];
  }

  private buildSections(): ReportSection[] {
    const sectionConfigs = this.getSectionConfigs();

    return sectionConfigs.map((config, index) => {
      const builder = SectionBuilderFactory.create(config.type);
      return {
        id: crypto.randomUUID(),
        title: config.title,
        type: config.type,
        content: builder.build(this.matchResult, config),
        order: index
      };
    });
  }

  private getSectionConfigs(): SectionConfig[] {
    switch (this.type) {
      case 'exhaustive_genetic':
        return [
          { type: 'summary', title: 'Executive Summary' },
          { type: 'risk_table', title: 'Significant Findings', filter: 'pathogenic' },
          { type: 'variant_list', title: 'Drug Metabolism Genes', category: 'pharmacogenes' },
          { type: 'variant_list', title: 'Methylation Pathway', category: 'methylation' },
          { type: 'variant_list', title: 'Nutrition & Vitamins', category: 'nutrition' },
          { type: 'variant_list', title: 'Carrier Status', category: 'carrier' },
          { type: 'technical', title: 'Technical Appendix' }
        ];

      case 'disease_risk':
        return [
          { type: 'summary', title: 'Risk Summary' },
          { type: 'risk_table', title: 'High-Risk Variants', filter: 'high_impact' },
          { type: 'risk_table', title: 'Moderate-Risk Variants', filter: 'moderate_impact' },
          { type: 'variant_list', title: 'Carrier Status', category: 'carrier' },
          { type: 'technical', title: 'Methodology' }
        ];

      case 'health_protocol':
        return [
          { type: 'summary', title: 'Your Personalized Plan' },
          { type: 'recommendations', title: 'Nutrition Recommendations', category: 'nutrition' },
          { type: 'recommendations', title: 'Lifestyle Recommendations', category: 'lifestyle' },
          { type: 'recommendations', title: 'Supplement Considerations', category: 'supplements' },
          { type: 'recommendations', title: 'Exercise Considerations', category: 'exercise' }
        ];

      case 'pharmacogenomics':
        return [
          { type: 'summary', title: 'Drug Response Summary' },
          { type: 'drug_interactions', title: 'Drug-Gene Interactions' },
          { type: 'risk_table', title: 'Metabolizer Status by Gene' },
          { type: 'technical', title: 'Clinical Guidelines Reference' }
        ];

      default:
        return [];
    }
  }
}
```

### 6.2 Section Builders

```typescript
// packages/reports/src/builder/sections/SummaryBuilder.ts

import { MatchResult, SummaryContent } from '@genomeforge/types';

export class SummaryBuilder {
  build(matchResult: MatchResult): SummaryContent {
    const highlights = this.generateHighlights(matchResult);
    const text = this.generateSummaryText(matchResult, highlights);

    return {
      type: 'summary',
      text,
      highlights
    };
  }

  private generateHighlights(result: MatchResult): string[] {
    const highlights: string[] = [];

    if (result.pathogenicCount > 0) {
      highlights.push(
        `${result.pathogenicCount} potentially significant genetic variant${result.pathogenicCount > 1 ? 's' : ''} identified`
      );
    }

    if (result.drugInteractionCount > 0) {
      highlights.push(
        `${result.drugInteractionCount} drug-gene interaction${result.drugInteractionCount > 1 ? 's' : ''} that may affect medication response`
      );
    }

    if (result.carrierCount > 0) {
      highlights.push(
        `Carrier status identified for ${result.carrierCount} condition${result.carrierCount > 1 ? 's' : ''}`
      );
    }

    // Add protective variants
    const protectiveCount = result.annotatedSNPs.filter(s => s.category === 'protective').length;
    if (protectiveCount > 0) {
      highlights.push(
        `${protectiveCount} protective variant${protectiveCount > 1 ? 's' : ''} identified`
      );
    }

    return highlights;
  }

  private generateSummaryText(result: MatchResult, highlights: string[]): string {
    return `This analysis examined ${result.totalSNPs.toLocaleString()} genetic variants from your DNA data. Of these, ${result.matchedSNPs.toLocaleString()} variants were matched against clinical databases including ClinVar (clinical significance) and PharmGKB (drug-gene interactions).

${highlights.length > 0 ? 'Key findings include:\n• ' + highlights.join('\n• ') : 'No significant findings were identified in this analysis.'}

This report should be discussed with a qualified healthcare provider who can consider your complete medical history and other relevant factors when interpreting these results.`;
  }
}
```

### 6.3 Recommendation Generator

```typescript
// packages/reports/src/builder/sections/RecommendationBuilder.ts

import { MatchResult, RecommendationContent, RecommendationItem } from '@genomeforge/types';

// Recommendation templates based on genetic findings
const RECOMMENDATION_TEMPLATES: Record<string, RecommendationTemplate[]> = {
  MTHFR: [
    {
      condition: (genotype) => genotype === 'TT' || genotype === 'CT',
      recommendation: 'Consider foods rich in natural folate (leafy greens, legumes)',
      rationale: 'MTHFR variants may affect folate metabolism',
      category: 'nutrition',
      priority: 'medium'
    }
  ],
  CYP1A2: [
    {
      condition: (genotype) => genotype === 'AA',
      recommendation: 'You may metabolize caffeine slowly',
      rationale: 'CYP1A2*1F variant associated with slower caffeine clearance',
      category: 'lifestyle',
      priority: 'low'
    }
  ],
  APOE: [
    {
      condition: (genotype) => genotype.includes('4'),
      recommendation: 'Heart-healthy diet and regular exercise may be particularly beneficial',
      rationale: 'APOE e4 associated with cardiovascular considerations',
      category: 'lifestyle',
      priority: 'high'
    }
  ]
};

export class RecommendationBuilder {
  build(matchResult: MatchResult, config: { category: string }): RecommendationContent {
    const items = this.generateRecommendations(matchResult, config.category);

    return {
      type: 'recommendations',
      category: config.category,
      items
    };
  }

  private generateRecommendations(
    result: MatchResult,
    category: string
  ): RecommendationItem[] {
    const recommendations: RecommendationItem[] = [];

    for (const snp of result.annotatedSNPs) {
      const templates = RECOMMENDATION_TEMPLATES[snp.clinvar?.gene ?? ''];
      if (!templates) continue;

      for (const template of templates) {
        if (template.category !== category) continue;
        if (!template.condition(snp.snp.genotype)) continue;

        recommendations.push({
          recommendation: template.recommendation,
          rationale: template.rationale,
          relatedGenes: [snp.clinvar?.gene ?? ''],
          priority: template.priority
        });
      }
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
  }
}
```

---

## 7. PDF Renderer

### 7.1 Main Document Component

```typescript
// packages/reports/src/PDFDocument.tsx

import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { Report } from '@genomeforge/types';
import { styles } from './styles';
import { CoverPage } from './components/CoverPage';
import { TableOfContents } from './components/TableOfContents';
import { SectionRenderer } from './components/SectionRenderer';
import { MedicalDisclaimer, PharmacogenomicsDisclaimer } from './components/Disclaimer';

interface PDFDocumentProps {
  report: Report;
}

export const PDFDocument: React.FC<PDFDocumentProps> = ({ report }) => (
  <Document>
    {/* Cover Page */}
    <CoverPage report={report} />

    {/* Table of Contents */}
    <Page size="A4" style={styles.page}>
      <TableOfContents sections={report.sections} />
    </Page>

    {/* Content Sections */}
    {report.sections.map((section) => (
      <Page key={section.id} size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <SectionRenderer section={section} />

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            GenomeForge Report • Generated {report.generatedAt.toLocaleDateString()} • Page {section.order + 3}
          </Text>
        </View>
      </Page>
    ))}

    {/* Disclaimer Page */}
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Important Information</Text>
      <MedicalDisclaimer />
      {report.type === 'pharmacogenomics' && <PharmacogenomicsDisclaimer />}

      {/* Database versions */}
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Data Sources</Text>
        <Text style={styles.citation}>
          ClinVar Version: {report.metadata.databaseVersions.clinvar}
        </Text>
        <Text style={styles.citation}>
          PharmGKB Version: {report.metadata.databaseVersions.pharmgkb}
        </Text>
        <Text style={styles.citation}>
          Data from PharmGKB (https://www.pharmgkb.org) - CC BY-SA 4.0
        </Text>
      </View>
    </Page>
  </Document>
);
```

### 7.2 PDF Generation Function

```typescript
// packages/reports/src/generator.ts

import { pdf } from '@react-pdf/renderer';
import { MatchResult, Report, ReportType } from '@genomeforge/types';
import { ReportBuilder } from './builder/ReportBuilder';
import { PDFDocument } from './PDFDocument';

export interface GenerateOptions {
  type: ReportType;
  filename?: string;
}

export async function generateReport(
  matchResult: MatchResult,
  options: GenerateOptions
): Promise<Report> {
  const builder = new ReportBuilder(matchResult, options.type);
  return builder.build();
}

export async function generatePDF(
  report: Report
): Promise<Blob> {
  const doc = <PDFDocument report={report} />;
  const blob = await pdf(doc).toBlob();
  return blob;
}

export async function downloadPDF(
  report: Report,
  filename?: string
): Promise<void> {
  const blob = await generatePDF(report);

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename ?? `${report.type}_${report.generatedAt.toISOString().split('T')[0]}.pdf`;
  link.click();

  URL.revokeObjectURL(url);
}
```

---

## 8. React Hooks

```typescript
// apps/web/src/hooks/useReports.ts

import { useState, useCallback } from 'react';
import { MatchResult, Report, ReportType } from '@genomeforge/types';
import { generateReport, generatePDF, downloadPDF } from '@genomeforge/reports';

export function useReports(matchResult: MatchResult | null) {
  const [reports, setReports] = useState<Report[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generate = useCallback(async (type: ReportType) => {
    if (!matchResult) return null;

    setIsGenerating(true);
    setError(null);

    try {
      const report = await generateReport(matchResult, { type });
      setReports(prev => [...prev, report]);
      return report;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [matchResult]);

  const download = useCallback(async (report: Report) => {
    try {
      await downloadPDF(report);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  const preview = useCallback(async (report: Report): Promise<string> => {
    const blob = await generatePDF(report);
    return URL.createObjectURL(blob);
  }, []);

  return {
    reports,
    isGenerating,
    error,
    generate,
    download,
    preview
  };
}
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

```typescript
describe('ReportGenerator', () => {
  describe('ReportBuilder', () => {
    it('generates exhaustive genetic report with all sections', () => {
      const matchResult = createMockMatchResult();
      const builder = new ReportBuilder(matchResult, 'exhaustive_genetic');
      const report = builder.build();

      expect(report.sections.length).toBeGreaterThan(5);
      expect(report.sections.some(s => s.type === 'summary')).toBe(true);
      expect(report.sections.some(s => s.type === 'technical')).toBe(true);
    });

    it('generates pharmacogenomics report with drug interactions', () => {
      const matchResult = createMockMatchResult({ drugInteractions: 5 });
      const builder = new ReportBuilder(matchResult, 'pharmacogenomics');
      const report = builder.build();

      const drugSection = report.sections.find(s => s.type === 'drug_interactions');
      expect(drugSection).toBeDefined();
    });
  });

  describe('PDF Generation', () => {
    it('generates valid PDF blob', async () => {
      const report = createMockReport();
      const blob = await generatePDF(report);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/pdf');
      expect(blob.size).toBeGreaterThan(0);
    });
  });
});
```

### 9.2 Visual Regression Tests

Use Percy or Chromatic for PDF visual regression:
- Test each report type
- Test with various data sizes
- Test color coding accuracy

---

## 10. Performance Targets

| Metric | Target |
|--------|--------|
| Report generation time | <5 seconds |
| PDF rendering time | <10 seconds |
| PDF file size | <5MB |
| Memory usage during generation | <200MB |

---

**Document Version:** 1.0.0
**Author:** GenomeForge Team
**Last Updated:** 2026-01-28
