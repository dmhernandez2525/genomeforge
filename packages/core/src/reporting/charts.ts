/**
 * Report Charts
 *
 * Generate chart data for report visualizations.
 */

import type {
  ChartData,
  ChartSeries,
  ReportData,
  ClinicalFinding,
  DrugResponse,
  TraitAssociation,
  RiskFactor,
  AncestryInfo,
  RiskLevel,
  ClinicalSignificance,
  MetabolizerPhenotype,
} from './types';
import { getColorScheme } from './templates';

/**
 * Generate all charts for a report
 */
export function generateReportCharts(data: ReportData): ChartData[] {
  const charts: ChartData[] = [];

  // Summary overview chart
  charts.push(generateSummaryChart(data));

  // Clinical significance distribution
  if (data.clinicalFindings.length > 0) {
    charts.push(generateSignificanceChart(data.clinicalFindings));
    charts.push(generateRiskLevelChart(data.clinicalFindings));
  }

  // Drug response phenotypes
  if (data.drugResponses.length > 0) {
    charts.push(generateMetabolizerChart(data.drugResponses));
    charts.push(generateDrugClassChart(data.drugResponses));
  }

  // Trait associations by category
  if (data.traitAssociations.length > 0) {
    charts.push(generateTraitCategoryChart(data.traitAssociations));
  }

  // Ancestry breakdown
  if (data.ancestry) {
    charts.push(generateAncestryChart(data.ancestry));
  }

  // Risk factors
  if (data.riskFactors.length > 0) {
    charts.push(generateRiskFactorChart(data.riskFactors));
  }

  return charts;
}

/**
 * Generate summary overview chart
 */
export function generateSummaryChart(data: ReportData): ChartData {
  const colors = getColorScheme('clinical');

  return {
    id: 'summary-overview',
    type: 'bar',
    title: 'Findings Overview',
    subtitle: 'Summary of genetic findings by category',
    labels: [
      'Clinical Findings',
      'Drug Responses',
      'Trait Associations',
      'Risk Factors',
      'Actionable',
    ],
    series: [
      {
        name: 'Count',
        data: [
          data.clinicalFindings.length,
          data.drugResponses.length,
          data.traitAssociations.length,
          data.riskFactors.length,
          data.summary.actionableCount,
        ],
        color: colors.primary,
      },
    ],
    options: {
      showLegend: false,
      showDataLabels: true,
      showGrid: true,
      yAxisLabel: 'Number of Findings',
    },
  };
}

/**
 * Generate clinical significance distribution chart
 */
export function generateSignificanceChart(findings: ClinicalFinding[]): ChartData {
  const colors = getColorScheme('clinical');

  const significanceCounts = new Map<ClinicalSignificance, number>();
  for (const finding of findings) {
    const count = significanceCounts.get(finding.significance) || 0;
    significanceCounts.set(finding.significance, count + 1);
  }

  const significanceLabels: Record<ClinicalSignificance, string> = {
    pathogenic: 'Pathogenic',
    likely_pathogenic: 'Likely Pathogenic',
    uncertain_significance: 'Uncertain',
    likely_benign: 'Likely Benign',
    benign: 'Benign',
    risk_factor: 'Risk Factor',
    protective: 'Protective',
    drug_response: 'Drug Response',
  };

  const significanceColors: Record<ClinicalSignificance, string> = {
    pathogenic: colors.danger,
    likely_pathogenic: '#f97316',
    uncertain_significance: colors.warning,
    likely_benign: colors.info,
    benign: colors.success,
    risk_factor: '#8b5cf6',
    protective: '#06b6d4',
    drug_response: colors.accent,
  };

  const labels: string[] = [];
  const data: number[] = [];
  const chartColors: string[] = [];

  for (const [sig, count] of significanceCounts) {
    labels.push(significanceLabels[sig] || sig);
    data.push(count);
    chartColors.push(significanceColors[sig] || colors.primary);
  }

  return {
    id: 'significance-distribution',
    type: 'pie',
    title: 'Clinical Significance Distribution',
    labels,
    series: [
      {
        name: 'Findings',
        data,
        color: chartColors[0],
      },
    ],
    options: {
      showLegend: true,
      legendPosition: 'right',
      showDataLabels: true,
    },
  };
}

/**
 * Generate risk level distribution chart
 */
