/**
 * Database matching module
 *
 * Matches user SNPs against clinical databases (ClinVar, PharmGKB, gnomAD)
 * to identify pathogenic variants, drug interactions, and population frequencies.
 *
 * @packageDocumentation
 */

import type {
  ParsedGenome,
  AnnotatedSNP,
  MatchResult,
  MatchSummary,
  ClinVarVariant,
  PharmGKBVariant,
  GnomADFrequency,
  VariantCategory,
  ClinicalSignificance,
  GWASAssociation
} from '@genomeforge/types';

// ============================================================================
// Types
// ============================================================================

export interface MatchOptions {
  /** Include population frequency data */
  includeFrequency?: boolean;
  /** Include GWAS trait associations */
  includeGWAS?: boolean;
  /** Minimum impact score to include */
  minImpactScore?: number;
  /** Maximum results to return */
  maxResults?: number;
  /** Minimum GWAS p-value threshold (default: 5e-8) */
  gwasPValueThreshold?: number;
}

export interface DatabaseInterface {
  getClinVar(rsids: string[]): Promise<Map<string, ClinVarVariant>>;
  getPharmGKB(rsids: string[]): Promise<Map<string, PharmGKBVariant>>;
  getGnomAD(rsids: string[]): Promise<Map<string, GnomADFrequency>>;
  getGWAS(rsids: string[]): Promise<Map<string, GWASAssociation[]>>;
  getVersions(): Promise<{ clinvar: string; pharmgkb: string; gnomad?: string; gwas?: string }>;
}

// ============================================================================
// Impact Scoring
// ============================================================================

/**
 * Calculate impact score (0-6) based on clinical significance and evidence
 */
export function calculateImpactScore(
  clinvar?: ClinVarVariant,
  pharmgkb?: PharmGKBVariant
): number {
  let score = 0;

  // ClinVar significance scoring
  if (clinvar) {
    const sigScores: Record<ClinicalSignificance, number> = {
      pathogenic: 4,
      likely_pathogenic: 3,
      uncertain_significance: 1,
      likely_benign: 0,
      benign: 0,
      conflicting: 0.5,
      not_provided: 0
    };

    score += sigScores[clinvar.clinicalSignificance] || 0;

    // Review status bonus (0-1 based on stars)
    score += clinvar.reviewStatus * 0.25;
  }

  // PharmGKB evidence scoring
  if (pharmgkb && pharmgkb.drugs.length > 0) {
    // Find highest evidence level
    let maxEvidenceScore = 0;

    for (const drug of pharmgkb.drugs) {
      const level = drug.evidenceLevel;
      const evidenceScores: Record<string, number> = {
        '1A': 2,
        '1B': 1.5,
        '2A': 1,
        '2B': 0.75,
        '3': 0.5,
        '4': 0.25
      };
      maxEvidenceScore = Math.max(maxEvidenceScore, evidenceScores[level] || 0);
    }

    score += maxEvidenceScore;

    // FDA label bonus
    if (pharmgkb.drugs.some(d => d.fdaLabel)) {
      score += 0.5;
    }
  }

  return Math.min(6, score);
}

/**
 * Categorize a variant based on annotations
 */
export function categorizeVariant(
  clinvar?: ClinVarVariant,
  pharmgkb?: PharmGKBVariant
): VariantCategory {
  // Check for pathogenic
  if (clinvar) {
    if (clinvar.clinicalSignificance === 'pathogenic' ||
        clinvar.clinicalSignificance === 'likely_pathogenic') {
      return 'pathogenic';
    }

    // Check for protective (benign in disease context can be protective)
    if (clinvar.clinicalSignificance === 'benign' &&
        clinvar.conditions.some(c => c.name.toLowerCase().includes('protective'))) {
      return 'protective';
    }
  }

  // Check for drug interactions
  if (pharmgkb && pharmgkb.drugs.length > 0) {
    return 'drug';
  }

  // Check for carrier status (heterozygous pathogenic for recessive)
  if (clinvar && clinvar.clinicalSignificance === 'pathogenic') {
    // This would need genotype context to determine carrier status
    return 'carrier';
  }

  return 'neutral';
}

// ============================================================================
// Main Matching Function
// ============================================================================

/**
 * Match a parsed genome against clinical databases
 */
