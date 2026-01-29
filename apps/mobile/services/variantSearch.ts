/**
 * Variant Search Service
 *
 * Provides advanced search and filtering for genetic variants.
 */

import type { ClinicalFinding, DrugResponse, TraitAssociation, AnalysisResult } from './genomeAnalysis';

export type SignificanceFilter = 'all' | 'pathogenic' | 'likely_pathogenic' | 'vus' | 'benign';
export type CategoryFilter = 'all' | 'clinical' | 'pharmacogenomics' | 'traits';

export interface SearchFilters {
  query: string;
  category: CategoryFilter;
  significance: SignificanceFilter;
  chromosomes: string[];
  genes: string[];
  minConfidence?: number;
}

export interface SearchResult {
  id: string;
  rsid: string;
  type: 'clinical' | 'drug' | 'trait';
  title: string;
  subtitle: string;
  gene?: string;
  chromosome?: string;
  significance?: string;
  confidence?: number;
  data: ClinicalFinding | DrugResponse | TraitAssociation;
}

export interface SearchStats {
  totalResults: number;
  clinicalCount: number;
  drugCount: number;
  traitCount: number;
  uniqueGenes: number;
}

const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  category: 'all',
  significance: 'all',
  chromosomes: [],
  genes: [],
};

/**
 * Get all unique chromosomes from analysis results
 */
export function getUniqueChromosomes(analysis: AnalysisResult): string[] {
  const chromosomes = new Set<string>();

  for (const finding of analysis.clinicalFindings) {
    if (finding.chromosome) {
      chromosomes.add(finding.chromosome);
    }
  }

  // Sort chromosomes naturally (1, 2, ... 22, X, Y)
  return Array.from(chromosomes).sort((a, b) => {
    const numA = parseInt(a);
    const numB = parseInt(b);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    if (!isNaN(numA)) return -1;
    if (!isNaN(numB)) return 1;
    return a.localeCompare(b);
  });
}

/**
 * Get all unique genes from analysis results
 */
export function getUniqueGenes(analysis: AnalysisResult): string[] {
  const genes = new Set<string>();

  for (const finding of analysis.clinicalFindings) {
    if (finding.gene) {
      genes.add(finding.gene);
    }
  }

  for (const response of analysis.drugResponses) {
    if (response.gene) {
      genes.add(response.gene);
    }
  }

  return Array.from(genes).sort();
}

/**
 * Check if a string matches the search query
 */
function matchesQuery(text: string | undefined, query: string): boolean {
  if (!query) return true;
  if (!text) return false;
  return text.toLowerCase().includes(query.toLowerCase());
}

/**
 * Check if significance matches filter
 */
function matchesSignificance(significance: string | undefined, filter: SignificanceFilter): boolean {
  if (filter === 'all') return true;
  if (!significance) return false;

  const sig = significance.toLowerCase();

  switch (filter) {
    case 'pathogenic':
      return sig.includes('pathogenic') && !sig.includes('likely');
    case 'likely_pathogenic':
      return sig.includes('likely_pathogenic') || sig.includes('likely pathogenic');
    case 'vus':
      return sig.includes('uncertain') || sig.includes('vus');
    case 'benign':
      return sig.includes('benign');
    default:
      return true;
  }
}

/**
 * Search clinical findings
 */
function searchClinicalFindings(
  findings: ClinicalFinding[],
  filters: SearchFilters
): SearchResult[] {
  return findings
    .filter((finding) => {
      // Query match
      if (
        !matchesQuery(finding.rsid, filters.query) &&
        !matchesQuery(finding.gene, filters.query) &&
        !matchesQuery(finding.condition, filters.query)
      ) {
        return false;
      }

      // Significance filter
      if (!matchesSignificance(finding.significance, filters.significance)) {
        return false;
      }

      // Chromosome filter
      if (
        filters.chromosomes.length > 0 &&
        (!finding.chromosome || !filters.chromosomes.includes(finding.chromosome))
      ) {
        return false;
      }

      // Gene filter
      if (
        filters.genes.length > 0 &&
        (!finding.gene || !filters.genes.includes(finding.gene))
      ) {
        return false;
      }

      return true;
    })
    .map((finding) => ({
      id: `clinical_${finding.rsid}`,
      rsid: finding.rsid,
      type: 'clinical' as const,
      title: finding.condition,
      subtitle: `${finding.gene || 'Unknown gene'} • ${finding.significance}`,
      gene: finding.gene,
      chromosome: finding.chromosome,
      significance: finding.significance,
      data: finding,
    }));
}

/**
 * Search drug responses
 */
function searchDrugResponses(
  responses: DrugResponse[],
  filters: SearchFilters
): SearchResult[] {
  return responses
    .filter((response) => {
      // Query match
      if (
        !matchesQuery(response.rsid, filters.query) &&
        !matchesQuery(response.gene, filters.query) &&
        !matchesQuery(response.drug, filters.query) &&
        !matchesQuery(response.response, filters.query)
      ) {
        return false;
      }

      // Gene filter
      if (
        filters.genes.length > 0 &&
        (!response.gene || !filters.genes.includes(response.gene))
      ) {
        return false;
      }

      return true;
    })
    .map((response) => ({
      id: `drug_${response.rsid}_${response.drug}`,
      rsid: response.rsid,
      type: 'drug' as const,
      title: response.drug,
      subtitle: `${response.gene} • ${response.response}`,
      gene: response.gene,
      data: response,
    }));
}

