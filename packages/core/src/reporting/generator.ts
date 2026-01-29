/**
 * Report Generator
 *
 * Generate comprehensive genetic analysis reports.
 */

import type {
  ReportConfig,
  ReportData,
  GeneratedReport,
  ReportContent,
  RenderedSection,
  TocEntry,
  ReportSectionConfig,
  ReportEvent,
  ReportEventType,
  ReportEventListener,
  ReportColors,
  ClinicalFinding,
  DrugResponse,
  TraitAssociation,
  RiskFactor,
  Recommendation,
  Reference,
} from './types';
import { generateReportCharts } from './charts';
import { getTemplate, getColorScheme } from './templates';

/**
 * Report Generator class
 */
export class ReportGenerator {
  private listeners: Set<ReportEventListener> = new Set();

  /**
   * Add an event listener
   */
  addEventListener(listener: ReportEventListener): void {
    this.listeners.add(listener);
  }

  /**
   * Remove an event listener
   */
  removeEventListener(listener: ReportEventListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Emit an event
   */
  private emit(type: ReportEventType, reportId: string, data?: Record<string, unknown>): void {
    const event: ReportEvent = {
      type,
      reportId,
      timestamp: new Date().toISOString(),
      data,
    };

    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Report event listener error:', error);
      }
    }
  }

  /**
   * Generate a report
   */
  generate(data: ReportData, config: ReportConfig): GeneratedReport {
    const startTime = Date.now();
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const warnings: string[] = [];

    this.emit('generation_started', reportId);

    const colors = config.customColors || getColorScheme(config.colorScheme);

    // Generate sections
    const sections: RenderedSection[] = [];
    const enabledSections = config.sections
      .filter((s) => s.enabled)
      .sort((a, b) => a.order - b.order);

    let pageNumber = 1;
    for (const sectionConfig of enabledSections) {
      const section = this.renderSection(sectionConfig, data, colors, config);
      if (section) {
        section.pageNumber = pageNumber++;
        sections.push(section);
        this.emit('section_rendered', reportId, { sectionId: section.id });
      }
    }

    // Generate charts
    const charts = generateReportCharts(data);
    this.emit('chart_generated', reportId, { chartCount: charts.length });

    // Generate table of contents
    let tableOfContents: TocEntry[] | undefined;
    if (config.includeToc) {
      tableOfContents = sections.map((section, index) => ({
        title: section.title,
        sectionId: section.id,
        pageNumber: section.pageNumber || index + 1,
        level: 1,
      }));
    }

    const content: ReportContent = {
      sections,
      charts,
      tableOfContents,
      totalPages: sections.length,
    };

    const report: GeneratedReport = {
      id: reportId,
      config,
      content,
      generatedAt: new Date().toISOString(),
      generationDuration: Date.now() - startTime,
      warnings,
    };

    this.emit('generation_completed', reportId, {
      duration: report.generationDuration,
      sectionCount: sections.length,
    });

    return report;
  }

  /**
   * Render a single section
   */
  private renderSection(
    config: ReportSectionConfig,
    data: ReportData,
    colors: ReportColors,
    reportConfig: ReportConfig
  ): RenderedSection | null {
    const sectionId = config.id || config.type;

    switch (config.type) {
      case 'header':
        return this.renderHeader(sectionId, config, data, colors, reportConfig);
      case 'summary':
        return this.renderSummary(sectionId, config, data, colors);
      case 'clinical_findings':
        return this.renderClinicalFindings(sectionId, config, data, colors);
      case 'drug_responses':
        return this.renderDrugResponses(sectionId, config, data, colors);
      case 'trait_associations':
        return this.renderTraitAssociations(sectionId, config, data, colors);
      case 'ancestry':
        return this.renderAncestry(sectionId, config, data, colors);
      case 'risk_factors':
        return this.renderRiskFactors(sectionId, config, data, colors);
      case 'recommendations':
        return this.renderRecommendations(sectionId, config, data, colors);
      case 'methodology':
        return this.renderMethodology(sectionId, config, data, colors);
      case 'limitations':
        return this.renderLimitations(sectionId, config, colors, reportConfig);
      case 'references':
        return this.renderReferences(sectionId, config, data, colors);
      case 'appendix':
        return this.renderAppendix(sectionId, config, data, colors);
      case 'custom':
        return this.renderCustomSection(sectionId, config, colors);
      default:
        return null;
    }
  }

  /**
   * Render header section
   */
  private renderHeader(
    id: string,
    config: ReportSectionConfig,
    data: ReportData,
    colors: ReportColors,
    reportConfig: ReportConfig
  ): RenderedSection {
    const html = `
      <div class="report-header" style="text-align: center; padding: 40px 0; border-bottom: 2px solid ${colors.primary};">
        ${reportConfig.logo ? `<img src="${reportConfig.logo}" alt="Logo" style="max-height: 60px; margin-bottom: 20px;">` : ''}
        <h1 style="color: ${colors.primary}; font-size: 28px; margin: 0;">${reportConfig.title}</h1>
        ${reportConfig.subtitle ? `<p style="color: ${colors.textLight}; font-size: 16px; margin-top: 8px;">${reportConfig.subtitle}</p>` : ''}
        ${data.subject?.name ? `<p style="margin-top: 20px;"><strong>Subject:</strong> ${data.subject.name}</p>` : ''}
        ${reportConfig.includeDate ? `<p style="color: ${colors.textLight};"><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>` : ''}
        <p style="color: ${colors.textLight};"><strong>Analysis ID:</strong> ${data.analysis.analysisId}</p>
      </div>
    `;

    const markdown = `
# ${reportConfig.title}

${reportConfig.subtitle || ''}

${data.subject?.name ? `**Subject:** ${data.subject.name}` : ''}
**Analysis ID:** ${data.analysis.analysisId}
${reportConfig.includeDate ? `**Generated:** ${new Date().toLocaleDateString()}` : ''}
    `.trim();

    return { id, type: 'header', title: config.title, html, markdown };
  }

  /**
   * Render summary section
   */
  private renderSummary(
    id: string,
    config: ReportSectionConfig,
    data: ReportData,
    colors: ReportColors
  ): RenderedSection {
    const { summary } = data;

    const html = `
      <div class="section summary">
        <h2 style="color: ${colors.primary};">${config.title}</h2>
        ${config.subtitle ? `<p style="color: ${colors.textLight};">${config.subtitle}</p>` : ''}

        <div class="summary-stats" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0;">
          <div class="stat-card" style="padding: 20px; background: ${colors.background}; border: 1px solid ${colors.border}; border-radius: 8px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: ${colors.primary};">${summary.totalFindings}</div>
            <div style="color: ${colors.textLight};">Total Findings</div>
          </div>
          <div class="stat-card" style="padding: 20px; background: ${colors.background}; border: 1px solid ${colors.border}; border-radius: 8px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: ${colors.warning};">${summary.highPriorityCount}</div>
            <div style="color: ${colors.textLight};">High Priority</div>
          </div>
          <div class="stat-card" style="padding: 20px; background: ${colors.background}; border: 1px solid ${colors.border}; border-radius: 8px; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: ${colors.accent};">${summary.actionableCount}</div>
            <div style="color: ${colors.textLight};">Actionable</div>
          </div>
        </div>

        ${summary.highlights.length > 0 ? `
        <h3>Key Highlights</h3>
        <ul>
          ${summary.highlights.map((h) => `<li>${h}</li>`).join('')}
        </ul>
        ` : ''}
      </div>
    `;

    const markdown = `
## ${config.title}

${config.subtitle || ''}

### Overview

- **Total Findings:** ${summary.totalFindings}
- **Clinical Findings:** ${summary.clinicalFindingsCount}
- **High Priority:** ${summary.highPriorityCount}
- **Drug Responses:** ${summary.drugResponsesCount}
- **Trait Associations:** ${summary.traitAssociationsCount}
- **Actionable:** ${summary.actionableCount}

${summary.highlights.length > 0 ? `### Key Highlights\n\n${summary.highlights.map((h) => `- ${h}`).join('\n')}` : ''}
    `.trim();

    return { id, type: 'summary', title: config.title, html, markdown };
  }

  /**
   * Render clinical findings section
   */
  private renderClinicalFindings(
    id: string,
    config: ReportSectionConfig,
    data: ReportData,
    colors: ReportColors
  ): RenderedSection {
    const { clinicalFindings } = data;

    const getSignificanceColor = (sig: string): string => {
      const sigColors: Record<string, string> = {
        pathogenic: colors.danger,
        likely_pathogenic: '#f97316',
        uncertain_significance: colors.warning,
        likely_benign: colors.info,
        benign: colors.success,
        risk_factor: '#8b5cf6',
        protective: '#06b6d4',
      };
      return sigColors[sig] || colors.text;
    };

    const findingsHtml = clinicalFindings.map((f) => `
      <div class="finding-card" style="padding: 16px; border: 1px solid ${colors.border}; border-left: 4px solid ${getSignificanceColor(f.significance)}; margin-bottom: 16px; border-radius: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <strong style="font-size: 16px;">${f.condition}</strong>
            ${f.gene ? `<span style="color: ${colors.textLight}; margin-left: 8px;">(${f.gene})</span>` : ''}
          </div>
          <span style="background: ${getSignificanceColor(f.significance)}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
            ${f.significance.replace(/_/g, ' ')}
          </span>
        </div>
        <div style="margin-top: 8px; color: ${colors.textLight};">
          <span><strong>Variant:</strong> ${f.rsid}</span>
          <span style="margin-left: 16px;"><strong>Genotype:</strong> ${f.genotype}</span>
        </div>
        <p style="margin-top: 8px;">${f.description}</p>
        ${f.recommendations && f.recommendations.length > 0 ? `
          <div style="margin-top: 8px; padding: 8px; background: ${colors.info}10; border-radius: 4px;">
            <strong>Recommendations:</strong>
            <ul style="margin: 4px 0 0 20px; padding: 0;">
              ${f.recommendations.map((r) => `<li>${r}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `).join('');

    const html = `
      <div class="section clinical-findings">
        <h2 style="color: ${colors.primary};">${config.title}</h2>
        ${config.subtitle ? `<p style="color: ${colors.textLight};">${config.subtitle}</p>` : ''}
        ${clinicalFindings.length === 0
          ? '<p>No significant clinical findings were identified.</p>'
          : findingsHtml}
      </div>
    `;

    const markdown = `
## ${config.title}

${config.subtitle || ''}

${clinicalFindings.length === 0
  ? 'No significant clinical findings were identified.'
  : clinicalFindings.map((f) => `
### ${f.condition}${f.gene ? ` (${f.gene})` : ''}

- **Variant:** ${f.rsid}
- **Genotype:** ${f.genotype}
- **Significance:** ${f.significance.replace(/_/g, ' ')}
- **Risk Level:** ${f.riskLevel}
- **Evidence:** ${f.evidenceLevel}

${f.description}

${f.recommendations && f.recommendations.length > 0 ? `**Recommendations:**\n${f.recommendations.map((r) => `- ${r}`).join('\n')}` : ''}
  `).join('\n---\n')}
    `.trim();

    return { id, type: 'clinical_findings', title: config.title, html, markdown };
  }

  /**
   * Render drug responses section
   */
  private renderDrugResponses(
    id: string,
    config: ReportSectionConfig,
    data: ReportData,
    colors: ReportColors
  ): RenderedSection {
    const { drugResponses } = data;

    const getPhenotypeColor = (phenotype: string): string => {
      const phenotypeColors: Record<string, string> = {
        poor_metabolizer: colors.danger,
        intermediate_metabolizer: colors.warning,
        normal_metabolizer: colors.success,
        rapid_metabolizer: colors.info,
        ultrarapid_metabolizer: colors.accent,
      };
      return phenotypeColors[phenotype] || colors.text;
    };

    const responsesHtml = drugResponses.map((r) => `
      <div class="drug-response-card" style="padding: 16px; border: 1px solid ${colors.border}; margin-bottom: 16px; border-radius: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <strong style="font-size: 16px;">${r.drugName}</strong>
            ${r.drugClass ? `<span style="color: ${colors.textLight}; margin-left: 8px;">(${r.drugClass})</span>` : ''}
          </div>
          <span style="background: ${getPhenotypeColor(r.phenotype)}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
            ${r.phenotype.replace(/_/g, ' ')}
          </span>
        </div>
        <div style="margin-top: 8px; color: ${colors.textLight};">
          <span><strong>Gene:</strong> ${r.gene}</span>
          <span style="margin-left: 16px;"><strong>Genotype:</strong> ${r.genotype}</span>
        </div>
        <p style="margin-top: 8px;"><strong>Recommendation:</strong> ${r.recommendation}</p>
        ${r.dosingGuidance ? `<p><strong>Dosing Guidance:</strong> ${r.dosingGuidance}</p>` : ''}
        ${r.guidelineSource ? `<p style="color: ${colors.textLight}; font-size: 12px;"><strong>Source:</strong> ${r.guidelineSource}</p>` : ''}
      </div>
    `).join('');

    const html = `
      <div class="section drug-responses">
        <h2 style="color: ${colors.primary};">${config.title}</h2>
        ${config.subtitle ? `<p style="color: ${colors.textLight};">${config.subtitle}</p>` : ''}
        ${drugResponses.length === 0
          ? '<p>No significant pharmacogenomic findings were identified.</p>'
          : responsesHtml}
      </div>
    `;

    const markdown = `
## ${config.title}

${config.subtitle || ''}

${drugResponses.length === 0
  ? 'No significant pharmacogenomic findings were identified.'
  : drugResponses.map((r) => `
### ${r.drugName}${r.drugClass ? ` (${r.drugClass})` : ''}

- **Gene:** ${r.gene}
- **Genotype:** ${r.genotype}
- **Phenotype:** ${r.phenotype.replace(/_/g, ' ')}
- **Evidence Level:** ${r.evidenceLevel}

**Recommendation:** ${r.recommendation}

${r.dosingGuidance ? `**Dosing Guidance:** ${r.dosingGuidance}` : ''}
${r.guidelineSource ? `*Source: ${r.guidelineSource}*` : ''}
  `).join('\n---\n')}
    `.trim();

    return { id, type: 'drug_responses', title: config.title, html, markdown };
  }

  /**
   * Render trait associations section
   */
  private renderTraitAssociations(
    id: string,
    config: ReportSectionConfig,
    data: ReportData,
    colors: ReportColors
  ): RenderedSection {
    const { traitAssociations } = data;

    // Group by category
    const byCategory = new Map<string, TraitAssociation[]>();
    for (const trait of traitAssociations) {
      const category = trait.category;
      const existing = byCategory.get(category) || [];
      existing.push(trait);
      byCategory.set(category, existing);
    }

    const categoriesHtml = Array.from(byCategory.entries()).map(([category, traits]) => `
      <div class="trait-category" style="margin-bottom: 24px;">
        <h3 style="color: ${colors.secondary}; text-transform: capitalize;">${category}</h3>
        ${traits.map((t) => `
          <div class="trait-card" style="padding: 12px; border: 1px solid ${colors.border}; margin-bottom: 8px; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between;">
              <strong>${t.traitName}</strong>
              <span style="color: ${t.effectDirection === 'increased' ? colors.warning : t.effectDirection === 'decreased' ? colors.info : colors.textLight};">
                ${t.effectDirection}
              </span>
            </div>
            <p style="margin: 8px 0; color: ${colors.text};">${t.effect}</p>
            <div style="color: ${colors.textLight}; font-size: 12px;">
              ${t.rsid} | ${t.genotype}${t.gene ? ` | ${t.gene}` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `).join('');

    const html = `
      <div class="section trait-associations">
        <h2 style="color: ${colors.primary};">${config.title}</h2>
        ${config.subtitle ? `<p style="color: ${colors.textLight};">${config.subtitle}</p>` : ''}
        ${traitAssociations.length === 0
          ? '<p>No trait associations were identified.</p>'
          : categoriesHtml}
      </div>
    `;

    const markdown = `
## ${config.title}

${config.subtitle || ''}

${traitAssociations.length === 0
  ? 'No trait associations were identified.'
  : Array.from(byCategory.entries()).map(([category, traits]) => `
### ${category.charAt(0).toUpperCase() + category.slice(1)}

${traits.map((t) => `
#### ${t.traitName}

- **Effect:** ${t.effect}
- **Direction:** ${t.effectDirection}
- **Variant:** ${t.rsid} (${t.genotype})
${t.gene ? `- **Gene:** ${t.gene}` : ''}
- **Confidence:** ${t.confidence}
`).join('\n')}
  `).join('\n')}
    `.trim();

    return { id, type: 'trait_associations', title: config.title, html, markdown };
  }

  /**
   * Render ancestry section
   */
  private renderAncestry(
    id: string,
    config: ReportSectionConfig,
    data: ReportData,
    colors: ReportColors
  ): RenderedSection {
    const { ancestry } = data;

    if (!ancestry) {
      return {
        id,
        type: 'ancestry',
        title: config.title,
        html: '<p>Ancestry analysis not available.</p>',
        markdown: 'Ancestry analysis not available.',
      };
    }

    const html = `
      <div class="section ancestry">
        <h2 style="color: ${colors.primary};">${config.title}</h2>

        <h3>Population Composition</h3>
        <div class="ancestry-breakdown" style="margin: 20px 0;">
          ${ancestry.populations.map((p) => `
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <div style="width: 120px; font-weight: 500;">${p.population}</div>
              <div style="flex: 1; background: ${colors.border}; border-radius: 4px; height: 20px; margin: 0 12px;">
                <div style="width: ${p.percentage}%; background: ${colors.primary}; height: 100%; border-radius: 4px;"></div>
              </div>
              <div style="width: 60px; text-align: right;">${p.percentage.toFixed(1)}%</div>
            </div>
          `).join('')}
        </div>

        ${ancestry.maternalHaplogroup || ancestry.paternalHaplogroup ? `
          <h3>Haplogroups</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0;">
            ${ancestry.maternalHaplogroup ? `
              <div style="padding: 16px; border: 1px solid ${colors.border}; border-radius: 4px;">
                <div style="color: ${colors.textLight};">Maternal (mtDNA)</div>
                <div style="font-size: 24px; font-weight: bold; color: ${colors.primary};">${ancestry.maternalHaplogroup}</div>
              </div>
            ` : ''}
            ${ancestry.paternalHaplogroup ? `
              <div style="padding: 16px; border: 1px solid ${colors.border}; border-radius: 4px;">
                <div style="color: ${colors.textLight};">Paternal (Y-DNA)</div>
                <div style="font-size: 24px; font-weight: bold; color: ${colors.primary};">${ancestry.paternalHaplogroup}</div>
              </div>
            ` : ''}
          </div>
        ` : ''}

        ${ancestry.neanderthalPercentage !== undefined ? `
          <h3>Neanderthal Ancestry</h3>
          <p>Your DNA contains approximately <strong>${ancestry.neanderthalPercentage.toFixed(1)}%</strong> Neanderthal variants.</p>
        ` : ''}
      </div>
    `;

    const markdown = `
## ${config.title}

### Population Composition

${ancestry.populations.map((p) => `- **${p.population}:** ${p.percentage.toFixed(1)}%`).join('\n')}

${ancestry.maternalHaplogroup ? `\n### Maternal Haplogroup (mtDNA)\n${ancestry.maternalHaplogroup}` : ''}

${ancestry.paternalHaplogroup ? `\n### Paternal Haplogroup (Y-DNA)\n${ancestry.paternalHaplogroup}` : ''}

${ancestry.neanderthalPercentage !== undefined ? `\n### Neanderthal Ancestry\nApproximately ${ancestry.neanderthalPercentage.toFixed(1)}% Neanderthal variants` : ''}
    `.trim();

    return { id, type: 'ancestry', title: config.title, html, markdown };
  }

  /**
   * Render risk factors section
   */
  private renderRiskFactors(
    id: string,
    config: ReportSectionConfig,
    data: ReportData,
    colors: ReportColors
  ): RenderedSection {
    const { riskFactors } = data;

    const getRiskColor = (risk: string): string => {
      const riskColors: Record<string, string> = {
        high: colors.danger,
        moderate: colors.warning,
        low: colors.info,
        protective: colors.success,
      };
      return riskColors[risk] || colors.textLight;
    };

    const html = `
      <div class="section risk-factors">
        <h2 style="color: ${colors.primary};">${config.title}</h2>
        ${riskFactors.length === 0
          ? '<p>No significant risk factors were identified.</p>'
          : riskFactors.map((rf) => `
            <div class="risk-card" style="padding: 16px; border: 1px solid ${colors.border}; border-left: 4px solid ${getRiskColor(rf.overallRisk)}; margin-bottom: 16px; border-radius: 4px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="font-size: 16px;">${rf.condition}</strong>
                <span style="background: ${getRiskColor(rf.overallRisk)}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; text-transform: capitalize;">
                  ${rf.overallRisk} Risk
                </span>
              </div>
              ${rf.populationComparison ? `<p style="margin-top: 8px;">${rf.populationComparison}</p>` : ''}
              ${rf.modifiableFactors && rf.modifiableFactors.length > 0 ? `
                <div style="margin-top: 8px;">
                  <strong>Modifiable Factors:</strong>
                  <ul style="margin: 4px 0 0 20px; padding: 0;">
                    ${rf.modifiableFactors.map((f) => `<li>${f}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          `).join('')}
      </div>
    `;

    const markdown = `
## ${config.title}

${riskFactors.length === 0
  ? 'No significant risk factors were identified.'
  : riskFactors.map((rf) => `
### ${rf.condition}

**Risk Level:** ${rf.overallRisk}
${rf.relativeRisk ? `**Relative Risk:** ${rf.relativeRisk}x` : ''}
${rf.populationComparison ? `\n${rf.populationComparison}` : ''}

${rf.modifiableFactors && rf.modifiableFactors.length > 0 ? `**Modifiable Factors:**\n${rf.modifiableFactors.map((f) => `- ${f}`).join('\n')}` : ''}
  `).join('\n---\n')}
    `.trim();

    return { id, type: 'risk_factors', title: config.title, html, markdown };
  }

  /**
   * Render recommendations section
   */
  private renderRecommendations(
    id: string,
    config: ReportSectionConfig,
    data: ReportData,
    colors: ReportColors
  ): RenderedSection {
    const { recommendations } = data;

    const getPriorityColor = (priority: string): string => {
      const priorityColors: Record<string, string> = {
        high: colors.danger,
        medium: colors.warning,
        low: colors.info,
      };
      return priorityColors[priority] || colors.textLight;
    };

    // Group by priority
    const byPriority = new Map<string, Recommendation[]>();
    for (const rec of recommendations) {
      const priority = rec.priority;
      const existing = byPriority.get(priority) || [];
      existing.push(rec);
      byPriority.set(priority, existing);
    }

    const priorityOrder = ['high', 'medium', 'low'];
    const html = `
      <div class="section recommendations">
        <h2 style="color: ${colors.primary};">${config.title}</h2>
        ${config.subtitle ? `<p style="color: ${colors.textLight};">${config.subtitle}</p>` : ''}
        ${recommendations.length === 0
          ? '<p>No specific recommendations at this time.</p>'
          : priorityOrder.map((priority) => {
              const recs = byPriority.get(priority);
              if (!recs || recs.length === 0) return '';
              return `
                <h3 style="color: ${getPriorityColor(priority)}; text-transform: capitalize;">${priority} Priority</h3>
                ${recs.map((r) => `
                  <div class="recommendation-card" style="padding: 16px; border: 1px solid ${colors.border}; margin-bottom: 12px; border-radius: 4px;">
                    <strong>${r.title}</strong>
                    <p style="margin: 8px 0;">${r.description}</p>
                    <div style="color: ${colors.textLight}; font-size: 12px;">
                      Category: ${r.category} | Action: ${r.actionType}
                    </div>
                  </div>
                `).join('')}
              `;
            }).join('')}
      </div>
    `;

    const markdown = `
## ${config.title}

${config.subtitle || ''}

${recommendations.length === 0
  ? 'No specific recommendations at this time.'
  : priorityOrder.map((priority) => {
      const recs = byPriority.get(priority);
      if (!recs || recs.length === 0) return '';
      return `
### ${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority

${recs.map((r) => `
#### ${r.title}

${r.description}

*Category: ${r.category} | Action: ${r.actionType}*
`).join('\n')}
      `;
    }).join('')}
    `.trim();

    return { id, type: 'recommendations', title: config.title, html, markdown };
  }

  /**
   * Render methodology section
   */
  private renderMethodology(
    id: string,
    config: ReportSectionConfig,
    data: ReportData,
    colors: ReportColors
  ): RenderedSection {
    const { analysis } = data;

    const html = `
      <div class="section methodology">
        <h2 style="color: ${colors.primary};">${config.title}</h2>
        ${config.subtitle ? `<p style="color: ${colors.textLight};">${config.subtitle}</p>` : ''}

        <h3>Analysis Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border: 1px solid ${colors.border};"><strong>Analysis ID</strong></td>
            <td style="padding: 8px; border: 1px solid ${colors.border};">${analysis.analysisId}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid ${colors.border};"><strong>Analysis Date</strong></td>
            <td style="padding: 8px; border: 1px solid ${colors.border};">${analysis.date}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid ${colors.border};"><strong>File Format</strong></td>
            <td style="padding: 8px; border: 1px solid ${colors.border};">${analysis.fileFormat}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid ${colors.border};"><strong>Genome Build</strong></td>
            <td style="padding: 8px; border: 1px solid ${colors.border};">${analysis.genomeBuild}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid ${colors.border};"><strong>Total Variants</strong></td>
            <td style="padding: 8px; border: 1px solid ${colors.border};">${analysis.totalVariants.toLocaleString()}</td>
          </tr>
          ${analysis.qualityScore !== undefined ? `
          <tr>
            <td style="padding: 8px; border: 1px solid ${colors.border};"><strong>Quality Score</strong></td>
            <td style="padding: 8px; border: 1px solid ${colors.border};">${analysis.qualityScore}%</td>
          </tr>
          ` : ''}
          ${analysis.callRate !== undefined ? `
          <tr>
            <td style="padding: 8px; border: 1px solid ${colors.border};"><strong>Call Rate</strong></td>
            <td style="padding: 8px; border: 1px solid ${colors.border};">${analysis.callRate}%</td>
          </tr>
          ` : ''}
        </table>

        <h3>Databases Used</h3>
        <ul>
          ${analysis.databasesUsed.map((db) => `<li>${db}</li>`).join('')}
        </ul>

        <p style="margin-top: 20px; color: ${colors.textLight};">
          <strong>Analysis Version:</strong> ${analysis.analysisVersion}
        </p>
      </div>
    `;

    const markdown = `
## ${config.title}

${config.subtitle || ''}

### Analysis Details

| Parameter | Value |
|-----------|-------|
| Analysis ID | ${analysis.analysisId} |
| Analysis Date | ${analysis.date} |
| File Format | ${analysis.fileFormat} |
| Genome Build | ${analysis.genomeBuild} |
| Total Variants | ${analysis.totalVariants.toLocaleString()} |
${analysis.qualityScore !== undefined ? `| Quality Score | ${analysis.qualityScore}% |` : ''}
${analysis.callRate !== undefined ? `| Call Rate | ${analysis.callRate}% |` : ''}

### Databases Used

${analysis.databasesUsed.map((db) => `- ${db}`).join('\n')}

*Analysis Version: ${analysis.analysisVersion}*
    `.trim();

    return { id, type: 'methodology', title: config.title, html, markdown };
  }

  /**
   * Render limitations section
   */
  private renderLimitations(
    id: string,
    config: ReportSectionConfig,
    colors: ReportColors,
    reportConfig: ReportConfig
  ): RenderedSection {
    const limitations = [
      'Genetic testing has inherent limitations and may not detect all genetic variants associated with a condition.',
      'Results should be interpreted in the context of family history, clinical findings, and other diagnostic tests.',
      'Genetic variants may have different effects in different populations.',
      'New scientific discoveries may change the interpretation of results over time.',
      'This report is not a diagnosis. Please consult with a healthcare provider for medical advice.',
    ];

    const disclaimers = [
      'This report is for informational purposes only and is not intended to diagnose, treat, cure, or prevent any disease.',
      'The information provided does not replace professional medical advice, diagnosis, or treatment.',
      'Individual results may vary based on genetic background, environment, and other factors.',
    ];

    const html = `
      <div class="section limitations">
        <h2 style="color: ${colors.primary};">${config.title}</h2>

        <h3>Limitations</h3>
        <ul>
          ${limitations.map((l) => `<li style="margin-bottom: 8px;">${l}</li>`).join('')}
        </ul>

        ${reportConfig.includeDisclaimers ? `
          <h3>Disclaimers</h3>
          <ul>
            ${disclaimers.map((d) => `<li style="margin-bottom: 8px;">${d}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    `;

    const markdown = `
## ${config.title}

### Limitations

${limitations.map((l) => `- ${l}`).join('\n')}

${reportConfig.includeDisclaimers ? `
### Disclaimers

${disclaimers.map((d) => `- ${d}`).join('\n')}
` : ''}
    `.trim();

    return { id, type: 'limitations', title: config.title, html, markdown };
  }

  /**
   * Render references section
   */
  private renderReferences(
    id: string,
    config: ReportSectionConfig,
    data: ReportData,
    colors: ReportColors
  ): RenderedSection {
    // Collect all references
    const allRefs = new Map<string, Reference>();

    for (const finding of data.clinicalFindings) {
      if (finding.references) {
        for (const ref of finding.references) {
          allRefs.set(ref.id, ref);
        }
      }
    }

    for (const response of data.drugResponses) {
      if (response.references) {
        for (const ref of response.references) {
          allRefs.set(ref.id, ref);
        }
      }
    }

    const references = Array.from(allRefs.values());

    const html = `
      <div class="section references">
        <h2 style="color: ${colors.primary};">${config.title}</h2>
        ${references.length === 0
          ? '<p>No specific references for this report.</p>'
          : `<ol>
              ${references.map((ref) => `
                <li style="margin-bottom: 8px;">
                  ${ref.authors ? `${ref.authors}. ` : ''}
                  ${ref.title ? `<em>${ref.title}</em>. ` : ''}
                  ${ref.journal ? `${ref.journal}. ` : ''}
                  ${ref.year ? `${ref.year}. ` : ''}
                  ${ref.url ? `<a href="${ref.url}" target="_blank">${ref.type === 'pubmed' ? `PMID: ${ref.id}` : ref.id}</a>` : ref.id}
                </li>
              `).join('')}
            </ol>`}
      </div>
    `;

    const markdown = `
## ${config.title}

${references.length === 0
  ? 'No specific references for this report.'
  : references.map((ref, i) => `${i + 1}. ${ref.authors ? `${ref.authors}. ` : ''}${ref.title ? `*${ref.title}*. ` : ''}${ref.journal ? `${ref.journal}. ` : ''}${ref.year ? `${ref.year}. ` : ''}${ref.type === 'pubmed' ? `PMID: ${ref.id}` : ref.id}`).join('\n')}
    `.trim();

    return { id, type: 'references', title: config.title, html, markdown };
  }

  /**
   * Render appendix section
   */
  private renderAppendix(
    id: string,
    config: ReportSectionConfig,
    data: ReportData,
    colors: ReportColors
  ): RenderedSection {
    const html = `
      <div class="section appendix">
        <h2 style="color: ${colors.primary};">${config.title}</h2>
        ${config.subtitle ? `<p style="color: ${colors.textLight};">${config.subtitle}</p>` : ''}

        <h3>All Variants Analyzed</h3>
        <p>Total variants: ${data.analysis.totalVariants.toLocaleString()}</p>

        <h3>Detailed Findings Table</h3>
        <p>Clinical findings: ${data.clinicalFindings.length}</p>
        <p>Drug responses: ${data.drugResponses.length}</p>
        <p>Trait associations: ${data.traitAssociations.length}</p>
      </div>
    `;

    const markdown = `
## ${config.title}

${config.subtitle || ''}

### All Variants Analyzed

Total variants: ${data.analysis.totalVariants.toLocaleString()}

### Detailed Findings

- Clinical findings: ${data.clinicalFindings.length}
- Drug responses: ${data.drugResponses.length}
- Trait associations: ${data.traitAssociations.length}
    `.trim();

    return { id, type: 'appendix', title: config.title, html, markdown };
  }

  /**
   * Render custom section
   */
  private renderCustomSection(
    id: string,
    config: ReportSectionConfig,
    colors: ReportColors
  ): RenderedSection {
    const html = `
      <div class="section custom">
        <h2 style="color: ${colors.primary};">${config.title}</h2>
        ${config.subtitle ? `<p style="color: ${colors.textLight};">${config.subtitle}</p>` : ''}
        ${config.customContent || '<p>Custom content not provided.</p>'}
      </div>
    `;

    const markdown = `
## ${config.title}

${config.subtitle || ''}

${config.customContent || 'Custom content not provided.'}
    `.trim();

    return { id, type: 'custom', title: config.title, html, markdown };
  }
}

/**
 * Create a singleton report generator instance
 */
let defaultReportGenerator: ReportGenerator | null = null;

export function getReportGenerator(): ReportGenerator {
  if (!defaultReportGenerator) {
    defaultReportGenerator = new ReportGenerator();
  }
  return defaultReportGenerator;
}