export function generateRiskLevelChart(findings: ClinicalFinding[]): ChartData {
  const colors = getColorScheme('clinical');

  const riskCounts = new Map<RiskLevel, number>();
  for (const finding of findings) {
    const count = riskCounts.get(finding.riskLevel) || 0;
    riskCounts.set(finding.riskLevel, count + 1);
  }

  const riskLabels: Record<RiskLevel, string> = {
    high: 'High Risk',
    moderate: 'Moderate Risk',
    low: 'Low Risk',
    protective: 'Protective',
    unknown: 'Unknown',
  };

  const riskOrder: RiskLevel[] = ['high', 'moderate', 'low', 'protective', 'unknown'];
  const labels: string[] = [];
  const data: number[] = [];

  for (const risk of riskOrder) {
    const count = riskCounts.get(risk);
    if (count !== undefined && count > 0) {
      labels.push(riskLabels[risk]);
      data.push(count);
    }
  }

  return {
    id: 'risk-level-distribution',
    type: 'donut',
    title: 'Risk Level Distribution',
    labels,
    series: [
      {
        name: 'Findings',
        data,
        color: colors.primary,
      },
    ],
    options: {
      showLegend: true,
      legendPosition: 'bottom',
      showDataLabels: true,
    },
  };
}

/**
 * Generate metabolizer phenotype chart
 */
export function generateMetabolizerChart(responses: DrugResponse[]): ChartData {
  const colors = getColorScheme('clinical');

  const phenotypeCounts = new Map<MetabolizerPhenotype, number>();
  for (const response of responses) {
    const count = phenotypeCounts.get(response.phenotype) || 0;
    phenotypeCounts.set(response.phenotype, count + 1);
  }

  const phenotypeLabels: Record<MetabolizerPhenotype, string> = {
    poor_metabolizer: 'Poor Metabolizer',
    intermediate_metabolizer: 'Intermediate',
    normal_metabolizer: 'Normal',
    rapid_metabolizer: 'Rapid',
    ultrarapid_metabolizer: 'Ultrarapid',
    indeterminate: 'Indeterminate',
  };

  const labels: string[] = [];
  const data: number[] = [];

  for (const [phenotype, count] of phenotypeCounts) {
    labels.push(phenotypeLabels[phenotype] || phenotype);
    data.push(count);
  }

  return {
    id: 'metabolizer-phenotypes',
    type: 'bar',
    title: 'Drug Metabolizer Phenotypes',
    subtitle: 'Distribution of metabolizer types',
    labels,
    series: [
      {
        name: 'Count',
        data,
        color: colors.primary,
      },
    ],
    options: {
      showLegend: false,
      showDataLabels: true,
      showGrid: true,
      xAxisLabel: 'Phenotype',
      yAxisLabel: 'Number of Drugs',
    },
  };
}

/**
 * Generate drug class chart
 */
