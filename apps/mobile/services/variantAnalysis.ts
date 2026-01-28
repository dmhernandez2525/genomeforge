/**
 * Advanced Variant Analysis Service
 *
 * Provides detailed variant analysis including:
 * - Functional annotations
 * - Population frequencies
 * - External database links
 * - Related research and literature
 */

export interface VariantDetails {
  // Basic Information
  rsid: string;
  chromosome: string;
  position: number;
  referenceAllele: string;
  alternateAllele: string;
  genotype: string;

  // Gene Information
  gene?: {
    symbol: string;
    name: string;
    function?: string;
    aliases?: string[];
    omimId?: string;
  };

  // Clinical Significance
  clinicalSignificance?: {
    classification: string;
    reviewStatus: string;
    lastEvaluated?: string;
    conditions: string[];
  };

  // Functional Annotation
  functionalAnnotation?: {
    consequence: string;
    impact: 'HIGH' | 'MODERATE' | 'LOW' | 'MODIFIER';
    aminoAcidChange?: string;
    codonChange?: string;
    exon?: string;
    proteinPosition?: number;
    siftScore?: number;
    siftPrediction?: string;
    polyphenScore?: number;
    polyphenPrediction?: string;
  };

  // Population Frequencies
  populationFrequencies?: {
    global?: number;
    african?: number;
    european?: number;
    eastAsian?: number;
    southAsian?: number;
    latino?: number;
    source?: string;
  };

  // Pharmacogenomics
  pharmacogenomics?: {
    drug: string;
    phenotype: string;
    recommendation: string;
    level: string;
  }[];

  // External Links
  externalLinks: ExternalLink[];

  // Related Variants
  relatedVariants?: {
    rsid: string;
    relationship: string;
    distance?: number;
  }[];

  // Literature
  publications?: {
    pmid: string;
    title: string;
    year: number;
    journal?: string;
  }[];
}

export interface ExternalLink {
  name: string;
  url: string;
  icon: string;
  description: string;
}

/**
 * Generate external database links for a variant
 */
export function generateExternalLinks(rsid: string, gene?: string): ExternalLink[] {
  const links: ExternalLink[] = [
    {
      name: 'dbSNP',
      url: `https://www.ncbi.nlm.nih.gov/snp/${rsid}`,
      icon: 'globe',
      description: 'NCBI Single Nucleotide Polymorphism Database',
    },
    {
      name: 'ClinVar',
      url: `https://www.ncbi.nlm.nih.gov/clinvar/?term=${rsid}`,
      icon: 'medkit',
      description: 'Clinical Variant Database',
    },
    {
      name: 'gnomAD',
      url: `https://gnomad.broadinstitute.org/variant/${rsid}`,
      icon: 'stats-chart',
      description: 'Genome Aggregation Database',
    },
    {
      name: 'OpenSNP',
      url: `https://opensnp.org/snps/${rsid}`,
      icon: 'people',
      description: 'Community-driven SNP annotations',
    },
    {
      name: 'SNPedia',
      url: `https://www.snpedia.com/index.php/${rsid}`,
      icon: 'book',
      description: 'Wiki for SNP research',
    },
  ];

  if (gene) {
    links.push(
      {
        name: 'GeneCards',
        url: `https://www.genecards.org/cgi-bin/carddisp.pl?gene=${gene}`,
        icon: 'card',
        description: 'Human Gene Database',
      },
      {
        name: 'OMIM',
        url: `https://www.omim.org/search?search=${gene}`,
        icon: 'library',
        description: 'Online Mendelian Inheritance in Man',
      },
      {
        name: 'UniProt',
        url: `https://www.uniprot.org/uniprotkb?query=${gene}+AND+organism_id:9606`,
        icon: 'flask',
        description: 'Protein Sequence Database',
      }
    );
  }

  return links;
}

/**
 * Get functional impact description
 */
export function getImpactDescription(impact: string): {
  label: string;
  description: string;
  color: string;
} {
  const impacts: Record<string, { label: string; description: string; color: string }> = {
    HIGH: {
      label: 'High Impact',
      description: 'This variant is likely to have a significant effect on protein function.',
      color: '#dc2626',
    },
    MODERATE: {
      label: 'Moderate Impact',
      description: 'This variant may have a moderate effect on protein function.',
      color: '#f59e0b',
    },
    LOW: {
      label: 'Low Impact',
      description: 'This variant is unlikely to significantly affect protein function.',
      color: '#059669',
    },
    MODIFIER: {
      label: 'Modifier',
      description: 'This variant is in a non-coding region or has an unknown effect.',
      color: '#6b7280',
    },
  };

  return impacts[impact] || impacts.MODIFIER;
}

/**
 * Get consequence type description
 */
export function getConsequenceDescription(consequence: string): string {
  const consequences: Record<string, string> = {
    // High Impact
    transcript_ablation: 'Deletion of entire transcript',
    splice_acceptor_variant: 'Affects the splice acceptor site',
    splice_donor_variant: 'Affects the splice donor site',
    stop_gained: 'Creates a premature stop codon',
    frameshift_variant: 'Changes the reading frame',
    stop_lost: 'Removes a stop codon',
    start_lost: 'Removes the start codon',

    // Moderate Impact
    missense_variant: 'Changes one amino acid to another',
    inframe_deletion: 'Removes amino acids without changing the frame',
    inframe_insertion: 'Inserts amino acids without changing the frame',
    protein_altering_variant: 'Alters the protein sequence',

    // Low Impact
    splice_region_variant: 'Near a splice site',
    synonymous_variant: 'Does not change the amino acid',
    stop_retained_variant: 'Stop codon preserved despite change',
    incomplete_terminal_codon_variant: 'Incomplete codon at end of transcript',

    // Modifier
    coding_sequence_variant: 'In coding sequence',
    '5_prime_UTR_variant': "In 5' untranslated region",
    '3_prime_UTR_variant': "In 3' untranslated region",
    intron_variant: 'In an intron',
    intergenic_variant: 'Between genes',
    upstream_gene_variant: 'Upstream of a gene',
    downstream_gene_variant: 'Downstream of a gene',
    regulatory_region_variant: 'In a regulatory region',
  };

  return consequences[consequence] || 'Variant in genome';
}