export async function matchGenome(
  genome: ParsedGenome,
  db: DatabaseInterface,
  options: MatchOptions = {}
): Promise<MatchResult> {
  const {
    includeFrequency = false,
    includeGWAS = true,
    minImpactScore = 0,
    maxResults = 1000,
    gwasPValueThreshold = 5e-8
  } = options;

  const userRsids = Array.from(genome.snps.keys());

  // Batch lookup from databases
  const [clinvarMap, pharmgkbMap, gnomadMap, gwasMap, versions] = await Promise.all([
    db.getClinVar(userRsids),
    db.getPharmGKB(userRsids),
    includeFrequency ? db.getGnomAD(userRsids) : Promise.resolve(new Map<string, GnomADFrequency>()),
    includeGWAS ? db.getGWAS(userRsids) : Promise.resolve(new Map<string, GWASAssociation[]>()),
    db.getVersions()
  ]);

  // Process matches
  const annotatedSNPs: AnnotatedSNP[] = [];
  let pathogenicCount = 0;
  let drugInteractionCount = 0;
  let carrierCount = 0;
  let gwasAssociationCount = 0;

  for (const [rsid, snp] of genome.snps) {
    const clinvar = clinvarMap.get(rsid);
    const pharmgkb = pharmgkbMap.get(rsid);
    const gnomad = gnomadMap.get(rsid);
    const gwasAssociations = gwasMap.get(rsid);

    // Filter GWAS associations by p-value threshold
    const filteredGwas = gwasAssociations?.filter(
      a => a.pValue <= gwasPValueThreshold
    );

    // Skip if no database matches
    if (!clinvar && !pharmgkb && (!filteredGwas || filteredGwas.length === 0)) continue;

    const impactScore = calculateImpactScore(clinvar, pharmgkb);

    // Filter by minimum impact (but always include GWAS hits)
    if (impactScore < minImpactScore && (!filteredGwas || filteredGwas.length === 0)) continue;

    const category = categorizeVariant(clinvar, pharmgkb);

    // Count categories
    if (category === 'pathogenic') pathogenicCount++;
    if (category === 'drug') drugInteractionCount++;
    if (category === 'carrier') carrierCount++;
    if (filteredGwas && filteredGwas.length > 0) gwasAssociationCount += filteredGwas.length;

    // Annotate GWAS associations with user genotype information
    const annotatedGwas = filteredGwas?.map(association => ({
      ...association,
      userGenotype: snp.genotype,
      hasRiskAllele: association.riskAllele
        ? snp.genotype.includes(association.riskAllele)
        : undefined,
      riskAlleleCopies: association.riskAllele
        ? countRiskAlleleCopies(snp.genotype, association.riskAllele)
        : undefined
    }));

    annotatedSNPs.push({
      snp,
      clinvar,
      pharmgkb,
      gnomad,
      gwas: annotatedGwas,
      impactScore,
      category
    });
  }

  // Sort by impact score (highest first)
  annotatedSNPs.sort((a, b) => b.impactScore - a.impactScore);

  // Limit results
  const limitedResults = annotatedSNPs.slice(0, maxResults);

  // Generate summary
  const summary = generateMatchSummary(limitedResults);

  return {
    genomeId: genome.id,
    totalSNPs: genome.snpCount,
    matchedSNPs: annotatedSNPs.length,
    pathogenicCount,
    drugInteractionCount,
    carrierCount,
    gwasAssociationCount,
    annotatedSNPs: limitedResults,
    summary,
    buildVersion: genome.build,
    databaseVersions: versions
  };
}

/**
 * Count how many copies of the risk allele are present in a genotype
 */
function countRiskAlleleCopies(genotype: string, riskAllele: string): number {
  let count = 0;
  for (const char of genotype) {
    if (char.toUpperCase() === riskAllele.toUpperCase()) {
      count++;
    }
  }
  return Math.min(count, 2); // Max 2 copies for diploid
}

/**
 * Generate a summary of match results
 */
function generateMatchSummary(annotatedSNPs: AnnotatedSNP[]): MatchSummary {
  const highImpact: string[] = [];
  const moderateImpact: string[] = [];
  const pharmacogenes: string[] = [];
  const carrierStatuses: string[] = [];
  const gwasTraitCounts = new Map<string, number>();

  for (const result of annotatedSNPs) {
    // High impact findings (score >= 4)
    if (result.impactScore >= 4 && result.clinvar) {
      const condition = result.clinvar.conditions[0]?.name || 'Unknown condition';
      highImpact.push(`${result.clinvar.gene}: ${condition}`);
    }

    // Moderate impact (score 2-4)
    if (result.impactScore >= 2 && result.impactScore < 4 && result.clinvar) {
      moderateImpact.push(result.clinvar.gene);
    }

    // Pharmacogenes
    if (result.pharmgkb) {
      if (!pharmacogenes.includes(result.pharmgkb.gene)) {
        pharmacogenes.push(result.pharmgkb.gene);
      }
    }

    // Carrier statuses
    if (result.category === 'carrier' && result.clinvar) {
      const condition = result.clinvar.conditions[0]?.name || 'Unknown';
      carrierStatuses.push(`${result.clinvar.gene} (${condition})`);
    }

    // GWAS traits (count occurrences for ranking)
    if (result.gwas) {
      for (const association of result.gwas) {
        const count = gwasTraitCounts.get(association.trait) || 0;
        gwasTraitCounts.set(association.trait, count + 1);
      }
    }
  }

  // Sort GWAS traits by count (most associated variants first)
  const sortedGwasTraits = [...gwasTraitCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([trait]) => trait);

  return {
    highImpact: highImpact.slice(0, 10),
    moderateImpact: [...new Set(moderateImpact)].slice(0, 20),
    pharmacogenes: pharmacogenes.slice(0, 20),
    carrierStatuses: carrierStatuses.slice(0, 10),
    gwasTraits: sortedGwasTraits.slice(0, 20)
  };
}

// ============================================================================
// Exports
// ============================================================================

export type { AnnotatedSNP, MatchResult, MatchSummary };
