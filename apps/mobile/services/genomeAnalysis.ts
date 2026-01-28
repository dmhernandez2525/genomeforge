/**
 * Mobile Genome Analysis Service
 *
 * Performs genetic analysis optimized for mobile devices.
 * Matches variants against local databases and generates insights.
 */

import type { GenomeVariant, ParsedGenome } from './genomeParser';

export interface ClinicalMatch {
  rsid: string;
  gene?: string;
  significance: 'pathogenic' | 'likely_pathogenic' | 'uncertain' | 'likely_benign' | 'benign';
  conditions: string[];
  reviewStars: number;
  yourGenotype: string;
}

export interface PharmacogenomicMatch {
  rsid: string;
  gene: string;
  drug: string;
  effect: string;
  metabolizerStatus?: 'poor' | 'intermediate' | 'normal' | 'rapid' | 'ultra_rapid';
  yourGenotype: string;
}

export interface TraitAssociation {
  rsid: string;
  trait: string;
  effect: string;
  pValue: number;
  oddsRatio?: number;
  yourGenotype: string;
}

export interface AnalysisResult {
  id: string;
  analyzedAt: string;
  totalVariants: number;
  matchedVariants: number;
  clinical: {
    pathogenic: ClinicalMatch[];
    likelyPathogenic: ClinicalMatch[];
    uncertain: ClinicalMatch[];
    benign: ClinicalMatch[];
  };
  pharmacogenomics: PharmacogenomicMatch[];
  traits: TraitAssociation[];
  summary: {
    riskScore: number;
    riskLevel: 'low' | 'moderate' | 'elevated' | 'high';
    actionableFindings: number;
    totalClinicalMatches: number;
    totalPgxMatches: number;
    totalTraitAssociations: number;
  };
}

export interface AnalysisProgress {
  stage: 'clinical' | 'pharmacogenomics' | 'traits' | 'summarizing' | 'complete';
  percentComplete: number;
  currentDatabase: string;
  matchesFound: number;
}

type ProgressCallback = (progress: AnalysisProgress) => void;

// Mock clinical data for demonstration
// In production, this would query the IndexedDB databases
const MOCK_CLINICAL_DATA: Record<string, {
  gene: string;
  significance: ClinicalMatch['significance'];
  conditions: string[];
  reviewStars: number;
}> = {
  rs1799966: {
    gene: 'BRCA1',
    significance: 'benign',
    conditions: ['Hereditary breast and ovarian cancer syndrome'],
    reviewStars: 3,
  },
  rs1800497: {
    gene: 'ANKK1',
    significance: 'uncertain',
    conditions: ['Alcohol dependence susceptibility'],
    reviewStars: 2,
  },
  rs6311: {
    gene: 'HTR2A',
    significance: 'likely_benign',
    conditions: ['Drug response variability'],
    reviewStars: 2,
  },
};

const MOCK_PGX_DATA: Record<string, {
  gene: string;
  drug: string;
  effect: string;
}> = {
  rs4244285: {
    gene: 'CYP2C19',
    drug: 'Clopidogrel',
    effect: 'Reduced metabolism - may need alternative antiplatelet',
  },
  rs1045642: {
    gene: 'ABCB1',
    drug: 'Multiple drugs',
    effect: 'Altered drug transport affecting many medications',
  },
  rs776746: {
    gene: 'CYP3A5',
    drug: 'Tacrolimus',
    effect: 'May require dose adjustment for immunosuppression',
  },
};

const MOCK_TRAIT_DATA: Record<string, {
  trait: string;
  effect: string;
  pValue: number;
  oddsRatio: number;
}> = {
  rs1426654: {
    trait: 'Skin pigmentation',
    effect: 'Associated with lighter skin pigmentation',
    pValue: 1e-100,
    oddsRatio: 3.5,
  },
  rs12913832: {
    trait: 'Eye color',
    effect: 'Blue eye color association',
    pValue: 1e-50,
    oddsRatio: 4.2,
  },
  rs4988235: {
    trait: 'Lactose tolerance',
    effect: 'Lactase persistence in adulthood',
    pValue: 1e-30,
    oddsRatio: 2.8,
  },
};

/**
 * Analyze parsed genome data
 */
export async function analyzeGenome(
  genome: ParsedGenome,
  onProgress?: ProgressCallback
): Promise<AnalysisResult> {
  const variantIndex = new Map<string, GenomeVariant>();
  for (const variant of genome.variants) {
    variantIndex.set(variant.rsid, variant);
  }

  onProgress?.({
    stage: 'clinical',
    percentComplete: 0,
    currentDatabase: 'ClinVar',
    matchesFound: 0,
  });

  // Match clinical variants
  const clinicalMatches = await matchClinicalVariants(variantIndex, onProgress);

  onProgress?.({
    stage: 'pharmacogenomics',
    percentComplete: 40,
    currentDatabase: 'PharmGKB',
    matchesFound: clinicalMatches.length,
  });

  // Match pharmacogenomic variants
  const pgxMatches = await matchPharmacogenomicVariants(variantIndex, onProgress);

  onProgress?.({
    stage: 'traits',
    percentComplete: 70,
    currentDatabase: 'GWAS Catalog',
    matchesFound: clinicalMatches.length + pgxMatches.length,
  });

  // Match trait associations
  const traitMatches = await matchTraitAssociations(variantIndex, onProgress);

  onProgress?.({
    stage: 'summarizing',
    percentComplete: 90,
    currentDatabase: 'Finalizing',
    matchesFound: clinicalMatches.length + pgxMatches.length + traitMatches.length,
  });

  // Categorize clinical matches
  const clinical = {
    pathogenic: clinicalMatches.filter((m) => m.significance === 'pathogenic'),
    likelyPathogenic: clinicalMatches.filter((m) => m.significance === 'likely_pathogenic'),
    uncertain: clinicalMatches.filter((m) => m.significance === 'uncertain'),
    benign: clinicalMatches.filter(
      (m) => m.significance === 'benign' || m.significance === 'likely_benign'
    ),
  };

  // Calculate summary
  const summary = calculateSummary(clinical, pgxMatches, traitMatches);

  const result: AnalysisResult = {
    id: generateId(),
    analyzedAt: new Date().toISOString(),
    totalVariants: genome.totalVariants,
    matchedVariants: clinicalMatches.length + pgxMatches.length + traitMatches.length,
    clinical,
    pharmacogenomics: pgxMatches,
    traits: traitMatches,
    summary,
  };

  onProgress?.({
    stage: 'complete',
    percentComplete: 100,
    currentDatabase: 'Complete',
    matchesFound: result.matchedVariants,
  });

  return result;
}