/**
 * Get SIFT prediction description
 */
export function getSiftDescription(prediction: string, score?: number): {
  label: string;
  description: string;
  color: string;
} {
  if (prediction?.toLowerCase() === 'deleterious' || (score !== undefined && score < 0.05)) {
    return {
      label: 'Deleterious',
      description: 'SIFT predicts this variant affects protein function',
      color: '#dc2626',
    };
  }

  return {
    label: 'Tolerated',
    description: 'SIFT predicts this variant is tolerated',
    color: '#059669',
  };
}

/**
 * Get PolyPhen prediction description
 */
export function getPolyphenDescription(prediction: string, score?: number): {
  label: string;
  description: string;
  color: string;
} {
  const pred = prediction?.toLowerCase() || '';

  if (pred.includes('probably_damaging') || (score !== undefined && score > 0.908)) {
    return {
      label: 'Probably Damaging',
      description: 'PolyPhen predicts high confidence of damage',
      color: '#dc2626',
    };
  }

  if (pred.includes('possibly_damaging') || (score !== undefined && score > 0.446)) {
    return {
      label: 'Possibly Damaging',
      description: 'PolyPhen predicts possible damage',
      color: '#f59e0b',
    };
  }

  return {
    label: 'Benign',
    description: 'PolyPhen predicts benign effect',
    color: '#059669',
  };
}

/**
 * Format population frequency as percentage
 */
export function formatFrequency(frequency?: number): string {
  if (frequency === undefined || frequency === null) {
    return 'N/A';
  }

  if (frequency === 0) {
    return 'Rare';
  }

  if (frequency < 0.0001) {
    return '<0.01%';
  }

  if (frequency < 0.01) {
    return `${(frequency * 100).toFixed(2)}%`;
  }

  return `${(frequency * 100).toFixed(1)}%`;
}

/**
 * Get rarity classification based on allele frequency
 */
export function getRarityClassification(frequency?: number): {
  label: string;
  description: string;
  color: string;
} {
  if (frequency === undefined || frequency === null) {
    return { label: 'Unknown', description: 'Frequency data not available', color: '#6b7280' };
  }

  if (frequency === 0 || frequency < 0.0001) {
    return { label: 'Ultra-Rare', description: 'Found in <0.01% of population', color: '#7c3aed' };
  }

  if (frequency < 0.01) {
    return { label: 'Rare', description: 'Found in <1% of population', color: '#2563eb' };
  }

  if (frequency < 0.05) {
    return { label: 'Low Frequency', description: 'Found in 1-5% of population', color: '#059669' };
  }

  return { label: 'Common', description: 'Found in >5% of population', color: '#6b7280' };
}

/**
 * Get clinical significance classification
 */
export function getClinicalSignificanceInfo(classification: string): {
  label: string;
  description: string;
  color: string;
  icon: string;
} {
  const classLower = classification.toLowerCase().replace(/_/g, ' ');

  if (classLower.includes('pathogenic') && !classLower.includes('likely')) {
    return {
      label: 'Pathogenic',
      description: 'Strong evidence this variant causes disease',
      color: '#dc2626',
      icon: 'alert-circle',
    };
  }

  if (classLower.includes('likely pathogenic')) {
    return {
      label: 'Likely Pathogenic',
      description: 'Probable evidence this variant causes disease',
      color: '#f59e0b',
      icon: 'warning',
    };
  }

  if (classLower.includes('uncertain') || classLower.includes('vus')) {
    return {
      label: 'Uncertain Significance',
      description: 'Not enough evidence to classify this variant',
      color: '#6b7280',
      icon: 'help-circle',
    };
  }

  if (classLower.includes('likely benign')) {
    return {
      label: 'Likely Benign',
      description: 'Probably does not cause disease',
      color: '#3b82f6',
      icon: 'checkmark-circle',
    };
  }

  if (classLower.includes('benign')) {
    return {
      label: 'Benign',
      description: 'Strong evidence this variant does not cause disease',
      color: '#059669',
      icon: 'checkmark-circle',
    };
  }

  return {
    label: classification,
    description: 'Classification from clinical database',
    color: '#6b7280',
    icon: 'information-circle',
  };
}

/**
 * Format genotype for display
 */
export function formatGenotype(genotype: string): {
  display: string;
  zygosity: string;
  description: string;
} {
  const alleles = genotype.split(/[\/|]/);

  if (alleles.length !== 2) {
    return {
      display: genotype,
      zygosity: 'Unknown',
      description: 'Unable to determine zygosity',
    };
  }

  const [a1, a2] = alleles;

  if (a1 === a2) {
    return {
      display: genotype,
      zygosity: 'Homozygous',
      description: 'Two copies of the same allele',
    };
  }

  return {
    display: genotype,
    zygosity: 'Heterozygous',
    description: 'One copy of each allele',
  };
}

/**
 * Get review status stars (ClinVar style)
 */
export function getReviewStatusStars(reviewStatus: string): number {
  const status = reviewStatus.toLowerCase();

  if (status.includes('practice guideline')) return 4;
  if (status.includes('expert panel')) return 3;
  if (status.includes('multiple submitters') && status.includes('no conflict')) return 2;
  if (status.includes('single submitter')) return 1;

  return 0;
}