export function generateDrugClassChart(responses: DrugResponse[]): ChartData {
  const colors = getColorScheme('clinical');

  const classCounts = new Map<string, number>();
  for (const response of responses) {
    const drugClass = response.drugClass || 'Other';
    const count = classCounts.get(drugClass) || 0;
    classCounts.set(drugClass, count + 1);
  }

  // Sort by count and take top 10
  const sorted = Array.from(classCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return {
    id: 'drug-class-distribution',
    type: 'bar',
    title: 'Drug Classes Affected',
    subtitle: 'Top drug classes with pharmacogenomic findings',
    labels: sorted.map(([label]) => label),
    series: [
      {
        name: 'Drugs',
        data: sorted.map(([, count]) => count),
        color: colors.accent,
      },
    ],
    options: {
      showLegend: false,
      showDataLabels: true,
      showGrid: true,
      yAxisLabel: 'Number of Drugs',
    },
  };
}

/**
 * Generate trait category chart
 */
export function generateTraitCategoryChart(associations: TraitAssociation[]): ChartData {
  const colors = getColorScheme('modern');

  const categoryCounts = new Map<string, number>();
  for (const assoc of associations) {
    const count = categoryCounts.get(assoc.category) || 0;
    categoryCounts.set(assoc.category, count + 1);
  }

  const categoryLabels: Record<string, string> = {
    physical: 'Physical',
    metabolic: 'Metabolic',
    cognitive: 'Cognitive',
    behavioral: 'Behavioral',
    nutritional: 'Nutritional',
    athletic: 'Athletic',
    longevity: 'Longevity',
    other: 'Other',
  };

  const labels: string[] = [];
  const data: number[] = [];

  for (const [category, count] of categoryCounts) {
    labels.push(categoryLabels[category] || category);
    data.push(count);
  }

  return {
    id: 'trait-categories',
    type: 'radar',
    title: 'Trait Categories',
    subtitle: 'Distribution of genetic trait associations',
    labels,
    series: [
      {
        name: 'Traits',
        data,
        color: colors.primary,
      },
    ],
    options: {
      showLegend: false,
      showDataLabels: false,
    },
  };
}

/**
 * Generate ancestry breakdown chart
 */
export function generateAncestryChart(ancestry: AncestryInfo): ChartData {
  const labels = ancestry.populations.map((p) => p.population);
  const data = ancestry.populations.map((p) => p.percentage);

  return {
    id: 'ancestry-breakdown',
    type: 'pie',
    title: 'Ancestry Composition',
    subtitle: 'Estimated genetic ancestry',
    labels,
    series: [
      {
        name: 'Percentage',
        data,
      },
    ],
    options: {
      showLegend: true,
      legendPosition: 'right',
      showDataLabels: true,
    },
  };
}

/**
 * Generate risk factor chart
 */
export function generateRiskFactorChart(riskFactors: RiskFactor[]): ChartData {
  const colors = getColorScheme('clinical');

  const riskLevelValues: Record<RiskLevel, number> = {
    high: 3,
    moderate: 2,
    low: 1,
    protective: -1,
    unknown: 0,
  };

  // Sort by risk level
  const sorted = [...riskFactors].sort(
    (a, b) => riskLevelValues[b.overallRisk] - riskLevelValues[a.overallRisk]
  );

  // Take top 10
  const topRisks = sorted.slice(0, 10);

  return {
    id: 'risk-factors',
    type: 'bar',
    title: 'Health Risk Factors',
    subtitle: 'Conditions with genetic risk variants',
    labels: topRisks.map((r) => r.condition),
    series: [
      {
        name: 'Risk Level',
        data: topRisks.map((r) => riskLevelValues[r.overallRisk]),
        color: colors.warning,
      },
    ],
    options: {
      showLegend: false,
      showDataLabels: false,
      showGrid: true,
      yAxisLabel: 'Risk Level',
    },
  };
}

/**
 * Generate genes by chromosome chart
 */
export function generateChromosomeChart(_findings: ClinicalFinding[]): ChartData {
  const colors = getColorScheme('clinical');

  // This would require chromosome info in the findings
  // For now, return a placeholder
  const chromosomes = Array.from({ length: 22 }, (_, i) => `Chr ${i + 1}`);
  const counts = chromosomes.map(() => Math.floor(Math.random() * 10));

  return {
    id: 'chromosome-distribution',
    type: 'bar',
    title: 'Variants by Chromosome',
    labels: chromosomes,
    series: [
      {
        name: 'Variants',
        data: counts,
        color: colors.primary,
      },
    ],
    options: {
      showLegend: false,
      showDataLabels: false,
      showGrid: true,
      yAxisLabel: 'Number of Variants',
    },
  };
}

/**
 * Generate evidence level chart
 */
export function generateEvidenceLevelChart(findings: ClinicalFinding[]): ChartData {
  const colors = getColorScheme('clinical');

  const evidenceCounts = new Map<string, number>();
  for (const finding of findings) {
    const level = finding.evidenceLevel || 'unknown';
    const count = evidenceCounts.get(level) || 0;
    evidenceCounts.set(level, count + 1);
  }

  const evidenceOrder = ['1A', '1B', '2A', '2B', '3', '4', 'expert_opinion', 'unknown'];
  const labels: string[] = [];
  const data: number[] = [];

  for (const level of evidenceOrder) {
    const count = evidenceCounts.get(level);
    if (count !== undefined && count > 0) {
      labels.push(level === 'expert_opinion' ? 'Expert' : level.toUpperCase());
      data.push(count);
    }
  }

  return {
    id: 'evidence-levels',
    type: 'bar',
    title: 'Evidence Levels',
    subtitle: 'Distribution of clinical evidence quality',
    labels,
    series: [
      {
        name: 'Findings',
        data,
        color: colors.info,
      },
    ],
    options: {
      showLegend: false,
      showDataLabels: true,
      showGrid: true,
      xAxisLabel: 'Evidence Level',
      yAxisLabel: 'Count',
    },
  };
}

/**
 * Generate comparison chart (for multi-sample reports)
 */
export function generateComparisonChart(
  samples: { name: string; data: ReportData }[]
): ChartData {
  const colors = getColorScheme('modern');

  const colorPalette = [
    colors.primary,
    colors.secondary,
    colors.accent,
    colors.success,
    colors.warning,
  ];

  const labels = [
    'Clinical Findings',
    'Drug Responses',
    'Trait Associations',
    'Risk Factors',
  ];

  const series: ChartSeries[] = samples.map((sample, index) => ({
    name: sample.name,
    data: [
      sample.data.clinicalFindings.length,
      sample.data.drugResponses.length,
      sample.data.traitAssociations.length,
      sample.data.riskFactors.length,
    ],
    color: colorPalette[index % colorPalette.length],
  }));

  return {
    id: 'sample-comparison',
    type: 'bar',
    title: 'Sample Comparison',
    subtitle: 'Findings across samples',
    labels,
    series,
    options: {
      showLegend: true,
      legendPosition: 'top',
      showDataLabels: false,
      showGrid: true,
      yAxisLabel: 'Count',
    },
  };
}
