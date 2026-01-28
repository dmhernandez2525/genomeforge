/**
 * Report Generator Service
 *
 * Generates structured genetic reports from analysis results.
 * Reports are generated locally and stored on device.
 */

import type { AnalysisResult, ClinicalFinding, DrugResponse, TraitAssociation } from './genomeAnalysis';

export type ReportType = 'summary' | 'health' | 'pharma' | 'carrier' | 'traits';

export interface ReportSection {
  title: string;
  content: string;
  items?: ReportItem[];
  severity?: 'info' | 'low' | 'medium' | 'high';
}

export interface ReportItem {
  label: string;
  value: string;
  detail?: string;
  badge?: {
    text: string;
    color: string;
  };
}

export interface GeneratedReport {
  id: string;
  type: ReportType;
  title: string;
  subtitle: string;
  generatedAt: string;
  genomeFilename: string;
  sections: ReportSection[];
  summary: {
    totalFindings: number;
    actionableItems: number;
    riskLevel: 'low' | 'moderate' | 'elevated';
  };
}

function generateReportId(): string {
  return `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getSeverityFromSignificance(significance: string): 'info' | 'low' | 'medium' | 'high' {
  const sig = significance.toLowerCase();
  if (sig.includes('pathogenic')) return 'high';
  if (sig.includes('likely_pathogenic')) return 'medium';
  if (sig.includes('uncertain') || sig.includes('vus')) return 'low';
  return 'info';
}

function getOverallRiskLevel(clinicalFindings: ClinicalFinding[]): 'low' | 'moderate' | 'elevated' {
  const pathogenicCount = clinicalFindings.filter(
    (f) => f.significance.toLowerCase().includes('pathogenic')
  ).length;

  if (pathogenicCount >= 3) return 'elevated';
  if (pathogenicCount >= 1) return 'moderate';
  return 'low';
}

/**
 * Generate a summary report covering all findings
 */
function generateSummaryReport(
  analysis: AnalysisResult,
  genomeFilename: string
): GeneratedReport {
  const sections: ReportSection[] = [];

  // Overview section
  sections.push({
    title: 'Analysis Overview',
    content: `This report summarizes the genetic analysis performed on your DNA data file. The analysis identified ${analysis.summary.totalVariantsAnalyzed.toLocaleString()} variants and cross-referenced them against clinical databases.`,
    items: [
      { label: 'Total Variants Analyzed', value: analysis.summary.totalVariantsAnalyzed.toLocaleString() },
      { label: 'Clinical Findings', value: analysis.summary.clinicalFindings.toString() },
      { label: 'Drug Response Insights', value: analysis.summary.drugResponses.toString() },
      { label: 'Trait Associations', value: analysis.summary.traitAssociations.toString() },
    ],
  });

  // Key findings section
  if (analysis.clinicalFindings.length > 0) {
    const topFindings = analysis.clinicalFindings.slice(0, 5);
    sections.push({
      title: 'Key Clinical Findings',
      content: 'The following variants have been identified as clinically significant based on ClinVar database annotations.',
      severity: getOverallRiskLevel(analysis.clinicalFindings) === 'elevated' ? 'high' : 'medium',
      items: topFindings.map((finding) => ({
        label: finding.rsid,
        value: finding.condition,
        detail: `${finding.gene} - ${finding.significance}`,
        badge: {
          text: finding.significance.replace(/_/g, ' '),
          color: getSeverityFromSignificance(finding.significance) === 'high' ? '#dc2626' : '#f59e0b',
        },
      })),
    });
  }

  // Drug response highlights
  if (analysis.drugResponses.length > 0) {
    const topDrugs = analysis.drugResponses.slice(0, 5);
    sections.push({
      title: 'Pharmacogenomic Highlights',
      content: 'Your genetic variants may affect how you respond to certain medications. Discuss these findings with your healthcare provider.',
      items: topDrugs.map((drug) => ({
        label: drug.drug,
        value: drug.response,
        detail: `Gene: ${drug.gene}`,
        badge: {
          text: drug.recommendation.includes('avoid') ? 'Caution' : 'Info',
          color: drug.recommendation.includes('avoid') ? '#dc2626' : '#3b82f6',
        },
      })),
    });
  }

  // Disclaimer
  sections.push({
    title: 'Important Notice',
    content: 'This report is for educational and informational purposes only. It is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.',
    severity: 'info',
  });

  return {
    id: generateReportId(),
    type: 'summary',
    title: 'Summary Report',
    subtitle: 'Complete overview of your genetic analysis',
    generatedAt: new Date().toISOString(),
    genomeFilename,
    sections,
    summary: {
      totalFindings: analysis.summary.clinicalFindings + analysis.summary.drugResponses + analysis.summary.traitAssociations,
      actionableItems: analysis.summary.actionableFindings,
      riskLevel: getOverallRiskLevel(analysis.clinicalFindings),
    },
  };
}

/**
 * Generate a health risks report
 */
function generateHealthReport(
  analysis: AnalysisResult,
  genomeFilename: string
): GeneratedReport {
  const sections: ReportSection[] = [];

  // Introduction
  sections.push({
    title: 'About This Report',
    content: 'This report details genetic variants associated with health conditions identified in your DNA. The information is based on current scientific research and clinical databases.',
  });

  // Group findings by severity
  const pathogenic = analysis.clinicalFindings.filter(
    (f) => f.significance.toLowerCase().includes('pathogenic') && !f.significance.toLowerCase().includes('likely')
  );
  const likelyPathogenic = analysis.clinicalFindings.filter(
    (f) => f.significance.toLowerCase().includes('likely_pathogenic')
  );
  const uncertain = analysis.clinicalFindings.filter(
    (f) => f.significance.toLowerCase().includes('uncertain')
  );

  if (pathogenic.length > 0) {
    sections.push({
      title: 'Pathogenic Variants',
      content: 'These variants have strong evidence of being associated with disease. Consult with a genetic counselor to understand the implications.',
      severity: 'high',
      items: pathogenic.map((finding) => ({
        label: finding.rsid,
        value: finding.condition,
        detail: `Gene: ${finding.gene}`,
        badge: { text: 'Pathogenic', color: '#dc2626' },
      })),
    });
  }

  if (likelyPathogenic.length > 0) {
    sections.push({
      title: 'Likely Pathogenic Variants',
      content: 'These variants have probable evidence of being associated with disease. Further clinical evaluation may be recommended.',
      severity: 'medium',
      items: likelyPathogenic.map((finding) => ({
        label: finding.rsid,
        value: finding.condition,
        detail: `Gene: ${finding.gene}`,
        badge: { text: 'Likely Pathogenic', color: '#f59e0b' },
      })),
    });
  }

  if (uncertain.length > 0) {
    sections.push({
      title: 'Variants of Uncertain Significance',
      content: 'The clinical significance of these variants is currently unclear. They may be reclassified as more research becomes available.',
      severity: 'low',
      items: uncertain.slice(0, 10).map((finding) => ({
        label: finding.rsid,
        value: finding.condition,
        detail: `Gene: ${finding.gene}`,
        badge: { text: 'VUS', color: '#6b7280' },
      })),
    });
  }

  if (analysis.clinicalFindings.length === 0) {
    sections.push({
      title: 'No Significant Findings',
      content: 'No pathogenic or likely pathogenic variants were identified in the analyzed regions. This does not guarantee absence of genetic health risks, as this analysis covers only a subset of known variants.',
      severity: 'info',
    });
  }

  // Recommendations
  sections.push({
    title: 'Next Steps',
    content: 'Based on your results, we recommend the following actions:',
    items: [
      { label: '1', value: 'Share this report with your healthcare provider' },
      { label: '2', value: 'Consider genetic counseling for pathogenic findings' },
      { label: '3', value: 'Keep your genetic data secure and private' },
      { label: '4', value: 'Stay informed as genetic research advances' },
    ],
  });

  return {
    id: generateReportId(),
    type: 'health',
    title: 'Health Risk Report',
    subtitle: 'Genetic variants associated with health conditions',
    generatedAt: new Date().toISOString(),
    genomeFilename,
    sections,
    summary: {
      totalFindings: analysis.clinicalFindings.length,
      actionableItems: pathogenic.length + likelyPathogenic.length,
      riskLevel: getOverallRiskLevel(analysis.clinicalFindings),
    },
  };
}

/**
 * Generate a pharmacogenomic report
 */
function generatePharmaReport(
  analysis: AnalysisResult,
  genomeFilename: string
): GeneratedReport {
  const sections: ReportSection[] = [];

  // Introduction
  sections.push({
    title: 'About Pharmacogenomics',
    content: 'Pharmacogenomics studies how your genes affect your response to medications. This report identifies genetic variants that may influence drug metabolism, efficacy, or adverse reactions.',
  });

  // Group by response type
  const poorMetabolizers = analysis.drugResponses.filter(
    (d) => d.response.toLowerCase().includes('poor') || d.response.toLowerCase().includes('reduced')
  );
  const rapidMetabolizers = analysis.drugResponses.filter(
    (d) => d.response.toLowerCase().includes('rapid') || d.response.toLowerCase().includes('increased')
  );
  const normalMetabolizers = analysis.drugResponses.filter(
    (d) => d.response.toLowerCase().includes('normal')
  );

  if (poorMetabolizers.length > 0) {
    sections.push({
      title: 'Reduced Drug Metabolism',
      content: 'You may metabolize these medications more slowly than average. This could lead to increased drug levels and potential side effects.',
      severity: 'high',
      items: poorMetabolizers.map((drug) => ({
        label: drug.drug,
        value: drug.response,
        detail: drug.recommendation,
        badge: { text: 'Caution', color: '#dc2626' },
      })),
    });
  }

  if (rapidMetabolizers.length > 0) {
    sections.push({
      title: 'Increased Drug Metabolism',
      content: 'You may metabolize these medications faster than average. Standard doses might be less effective.',
      severity: 'medium',
      items: rapidMetabolizers.map((drug) => ({
        label: drug.drug,
        value: drug.response,
        detail: drug.recommendation,
        badge: { text: 'Adjust', color: '#f59e0b' },
      })),
    });
  }

  if (normalMetabolizers.length > 0) {
    sections.push({
      title: 'Normal Drug Response',
      content: 'You are expected to respond normally to these medications based on your genetic profile.',
      severity: 'info',
      items: normalMetabolizers.map((drug) => ({
        label: drug.drug,
        value: drug.response,
        detail: `Gene: ${drug.gene}`,
        badge: { text: 'Normal', color: '#059669' },
      })),
    });
  }

  if (analysis.drugResponses.length === 0) {
    sections.push({
      title: 'No Pharmacogenomic Findings',
      content: 'No significant pharmacogenomic variants were identified. This does not mean all medications will work identically for you.',
      severity: 'info',
    });
  }

  // Key genes section
  const uniqueGenes = [...new Set(analysis.drugResponses.map((d) => d.gene))];
  if (uniqueGenes.length > 0) {
    sections.push({
      title: 'Genes Analyzed',
      content: 'The following pharmacogenomic genes were analyzed:',
      items: uniqueGenes.map((gene) => ({
        label: gene,
        value: `${analysis.drugResponses.filter((d) => d.gene === gene).length} drug associations`,
      })),
    });
  }

  // Important notice
  sections.push({
    title: 'Important Medical Disclaimer',
    content: 'Never change or stop taking prescribed medications based on this report without consulting your healthcare provider. Drug response is affected by many factors beyond genetics.',
    severity: 'high',
  });

  return {
    id: generateReportId(),
    type: 'pharma',
    title: 'Drug Response Report',
    subtitle: 'How your genes may affect medication response',
    generatedAt: new Date().toISOString(),
    genomeFilename,
    sections,
    summary: {
      totalFindings: analysis.drugResponses.length,
      actionableItems: poorMetabolizers.length + rapidMetabolizers.length,
      riskLevel: poorMetabolizers.length > 3 ? 'elevated' : poorMetabolizers.length > 0 ? 'moderate' : 'low',
    },
  };
}

/**
 * Generate a carrier status report
 */
function generateCarrierReport(
  analysis: AnalysisResult,
  genomeFilename: string
): GeneratedReport {
  const sections: ReportSection[] = [];

  // Introduction
  sections.push({
    title: 'About Carrier Status',
    content: 'Carrier screening identifies genetic variants that could be passed to your children. Being a carrier typically means you have one copy of a recessive disease variant but do not have the condition yourself.',
  });

  // Filter for carrier-relevant findings (recessive conditions)
  const carrierFindings = analysis.clinicalFindings.filter(
    (f) => f.significance.toLowerCase().includes('pathogenic') ||
           f.significance.toLowerCase().includes('likely_pathogenic')
  );

  if (carrierFindings.length > 0) {
    sections.push({
      title: 'Potential Carrier Status',
      content: 'You may carry variants for the following conditions. Genetic counseling is recommended for family planning.',
      severity: 'medium',
      items: carrierFindings.map((finding) => ({
        label: finding.gene,
        value: finding.condition,
        detail: `Variant: ${finding.rsid}`,
        badge: {
          text: 'Carrier',
          color: '#7c3aed',
        },
      })),
    });
  } else {
    sections.push({
      title: 'Carrier Screening Results',
      content: 'No pathogenic carrier variants were identified in the analyzed genes. Note that this screening covers only a subset of possible carrier conditions.',
      severity: 'info',
    });
  }

  // Family planning section
  sections.push({
    title: 'Family Planning Considerations',
    content: 'If you are planning to have children, consider the following:',
    items: [
      { label: '1', value: 'Both partners should undergo carrier screening' },
      { label: '2', value: 'Consult a genetic counselor to understand inheritance patterns' },
      { label: '3', value: 'Discuss reproductive options with your healthcare team' },
      { label: '4', value: 'Consider expanded carrier screening for comprehensive coverage' },
    ],
  });

  return {
    id: generateReportId(),
    type: 'carrier',
    title: 'Carrier Status Report',
    subtitle: 'Inherited condition carrier screening results',
    generatedAt: new Date().toISOString(),
    genomeFilename,
    sections,
    summary: {
      totalFindings: carrierFindings.length,
      actionableItems: carrierFindings.length,
      riskLevel: carrierFindings.length > 2 ? 'moderate' : 'low',
    },
  };
}

/**
 * Generate a traits report
 */
function generateTraitsReport(
  analysis: AnalysisResult,
  genomeFilename: string
): GeneratedReport {
  const sections: ReportSection[] = [];

  // Introduction
  sections.push({
    title: 'About Genetic Traits',
    content: 'Genetic traits are characteristics influenced by your DNA. These associations are based on genome-wide association studies (GWAS) and represent statistical probabilities, not certainties.',
  });

  if (analysis.traitAssociations.length > 0) {
    // Group by category
    const categories = [...new Set(analysis.traitAssociations.map((t) => t.category))];

    for (const category of categories) {
      const categoryTraits = analysis.traitAssociations.filter((t) => t.category === category);
      sections.push({
        title: category.charAt(0).toUpperCase() + category.slice(1),
        content: `Traits related to ${category.toLowerCase()}:`,
        items: categoryTraits.map((trait) => ({
          label: trait.trait,
          value: trait.effect,
          detail: `Confidence: ${(trait.confidence * 100).toFixed(0)}%`,
          badge: {
            text: trait.confidence > 0.7 ? 'High' : trait.confidence > 0.4 ? 'Medium' : 'Low',
            color: trait.confidence > 0.7 ? '#059669' : trait.confidence > 0.4 ? '#f59e0b' : '#6b7280',
          },
        })),
      });
    }
  } else {
    sections.push({
      title: 'No Trait Associations Found',
      content: 'No significant trait associations were identified in your genetic data.',
      severity: 'info',
    });
  }

  // Disclaimer
  sections.push({
    title: 'Understanding Trait Genetics',
    content: 'Genetic traits are influenced by multiple genes and environmental factors. The associations shown here represent increased or decreased probabilities, not guarantees. Your actual traits depend on the complex interaction of many factors.',
    severity: 'info',
  });

  return {
    id: generateReportId(),
    type: 'traits',
    title: 'Traits Report',
    subtitle: 'Genetic trait associations and tendencies',
    generatedAt: new Date().toISOString(),
    genomeFilename,
    sections,
    summary: {
      totalFindings: analysis.traitAssociations.length,
      actionableItems: 0,
      riskLevel: 'low',
    },
  };
}

/**
 * Generate a report of the specified type
 */
export function generateReport(
  type: ReportType,
  analysis: AnalysisResult,
  genomeFilename: string
): GeneratedReport {
  switch (type) {
    case 'summary':
      return generateSummaryReport(analysis, genomeFilename);
    case 'health':
      return generateHealthReport(analysis, genomeFilename);
    case 'pharma':
      return generatePharmaReport(analysis, genomeFilename);
    case 'carrier':
      return generateCarrierReport(analysis, genomeFilename);
    case 'traits':
      return generateTraitsReport(analysis, genomeFilename);
    default:
      throw new Error(`Unknown report type: ${type}`);
  }
}

/**
 * Format report for sharing as plain text
 */
export function formatReportAsText(report: GeneratedReport): string {
  const lines: string[] = [];

  lines.push('═'.repeat(60));
  lines.push(report.title.toUpperCase());
  lines.push(report.subtitle);
  lines.push('═'.repeat(60));
  lines.push('');
  lines.push(`Generated: ${formatDate(new Date(report.generatedAt))}`);
  lines.push(`Source File: ${report.genomeFilename}`);
  lines.push('');

  for (const section of report.sections) {
    lines.push('─'.repeat(40));
    lines.push(section.title.toUpperCase());
    lines.push('─'.repeat(40));
    lines.push('');
    lines.push(section.content);
    lines.push('');

    if (section.items) {
      for (const item of section.items) {
        lines.push(`• ${item.label}: ${item.value}`);
        if (item.detail) {
          lines.push(`  ${item.detail}`);
        }
      }
      lines.push('');
    }
  }

  lines.push('═'.repeat(60));
  lines.push('Generated by GenomeForge - Your genetic data, your device, your privacy.');
  lines.push('═'.repeat(60));

  return lines.join('\n');
}

/**
 * Format report for sharing as HTML
 */
export function formatReportAsHTML(report: GeneratedReport): string {
  const severityColors: Record<string, string> = {
    info: '#3b82f6',
    low: '#6b7280',
    medium: '#f59e0b',
    high: '#dc2626',
  };

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.title} - GenomeForge</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #111827; }
    h1 { color: #2563eb; margin-bottom: 5px; }
    h2 { color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-top: 30px; }
    .subtitle { color: #6b7280; font-size: 16px; margin-bottom: 20px; }
    .meta { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 25px; }
    .section { margin-bottom: 25px; }
    .section-content { color: #4b5563; line-height: 1.6; }
    .items { list-style: none; padding: 0; margin-top: 15px; }
    .item { background: #fff; border: 1px solid #e5e7eb; padding: 12px 15px; margin-bottom: 8px; border-radius: 8px; }
    .item-label { font-weight: 600; color: #111827; }
    .item-value { color: #374151; }
    .item-detail { font-size: 14px; color: #6b7280; margin-top: 4px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; color: white; margin-left: 8px; }
    .severity-high { border-left: 4px solid #dc2626; }
    .severity-medium { border-left: 4px solid #f59e0b; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; text-align: center; }
  </style>
</head>
<body>
  <h1>${report.title}</h1>
  <p class="subtitle">${report.subtitle}</p>
  <div class="meta">
    <strong>Generated:</strong> ${formatDate(new Date(report.generatedAt))}<br>
    <strong>Source:</strong> ${report.genomeFilename}
  </div>
`;

  for (const section of report.sections) {
    const severityClass = section.severity ? `severity-${section.severity}` : '';
    html += `
  <div class="section ${severityClass}">
    <h2>${section.title}</h2>
    <p class="section-content">${section.content}</p>
`;
    if (section.items) {
      html += '    <ul class="items">\n';
      for (const item of section.items) {
        html += `      <li class="item">
        <span class="item-label">${item.label}</span>:
        <span class="item-value">${item.value}</span>
        ${item.badge ? `<span class="badge" style="background:${item.badge.color}">${item.badge.text}</span>` : ''}
        ${item.detail ? `<div class="item-detail">${item.detail}</div>` : ''}
      </li>\n`;
      }
      html += '    </ul>\n';
    }
    html += '  </div>\n';
  }

  html += `
  <div class="footer">
    <p>Generated by <strong>GenomeForge</strong></p>
    <p>Your genetic data, your device, your privacy.</p>
  </div>
</body>
</html>`;

  return html;
}