/**
 * Match variants against clinical database
 */
async function matchClinicalVariants(
  variantIndex: Map<string, GenomeVariant>,
  _onProgress?: ProgressCallback
): Promise<ClinicalMatch[]> {
  const matches: ClinicalMatch[] = [];

  // In production, this would query the ClinVar IndexedDB
  // For now, use mock data
  for (const [rsid, data] of Object.entries(MOCK_CLINICAL_DATA)) {
    const variant = variantIndex.get(rsid);
    if (variant) {
      matches.push({
        rsid,
        gene: data.gene,
        significance: data.significance,
        conditions: data.conditions,
        reviewStars: data.reviewStars,
        yourGenotype: variant.genotype,
      });
    }
  }

  // Simulate some delay for realistic progress
  await delay(100);

  return matches;
}

/**
 * Match variants against pharmacogenomic database
 */
async function matchPharmacogenomicVariants(
  variantIndex: Map<string, GenomeVariant>,
  _onProgress?: ProgressCallback
): Promise<PharmacogenomicMatch[]> {
  const matches: PharmacogenomicMatch[] = [];

  for (const [rsid, data] of Object.entries(MOCK_PGX_DATA)) {
    const variant = variantIndex.get(rsid);
    if (variant) {
      matches.push({
        rsid,
        gene: data.gene,
        drug: data.drug,
        effect: data.effect,
        yourGenotype: variant.genotype,
      });
    }
  }

  await delay(100);

  return matches;
}

/**
 * Match variants against trait association database
 */
async function matchTraitAssociations(
  variantIndex: Map<string, GenomeVariant>,
  _onProgress?: ProgressCallback
): Promise<TraitAssociation[]> {
  const matches: TraitAssociation[] = [];

  for (const [rsid, data] of Object.entries(MOCK_TRAIT_DATA)) {
    const variant = variantIndex.get(rsid);
    if (variant) {
      matches.push({
        rsid,
        trait: data.trait,
        effect: data.effect,
        pValue: data.pValue,
        oddsRatio: data.oddsRatio,
        yourGenotype: variant.genotype,
      });
    }
  }

  await delay(100);

  return matches;
}

/**
 * Calculate summary statistics and risk score
 */
function calculateSummary(
  clinical: AnalysisResult['clinical'],
  pgx: PharmacogenomicMatch[],
  traits: TraitAssociation[]
): AnalysisResult['summary'] {
  const pathogenicCount =
    clinical.pathogenic.length + clinical.likelyPathogenic.length;
  const totalClinical =
    pathogenicCount + clinical.uncertain.length + clinical.benign.length;

  // Simple risk scoring
  let riskScore = 0;
  riskScore += clinical.pathogenic.length * 30;
  riskScore += clinical.likelyPathogenic.length * 15;
  riskScore += clinical.uncertain.length * 3;
  riskScore = Math.min(100, riskScore);

  let riskLevel: AnalysisResult['summary']['riskLevel'] = 'low';
  if (riskScore > 70) riskLevel = 'high';
  else if (riskScore > 40) riskLevel = 'elevated';
  else if (riskScore > 15) riskLevel = 'moderate';

  return {
    riskScore,
    riskLevel,
    actionableFindings: pathogenicCount + pgx.length,
    totalClinicalMatches: totalClinical,
    totalPgxMatches: pgx.length,
    totalTraitAssociations: traits.length,
  };
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Utility delay function
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Export analysis result to JSON
 */
export function exportAnalysisToJson(result: AnalysisResult): string {
  return JSON.stringify(result, null, 2);
}

/**
 * Get a human-readable summary of the analysis
 */
export function getAnalysisSummaryText(result: AnalysisResult): string {
  const lines: string[] = [];

  lines.push(`Analysis completed on ${new Date(result.analyzedAt).toLocaleDateString()}`);
  lines.push(`Total variants analyzed: ${result.totalVariants.toLocaleString()}`);
  lines.push('');

  lines.push('Clinical Findings:');
  lines.push(`  - Pathogenic variants: ${result.clinical.pathogenic.length}`);
  lines.push(`  - Likely pathogenic: ${result.clinical.likelyPathogenic.length}`);
  lines.push(`  - Uncertain significance: ${result.clinical.uncertain.length}`);
  lines.push('');

  lines.push('Pharmacogenomics:');
  lines.push(`  - Drug interactions found: ${result.pharmacogenomics.length}`);
  lines.push('');

  lines.push('Trait Associations:');
  lines.push(`  - Trait associations: ${result.traits.length}`);

  return lines.join('\n');
}