/**
 * Search trait associations
 */
function searchTraitAssociations(
  traits: TraitAssociation[],
  filters: SearchFilters
): SearchResult[] {
  return traits
    .filter((trait) => {
      // Query match
      if (
        !matchesQuery(trait.rsid, filters.query) &&
        !matchesQuery(trait.trait, filters.query) &&
        !matchesQuery(trait.category, filters.query) &&
        !matchesQuery(trait.effect, filters.query)
      ) {
        return false;
      }

      // Confidence filter
      if (filters.minConfidence !== undefined && trait.confidence < filters.minConfidence) {
        return false;
      }

      return true;
    })
    .map((trait) => ({
      id: `trait_${trait.rsid}_${trait.trait}`,
      rsid: trait.rsid,
      type: 'trait' as const,
      title: trait.trait,
      subtitle: `${trait.category} • ${(trait.confidence * 100).toFixed(0)}% confidence`,
      confidence: trait.confidence,
      data: trait,
    }));
}

/**
 * Search all analysis results with filters
 */
export function searchVariants(
  analysis: AnalysisResult,
  filters: SearchFilters = DEFAULT_FILTERS
): { results: SearchResult[]; stats: SearchStats } {
  let results: SearchResult[] = [];

  // Search based on category filter
  if (filters.category === 'all' || filters.category === 'clinical') {
    results = results.concat(searchClinicalFindings(analysis.clinicalFindings, filters));
  }

  if (filters.category === 'all' || filters.category === 'pharmacogenomics') {
    // Don't apply significance filter to drug responses
    const drugFilters = { ...filters, significance: 'all' as const };
    results = results.concat(searchDrugResponses(analysis.drugResponses, drugFilters));
  }

  if (filters.category === 'all' || filters.category === 'traits') {
    // Don't apply significance filter to traits
    const traitFilters = { ...filters, significance: 'all' as const };
    results = results.concat(searchTraitAssociations(analysis.traitAssociations, traitFilters));
  }

  // Calculate stats
  const stats: SearchStats = {
    totalResults: results.length,
    clinicalCount: results.filter((r) => r.type === 'clinical').length,
    drugCount: results.filter((r) => r.type === 'drug').length,
    traitCount: results.filter((r) => r.type === 'trait').length,
    uniqueGenes: new Set(results.map((r) => r.gene).filter(Boolean)).size,
  };

  return { results, stats };
}

/**
 * Get suggested search terms based on analysis data
 */
export function getSuggestedSearchTerms(analysis: AnalysisResult): string[] {
  const suggestions: string[] = [];

  // Add pathogenic genes
  const pathogenicGenes = analysis.clinicalFindings
    .filter((f) => f.significance?.toLowerCase().includes('pathogenic'))
    .map((f) => f.gene)
    .filter((g): g is string => !!g);

  suggestions.push(...new Set(pathogenicGenes));

  // Add common drug names
  const drugs = analysis.drugResponses.map((r) => r.drug);
  suggestions.push(...new Set(drugs).values());

  // Add trait categories
  const categories = analysis.traitAssociations.map((t) => t.category);
  suggestions.push(...new Set(categories).values());

  return [...new Set(suggestions)].slice(0, 10);
}

/**
 * Get quick filter presets
 */
export function getFilterPresets(): {
  id: string;
  label: string;
  filters: Partial<SearchFilters>;
}[] {
  return [
    {
      id: 'pathogenic',
      label: 'Pathogenic Only',
      filters: { significance: 'pathogenic', category: 'clinical' },
    },
    {
      id: 'actionable',
      label: 'Actionable Findings',
      filters: { significance: 'pathogenic', category: 'all' },
    },
    {
      id: 'drugs',
      label: 'Drug Interactions',
      filters: { category: 'pharmacogenomics' },
    },
    {
      id: 'traits',
      label: 'Traits Only',
      filters: { category: 'traits' },
    },
    {
      id: 'high-confidence',
      label: 'High Confidence',
      filters: { minConfidence: 0.7 },
    },
  ];
}

/**
 * Highlight search matches in text
 */
export function highlightMatches(
  text: string,
  query: string
): { text: string; highlighted: boolean }[] {
  if (!query) {
    return [{ text, highlighted: false }];
  }

  const parts: { text: string; highlighted: boolean }[] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let lastIndex = 0;

  let index = lowerText.indexOf(lowerQuery);
  while (index !== -1) {
    if (index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, index), highlighted: false });
    }
    parts.push({ text: text.slice(index, index + query.length), highlighted: true });
    lastIndex = index + query.length;
    index = lowerText.indexOf(lowerQuery, lastIndex);
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), highlighted: false });
  }

  return parts.length ? parts : [{ text, highlighted: false }];
}
