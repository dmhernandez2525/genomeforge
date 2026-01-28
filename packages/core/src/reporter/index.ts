/**
 * Report generation module
 *
 * Generates comprehensive genetic reports from analysis results including:
 * - Exhaustive genetic reports with all findings
 * - Disease risk reports focused on pathogenic variants
 * - Pharmacogenomics reports for drug interactions
 * - Health protocol recommendations
 *
 * @packageDocumentation
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  Report,
  ReportType,
  ReportSection,
  ReportGenerationOptions,
  ReportMetadata,
  SummaryContent,
  RiskTableContent,
  RiskRow,
  VariantListContent,
  VariantEntry,
  DrugInteractionContent,
  DrugEntry,
  RecommendationContent,
  RecommendationItem,
  TechnicalContent,
  TechnicalDetail,
  RiskLevel
} from '@genomeforge/types';

import type {
  EnhancedAnalysisResult,
  MatchResult,
  RiskAssessment,
  EnhancedMetabolizerPhenotype,
  PolygenicRiskScore
} from '@genomeforge/types';

// ============================================================================
// Constants
// ============================================================================

const REPORT_TITLES: Record<ReportType, string> = {
  exhaustive_genetic: 'Comprehensive Genetic Analysis Report',
  disease_risk: 'Disease Risk Assessment Report',
  health_protocol: 'Personalized Health Protocol',
  pharmacogenomics: 'Pharmacogenomics Report'
};

const REPORT_DESCRIPTIONS: Record<ReportType, string> = {
  exhaustive_genetic: 'A complete analysis of your genetic data including disease risks, drug interactions, carrier statuses, and trait associations.',
  disease_risk: 'An assessment of genetic variants associated with disease risk, including pathogenic and likely pathogenic findings.',
  health_protocol: 'Personalized health recommendations based on your genetic profile, including lifestyle and preventive measures.',
  pharmacogenomics: 'Analysis of how your genetics may affect your response to medications, including dosing recommendations.'
};

// ============================================================================
// Types
// ============================================================================

export interface ReportGeneratorInput {
  analysisResult: EnhancedAnalysisResult;
  matchResult: MatchResult;
}

// ============================================================================
// Report Generator Class
// ============================================================================

export class ReportGenerator {
  private analysisResult: EnhancedAnalysisResult;
  private matchResult: MatchResult;
  private options: Required<ReportGenerationOptions>;

  constructor(input: ReportGeneratorInput, options: ReportGenerationOptions) {
    this.analysisResult = input.analysisResult;
    this.matchResult = input.matchResult;
    this.options = {
      type: options.type,
      filename: options.filename || `${options.type}_report_${Date.now()}`,
      includeTechnical: options.includeTechnical ?? true,
      maxVariantsPerSection: options.maxVariantsPerSection ?? 50
    };
  }

  /**
   * Generate a report based on the configured type
   */
  generate(): Report {
    const sections: ReportSection[] = [];
    let order = 0;

    // Always include summary
    sections.push(this.createSummarySection(order++));

    // Type-specific sections
    switch (this.options.type) {
      case 'exhaustive_genetic':
        sections.push(...this.createExhaustiveSections(order));
        break;
      case 'disease_risk':
        sections.push(...this.createDiseaseRiskSections(order));
        break;
      case 'health_protocol':
        sections.push(...this.createHealthProtocolSections(order));
        break;
      case 'pharmacogenomics':
        sections.push(...this.createPharmacogenomicsSections(order));
        break;
    }

    // Add technical appendix if requested
    if (this.options.includeTechnical) {
      sections.push(this.createTechnicalSection(sections.length));
    }

    return {
      id: uuidv4(),
      type: this.options.type,
      title: REPORT_TITLES[this.options.type],
      generatedAt: new Date(),
      genomeId: this.analysisResult.genomeId,
      sections,
      metadata: this.createMetadata()
    };
  }

  // ============================================================================
  // Summary Section
  // ============================================================================

  private createSummarySection(order: number): ReportSection {
    const summary = this.analysisResult.summary;
    const highlights: string[] = [];

    // Build highlights based on findings
    if (summary.highRiskCount > 0) {
      highlights.push(`${summary.highRiskCount} high-risk finding(s) requiring attention`);
    }

    if (summary.moderateRiskCount > 0) {
      highlights.push(`${summary.moderateRiskCount} moderate-risk finding(s) identified`);
    }

    if (summary.pharmacogeneCount > 0) {
      highlights.push(`${summary.pharmacogeneCount} pharmacogene(s) with actionable drug interactions`);
    }

    if (summary.carrierCount > 0) {
      highlights.push(`${summary.carrierCount} carrier status(es) detected`);
    }

    if (summary.traitAssociationCount > 0) {
      highlights.push(`${summary.traitAssociationCount} trait association(s) from GWAS studies`);
    }

    if (summary.prsCount > 0) {
      highlights.push(`${summary.prsCount} polygenic risk score(s) calculated`);
    }

    // Add key findings
    for (const finding of summary.keyFindings.slice(0, 3)) {
      if (finding.priority === 'urgent') {
        highlights.push(`URGENT: ${finding.title}`);
      }
    }

    const content: SummaryContent = {
      type: 'summary',
      text: this.generateSummaryText(),
      highlights
    };

    return {
      id: uuidv4(),
      title: 'Executive Summary',
      type: 'summary',
      content,
      order
    };
  }

  private generateSummaryText(): string {
    const summary = this.analysisResult.summary;
    const totalVariants = summary.totalVariantsAnalyzed;

    let text = `This report analyzes ${totalVariants.toLocaleString()} genetic variants from your genome data. `;
    text += REPORT_DESCRIPTIONS[this.options.type] + '\n\n';

    if (summary.highRiskCount > 0) {
      text += `**Important:** ${summary.highRiskCount} high-risk genetic finding(s) were identified that may warrant discussion with a healthcare provider or genetic counselor. `;
    }

    if (summary.pharmacogeneCount > 0) {
      text += `Your genetic profile affects how you may respond to ${summary.pharmacogeneCount} drug category(ies). Share this information with your healthcare providers before starting new medications. `;
    }

    if (summary.carrierCount > 0) {
      text += `You are identified as a carrier for ${summary.carrierCount} condition(s). This information may be relevant for family planning discussions. `;
    }

    text += '\n\n**Disclaimer:** This report is for informational purposes only and should not be used for medical diagnosis. ';
    text += 'Always consult with qualified healthcare professionals for medical advice.';

    return text;
  }

  // ============================================================================
  // Exhaustive Genetic Report Sections
  // ============================================================================

  private createExhaustiveSections(startOrder: number): ReportSection[] {
    const sections: ReportSection[] = [];
    let order = startOrder;

    // Risk assessment table
    if (this.analysisResult.riskAssessments.length > 0) {
      sections.push(this.createRiskTableSection(order++));
    }

    // Pathogenic variants list
    const pathogenicVariants = this.getPathogenicVariants();
    if (pathogenicVariants.length > 0) {
      sections.push(this.createVariantListSection(
        'Pathogenic Variants',
        'pathogenic',
        pathogenicVariants,
        order++
      ));
    }

    // Drug interactions
    if (this.analysisResult.metabolizerPhenotypes.length > 0) {
      sections.push(...this.createDrugInteractionSections(order));
      order += this.analysisResult.metabolizerPhenotypes.length;
    }

    // Carrier statuses
    if (this.analysisResult.carrierStatuses.length > 0) {
      sections.push(this.createCarrierStatusSection(order++));
    }

    // Trait associations
    if (this.analysisResult.traitAssociations.length > 0) {
      sections.push(this.createTraitAssociationSection(order++));
    }

    // Polygenic risk scores
    if (this.analysisResult.polygenicRiskScores.length > 0) {
      sections.push(this.createPRSSection(order++));
    }

    return sections;
  }

  // ============================================================================
  // Disease Risk Report Sections
  // ============================================================================

  private createDiseaseRiskSections(startOrder: number): ReportSection[] {
    const sections: ReportSection[] = [];
    let order = startOrder;

    // High-risk findings
    const highRisk = this.analysisResult.riskAssessments.filter(r => r.riskLevel === 'high');
    if (highRisk.length > 0) {
      sections.push(this.createRiskTableSection(order++, 'high'));
      sections.push(this.createVariantListSection(
        'High-Risk Variants',
        'high_risk',
        this.getVariantsForRiskLevel('high'),
        order++
      ));
    }

    // Moderate-risk findings
    const moderateRisk = this.analysisResult.riskAssessments.filter(r => r.riskLevel === 'moderate');
    if (moderateRisk.length > 0) {
      sections.push(this.createRiskTableSection(order++, 'moderate'));
    }

    // Carrier statuses (relevant for disease planning)
    if (this.analysisResult.carrierStatuses.length > 0) {
      sections.push(this.createCarrierStatusSection(order++));
    }

    // PRS for disease-related traits
    const diseasePRS = this.analysisResult.polygenicRiskScores.filter(
      prs => ['very_high', 'high'].includes(prs.riskCategory)
    );
    if (diseasePRS.length > 0) {
      sections.push(this.createPRSSection(order++));
    }

    return sections;
  }

  // ============================================================================
  // Health Protocol Report Sections
  // ============================================================================

  private createHealthProtocolSections(startOrder: number): ReportSection[] {
    const sections: ReportSection[] = [];
    let order = startOrder;

    // Personalized recommendations
    sections.push(this.createRecommendationsSection(order++));

    // Risk-based monitoring
    if (this.analysisResult.riskAssessments.length > 0) {
      sections.push(this.createMonitoringRecommendationsSection(order++));
    }

    // Drug considerations
    if (this.analysisResult.metabolizerPhenotypes.length > 0) {
      sections.push(this.createMedicationConsiderationsSection(order++));
    }

    return sections;
  }

  // ============================================================================
  // Pharmacogenomics Report Sections
  // ============================================================================

  private createPharmacogenomicsSections(startOrder: number): ReportSection[] {
    const sections: ReportSection[] = [];
    let order = startOrder;

    // Drug interaction sections for each pharmacogene
    for (const phenotype of this.analysisResult.metabolizerPhenotypes) {
      sections.push(this.createDrugInteractionSectionForGene(phenotype, order++));
    }

    // Summary table of all pharmacogenes
    sections.push(this.createPharmacogeneSummarySection(order++));

    return sections;
  }

  // ============================================================================
  // Section Creators
  // ============================================================================

  private createRiskTableSection(order: number, riskLevelFilter?: RiskLevel): ReportSection {
    let assessments = this.analysisResult.riskAssessments;
    if (riskLevelFilter) {
      assessments = assessments.filter(a => a.riskLevel === riskLevelFilter);
    }

    const rows: RiskRow[] = assessments.map(assessment => ({
      condition: assessment.condition,
      gene: assessment.gene,
      riskLevel: assessment.riskLevel,
      confidence: Math.round(assessment.confidence * 4), // Convert to 0-4 stars
      notes: this.summarizeRiskAssessment(assessment)
    }));

    const content: RiskTableContent = {
      type: 'risk_table',
      rows
    };

    const title = riskLevelFilter
      ? `${this.capitalize(riskLevelFilter)}-Risk Conditions`
      : 'Disease Risk Assessment';

    return {
      id: uuidv4(),
      title,
      type: 'risk_table',
      content,
      order
    };
  }

  private createVariantListSection(
    title: string,
    category: string,
    variants: VariantEntry[],
    order: number
  ): ReportSection {
    const content: VariantListContent = {
      type: 'variant_list',
      category,
      variants: variants.slice(0, this.options.maxVariantsPerSection)
    };

    return {
      id: uuidv4(),
      title,
      type: 'variant_list',
      content,
      order
    };
  }

  private createDrugInteractionSections(startOrder: number): ReportSection[] {
    return this.analysisResult.metabolizerPhenotypes.map((phenotype, index) =>
      this.createDrugInteractionSectionForGene(phenotype, startOrder + index)
    );
  }

  private createDrugInteractionSectionForGene(
    phenotype: EnhancedMetabolizerPhenotype,
    order: number
  ): ReportSection {
    const interactions: DrugEntry[] = phenotype.affectedDrugs.map(drug => ({
      drugName: drug.drugName,
      recommendation: drug.recommendation,
      severity: this.mapSeverityToRiskLevel(drug.severity),
      evidenceLevel: drug.evidenceLevel,
      hasFDALabel: drug.hasFDALabel
    }));

    const content: DrugInteractionContent = {
      type: 'drug_interactions',
      gene: phenotype.gene,
      phenotype: this.formatPhenotype(phenotype),
      interactions
    };

    return {
      id: uuidv4(),
      title: `${phenotype.gene} Drug Interactions`,
      type: 'drug_interactions',
      content,
      order
    };
  }

  private createCarrierStatusSection(order: number): ReportSection {
    const rows: RiskRow[] = this.analysisResult.carrierStatuses.map(carrier => ({
      condition: carrier.condition,
      gene: carrier.gene,
      riskLevel: 'moderate' as RiskLevel,
      confidence: 3, // Carrier status is typically well-established
      notes: `${this.capitalize(carrier.inheritance)} inheritance. ${carrier.partnerRisk}`
    }));

    const content: RiskTableContent = {
      type: 'risk_table',
      rows
    };

    return {
      id: uuidv4(),
      title: 'Carrier Status',
      type: 'risk_table',
      content,
      order
    };
  }

  private createTraitAssociationSection(order: number): ReportSection {
    const rows: RiskRow[] = this.analysisResult.traitAssociations
      .slice(0, this.options.maxVariantsPerSection)
      .map(trait => ({
        condition: trait.trait,
        gene: `${trait.variantCount} variant(s)`,
        riskLevel: this.interpretationToRiskLevel(trait.interpretation),
        confidence: this.confidenceToStars(trait.confidence),
        notes: `${this.capitalize(trait.interpretation)} risk based on GWAS studies. Category: ${trait.category}`
      }));

    const content: RiskTableContent = {
      type: 'risk_table',
      rows
    };

    return {
      id: uuidv4(),
      title: 'Trait Associations (GWAS)',
      type: 'risk_table',
      content,
      order
    };
  }

  private createPRSSection(order: number): ReportSection {
    const rows: RiskRow[] = this.analysisResult.polygenicRiskScores.map(prs => ({
      condition: prs.trait,
      gene: `PRS: ${prs.percentile}th percentile`,
      riskLevel: this.prsRiskCategoryToLevel(prs.riskCategory),
      confidence: Math.round(prs.coverage / 25), // Convert coverage to stars
      notes: `${this.capitalize(prs.riskCategory.replace('_', ' '))} risk. ` +
        `${prs.variantsUsed} of ${prs.variantsUsed + prs.variantsMissing} variants analyzed.`
    }));

    const content: RiskTableContent = {
      type: 'risk_table',
      rows
    };

    return {
      id: uuidv4(),
      title: 'Polygenic Risk Scores',
      type: 'risk_table',
      content,
      order
    };
  }

  private createRecommendationsSection(order: number): ReportSection {
    const items: RecommendationItem[] = [];

    // Generate recommendations based on findings
    for (const risk of this.analysisResult.riskAssessments.filter(r => r.riskLevel === 'high')) {
      items.push({
        recommendation: `Consult with a healthcare provider about ${risk.condition}`,
        rationale: risk.explanation,
        relatedGenes: [risk.gene],
        priority: 'high'
      });
    }

    for (const pheno of this.analysisResult.metabolizerPhenotypes) {
      if (pheno.affectedDrugs.some(d => d.severity === 'critical')) {
        items.push({
          recommendation: `Inform healthcare providers about your ${pheno.gene} status before prescribing medications`,
          rationale: `Your ${pheno.gene} ${pheno.phenotype} status may affect how you respond to certain medications.`,
          relatedGenes: [pheno.gene],
          priority: 'high'
        });
      }
    }

    for (const carrier of this.analysisResult.carrierStatuses) {
      items.push({
        recommendation: `Consider genetic counseling for ${carrier.condition}`,
        rationale: carrier.partnerRisk,
        relatedGenes: [carrier.gene],
        priority: 'medium'
      });
    }

    // Add general health recommendations
    items.push({
      recommendation: 'Maintain regular health screenings appropriate for your age and family history',
      rationale: 'Early detection through screening can improve outcomes for many conditions.',
      relatedGenes: [],
      priority: 'medium'
    });

    const content: RecommendationContent = {
      type: 'recommendations',
      category: 'Personalized Health Recommendations',
      items
    };

    return {
      id: uuidv4(),
      title: 'Personalized Recommendations',
      type: 'recommendations',
      content,
      order
    };
  }

  private createMonitoringRecommendationsSection(order: number): ReportSection {
    const items: RecommendationItem[] = [];

    // Group risks by category for monitoring recommendations
    const highModerateRisks = this.analysisResult.riskAssessments.filter(
      r => r.riskLevel === 'high' || r.riskLevel === 'moderate'
    );

    for (const risk of highModerateRisks.slice(0, 10)) {
      items.push({
        recommendation: `Regular monitoring for ${risk.condition}`,
        rationale: `Due to identified genetic variant(s) in ${risk.gene}, regular screening may be beneficial.`,
        relatedGenes: [risk.gene],
        priority: risk.riskLevel === 'high' ? 'high' : 'medium'
      });
    }

    const content: RecommendationContent = {
      type: 'recommendations',
      category: 'Monitoring Recommendations',
      items
    };

    return {
      id: uuidv4(),
      title: 'Monitoring & Screening',
      type: 'recommendations',
      content,
      order
    };
  }

  private createMedicationConsiderationsSection(order: number): ReportSection {
    const items: RecommendationItem[] = [];

    for (const pheno of this.analysisResult.metabolizerPhenotypes) {
      const criticalDrugs = pheno.affectedDrugs.filter(d => d.severity === 'critical');
      const moderateDrugs = pheno.affectedDrugs.filter(d => d.severity === 'moderate');

      if (criticalDrugs.length > 0) {
        items.push({
          recommendation: `Avoid or use with caution: ${criticalDrugs.map(d => d.drugName).join(', ')}`,
          rationale: `Your ${pheno.gene} ${pheno.phenotype} metabolizer status significantly affects these medications.`,
          relatedGenes: [pheno.gene],
          priority: 'high'
        });
      }

      if (moderateDrugs.length > 0) {
        items.push({
          recommendation: `Monitor when taking: ${moderateDrugs.slice(0, 5).map(d => d.drugName).join(', ')}`,
          rationale: `Your ${pheno.gene} status may moderately affect response to these medications.`,
          relatedGenes: [pheno.gene],
          priority: 'medium'
        });
      }
    }

    const content: RecommendationContent = {
      type: 'recommendations',
      category: 'Medication Considerations',
      items
    };

    return {
      id: uuidv4(),
      title: 'Medication Considerations',
      type: 'recommendations',
      content,
      order
    };
  }

  private createPharmacogeneSummarySection(order: number): ReportSection {
    const rows: RiskRow[] = this.analysisResult.metabolizerPhenotypes.map(pheno => ({
      condition: pheno.gene,
      gene: this.formatPhenotype(pheno),
      riskLevel: this.phenotypeToRiskLevel(pheno.phenotype),
      confidence: pheno.cpicStatus === 'available' ? 4 : 2,
      notes: `${pheno.affectedDrugs.length} drug(s) affected. ` +
        `CPIC: ${pheno.cpicStatus || 'not available'}`
    }));

    const content: RiskTableContent = {
      type: 'risk_table',
      rows
    };

    return {
      id: uuidv4(),
      title: 'Pharmacogene Summary',
      type: 'risk_table',
      content,
      order
    };
  }

  private createTechnicalSection(order: number): ReportSection {
    const details: TechnicalDetail[] = [
      { label: 'Report Generated', value: new Date().toISOString() },
      { label: 'Genome ID', value: this.analysisResult.genomeId },
      { label: 'Build Version', value: this.matchResult.buildVersion },
      { label: 'Total SNPs', value: this.matchResult.totalSNPs.toLocaleString() },
      { label: 'Matched SNPs', value: this.matchResult.matchedSNPs.toLocaleString() },
      { label: 'ClinVar Version', value: this.analysisResult.databaseVersions?.clinvar || 'N/A' },
      { label: 'PharmGKB Version', value: this.analysisResult.databaseVersions?.pharmgkb || 'N/A' },
      { label: 'GWAS Version', value: this.analysisResult.databaseVersions?.gwas || 'N/A' },
      { label: 'Analysis Date', value: this.analysisResult.analyzedAt.toISOString() }
    ];

    const content: TechnicalContent = {
      type: 'technical',
      details
    };

    return {
      id: uuidv4(),
      title: 'Technical Appendix',
      type: 'technical',
      content,
      order
    };
  }

  private createMetadata(): ReportMetadata {
    return {
      snpCount: this.matchResult.totalSNPs,
      matchedCount: this.matchResult.matchedSNPs,
      buildVersion: this.matchResult.buildVersion,
      databaseVersions: {
        clinvar: this.analysisResult.databaseVersions?.clinvar || 'unknown',
        pharmgkb: this.analysisResult.databaseVersions?.pharmgkb || 'unknown'
      }
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private getPathogenicVariants(): VariantEntry[] {
    const entries: VariantEntry[] = [];

    for (const snp of this.matchResult.annotatedSNPs) {
      if (!snp.clinvar) continue;

      if (snp.clinvar.clinicalSignificance === 'pathogenic' ||
          snp.clinvar.clinicalSignificance === 'likely_pathogenic') {
        entries.push({
          rsid: snp.snp.rsid,
          gene: snp.clinvar.gene,
          genotype: snp.snp.genotype,
          significance: snp.clinvar.clinicalSignificance,
          condition: snp.clinvar.conditions[0]?.name || 'Unknown',
          stars: snp.clinvar.reviewStatus,
          impact: snp.impactScore
        });
      }
    }

    return entries.sort((a, b) => b.impact - a.impact);
  }

  private getVariantsForRiskLevel(level: RiskLevel): VariantEntry[] {
    const entries: VariantEntry[] = [];

    const assessments = this.analysisResult.riskAssessments.filter(r => r.riskLevel === level);
    for (const assessment of assessments) {
      for (const variant of assessment.variants) {
        if (!variant.clinvar) continue;

        entries.push({
          rsid: variant.snp.rsid,
          gene: variant.clinvar.gene,
          genotype: variant.snp.genotype,
          significance: variant.clinvar.clinicalSignificance,
          condition: assessment.condition,
          stars: variant.clinvar.reviewStatus,
          impact: variant.impactScore
        });
      }
    }

    return entries;
  }

  private summarizeRiskAssessment(assessment: RiskAssessment): string {
    const variantCount = assessment.variants.length;
    const inheritance = assessment.inheritance
      ? ` (${this.formatInheritance(assessment.inheritance)})`
      : '';
    return `${variantCount} variant(s) identified${inheritance}`;
  }

  private formatInheritance(inheritance: string): string {
    const mapping: Record<string, string> = {
      autosomal_dominant: 'AD',
      autosomal_recessive: 'AR',
      x_linked: 'X-linked',
      complex: 'Complex'
    };
    return mapping[inheritance] || inheritance;
  }

  private formatPhenotype(phenotype: EnhancedMetabolizerPhenotype): string {
    const diplotypeStr = phenotype.diplotype ? ` (${phenotype.diplotype})` : '';
    return `${this.capitalize(phenotype.phenotype)} Metabolizer${diplotypeStr}`;
  }

  private mapSeverityToRiskLevel(severity: 'critical' | 'moderate' | 'informational'): RiskLevel {
    const mapping: Record<string, RiskLevel> = {
      critical: 'high',
      moderate: 'moderate',
      informational: 'low'
    };
    return mapping[severity];
  }

  private interpretationToRiskLevel(
    interpretation: 'increased' | 'typical' | 'decreased' | 'unknown'
  ): RiskLevel {
    const mapping: Record<string, RiskLevel> = {
      increased: 'moderate',
      typical: 'low',
      decreased: 'low',
      unknown: 'unknown'
    };
    return mapping[interpretation];
  }

  private confidenceToStars(confidence: 'high' | 'moderate' | 'low'): number {
    const mapping: Record<string, number> = {
      high: 4,
      moderate: 2,
      low: 1
    };
    return mapping[confidence];
  }

  private prsRiskCategoryToLevel(
    category: PolygenicRiskScore['riskCategory']
  ): RiskLevel {
    const mapping: Record<string, RiskLevel> = {
      very_high: 'high',
      high: 'high',
      moderate: 'moderate',
      average: 'low',
      low: 'low',
      very_low: 'low'
    };
    return mapping[category];
  }

  private phenotypeToRiskLevel(phenotype: string): RiskLevel {
    const highRiskPhenotypes = ['poor', 'ultrarapid'];
    const moderatePhenotypes = ['intermediate', 'rapid'];

    if (highRiskPhenotypes.includes(phenotype)) return 'high';
    if (moderatePhenotypes.includes(phenotype)) return 'moderate';
    return 'low';
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Generate a comprehensive genetic report
 */
export function generateReport(
  input: ReportGeneratorInput,
  options: ReportGenerationOptions
): Report {
  const generator = new ReportGenerator(input, options);
  return generator.generate();
}

/**
 * Generate an exhaustive genetic report with all findings
 */
export function generateExhaustiveReport(input: ReportGeneratorInput): Report {
  return generateReport(input, { type: 'exhaustive_genetic' });
}

/**
 * Generate a disease risk report
 */
export function generateDiseaseRiskReport(input: ReportGeneratorInput): Report {
  return generateReport(input, { type: 'disease_risk' });
}

/**
 * Generate a pharmacogenomics report
 */
export function generatePharmacogenomicsReport(input: ReportGeneratorInput): Report {
  return generateReport(input, { type: 'pharmacogenomics' });
}

/**
 * Generate a health protocol report
 */
export function generateHealthProtocolReport(input: ReportGeneratorInput): Report {
  return generateReport(input, { type: 'health_protocol' });
}

// ============================================================================
// Export Formatters
// ============================================================================

/**
 * Convert a report to plain text format
 */
export function reportToText(report: Report): string {
  let text = `# ${report.title}\n\n`;
  text += `Generated: ${report.generatedAt.toLocaleString()}\n`;
  text += `Genome ID: ${report.genomeId}\n\n`;
  text += '---\n\n';

  for (const section of report.sections) {
    text += `## ${section.title}\n\n`;
    text += formatSectionContent(section.content);
    text += '\n---\n\n';
  }

  return text;
}

function formatSectionContent(content: ReportSection['content']): string {
  switch (content.type) {
    case 'summary':
      return formatSummaryContent(content);
    case 'risk_table':
      return formatRiskTableContent(content);
    case 'variant_list':
      return formatVariantListContent(content);
    case 'drug_interactions':
      return formatDrugInteractionContent(content);
    case 'recommendations':
      return formatRecommendationContent(content);
    case 'technical':
      return formatTechnicalContent(content);
    default:
      return '';
  }
}

function formatSummaryContent(content: SummaryContent): string {
  let text = content.text + '\n\n';
  if (content.highlights.length > 0) {
    text += '**Key Highlights:**\n';
    for (const highlight of content.highlights) {
      text += `- ${highlight}\n`;
    }
  }
  return text;
}

function formatRiskTableContent(content: RiskTableContent): string {
  let text = '| Condition | Gene | Risk | Confidence | Notes |\n';
  text += '|-----------|------|------|------------|-------|\n';

  for (const row of content.rows) {
    const stars = '★'.repeat(row.confidence) + '☆'.repeat(4 - row.confidence);
    text += `| ${row.condition} | ${row.gene} | ${row.riskLevel.toUpperCase()} | ${stars} | ${row.notes} |\n`;
  }

  return text;
}

function formatVariantListContent(content: VariantListContent): string {
  let text = `**Category:** ${content.category}\n\n`;
  text += '| rsID | Gene | Genotype | Significance | Condition | Stars |\n';
  text += '|------|------|----------|--------------|-----------|-------|\n';

  for (const variant of content.variants) {
    const stars = '★'.repeat(variant.stars) + '☆'.repeat(4 - variant.stars);
    text += `| ${variant.rsid} | ${variant.gene} | ${variant.genotype} | ${variant.significance} | ${variant.condition} | ${stars} |\n`;
  }

  return text;
}

function formatDrugInteractionContent(content: DrugInteractionContent): string {
  let text = `**Gene:** ${content.gene}\n`;
  text += `**Phenotype:** ${content.phenotype}\n\n`;

  for (const drug of content.interactions) {
    text += `### ${drug.drugName}\n`;
    text += `- Severity: ${drug.severity.toUpperCase()}\n`;
    text += `- Evidence: ${drug.evidenceLevel}\n`;
    text += `- FDA Label: ${drug.hasFDALabel ? 'Yes' : 'No'}\n`;
    text += `- Recommendation: ${drug.recommendation}\n\n`;
  }

  return text;
}

function formatRecommendationContent(content: RecommendationContent): string {
  let text = `**Category:** ${content.category}\n\n`;

  for (const item of content.items) {
    const priority = item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢';
    text += `${priority} **${item.recommendation}**\n`;
    text += `   ${item.rationale}\n`;
    if (item.relatedGenes.length > 0) {
      text += `   Related genes: ${item.relatedGenes.join(', ')}\n`;
    }
    text += '\n';
  }

  return text;
}

function formatTechnicalContent(content: TechnicalContent): string {
  let text = '';
  for (const detail of content.details) {
    text += `- **${detail.label}:** ${detail.value}\n`;
  }
  return text;
}

/**
 * Convert a report to JSON format
 */
export function reportToJSON(report: Report): string {
  return JSON.stringify(report, null, 2);
}

// ============================================================================
// Type Exports
// ============================================================================

export type {
  Report,
  ReportType,
  ReportSection,
  ReportGenerationOptions,
  ReportMetadata,
  SummaryContent,
  RiskTableContent,
  VariantListContent,
  DrugInteractionContent,
  RecommendationContent,
  TechnicalContent
};
