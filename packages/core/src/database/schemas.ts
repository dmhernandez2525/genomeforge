/**
 * Predefined Database Schemas
 *
 * Common schema definitions for genetic variant databases.
 */

import type { DatabaseSchema, DatabaseField, PredefinedSchemaType } from './types';

/**
 * Common field definitions reused across schemas
 */
const COMMON_FIELDS: Record<string, DatabaseField> = {
  rsid: {
    name: 'rsid',
    displayName: 'RS ID',
    type: 'rsid',
    required: true,
    description: 'dbSNP reference SNP identifier (e.g., rs1234567)',
    pattern: '^rs\\d+$',
  },
  chromosome: {
    name: 'chromosome',
    displayName: 'Chromosome',
    type: 'chromosome',
    required: true,
    description: 'Chromosome number (1-22, X, Y, MT)',
    allowedValues: [
      '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
      '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
      '21', '22', 'X', 'Y', 'MT',
    ],
  },
  position: {
    name: 'position',
    displayName: 'Position',
    type: 'position',
    required: true,
    description: 'Genomic position (1-based coordinate)',
  },
  refAllele: {
    name: 'refAllele',
    displayName: 'Reference Allele',
    type: 'allele',
    required: false,
    description: 'Reference allele (A, C, G, T)',
    pattern: '^[ACGT]+$',
  },
  altAllele: {
    name: 'altAllele',
    displayName: 'Alternate Allele',
    type: 'allele',
    required: false,
    description: 'Alternate allele (A, C, G, T)',
    pattern: '^[ACGT]+$',
  },
  gene: {
    name: 'gene',
    displayName: 'Gene',
    type: 'gene',
    required: false,
    description: 'Gene symbol (e.g., BRCA1, CYP2D6)',
  },
  genotype: {
    name: 'genotype',
    displayName: 'Genotype',
    type: 'genotype',
    required: false,
    description: 'Genotype (e.g., AA, AG, GG)',
    pattern: '^[ACGT]{2}$',
  },
};

/**
 * Variant annotation schema
 */
export const VARIANT_ANNOTATION_SCHEMA: DatabaseSchema = {
  id: 'variant_annotation',
  version: '1.0.0',
  name: 'Variant Annotation',
  description: 'Schema for general variant annotations with clinical and functional information',
  primaryKey: ['rsid'],
  fields: [
    COMMON_FIELDS.rsid,
    COMMON_FIELDS.chromosome,
    COMMON_FIELDS.position,
    COMMON_FIELDS.refAllele,
    COMMON_FIELDS.altAllele,
    COMMON_FIELDS.gene,
    {
      name: 'annotation',
      displayName: 'Annotation',
      type: 'string',
      required: true,
      description: 'Annotation or description of the variant',
    },
    {
      name: 'category',
      displayName: 'Category',
      type: 'string',
      required: false,
      description: 'Category of the annotation',
    },
    {
      name: 'evidence',
      displayName: 'Evidence Level',
      type: 'string',
      required: false,
      description: 'Level of evidence supporting the annotation',
      allowedValues: ['strong', 'moderate', 'limited', 'conflicting', 'unknown'],
    },
    {
      name: 'source',
      displayName: 'Source',
      type: 'string',
      required: false,
      description: 'Source of the annotation',
    },
    {
      name: 'pubmedId',
      displayName: 'PubMed ID',
      type: 'string',
      required: false,
      description: 'PubMed reference ID',
      pattern: '^\\d+$',
    },
  ],
  indexFields: ['rsid', 'gene', 'chromosome'],
};

/**
 * Drug response schema
 */
export const DRUG_RESPONSE_SCHEMA: DatabaseSchema = {
  id: 'drug_response',
  version: '1.0.0',
  name: 'Drug Response',
  description: 'Schema for pharmacogenomic drug response associations',
  primaryKey: ['rsid', 'drugName'],
  fields: [
    COMMON_FIELDS.rsid,
    COMMON_FIELDS.gene,
    COMMON_FIELDS.genotype,
    {
      name: 'drugName',
      displayName: 'Drug Name',
      type: 'string',
      required: true,
      description: 'Name of the drug',
    },
    {
      name: 'drugClass',
      displayName: 'Drug Class',
      type: 'string',
      required: false,
      description: 'Therapeutic class of the drug',
    },
    {
      name: 'phenotype',
      displayName: 'Phenotype',
      type: 'string',
      required: true,
      description: 'Metabolizer phenotype or drug response',
      allowedValues: [
        'poor_metabolizer',
        'intermediate_metabolizer',
        'normal_metabolizer',
        'rapid_metabolizer',
        'ultrarapid_metabolizer',
        'increased_sensitivity',
        'decreased_sensitivity',
        'increased_risk',
        'decreased_risk',
        'altered_efficacy',
        'altered_toxicity',
      ],
    },
    {
      name: 'recommendation',
      displayName: 'Recommendation',
      type: 'string',
      required: false,
      description: 'Clinical recommendation',
    },
    {
      name: 'evidenceLevel',
      displayName: 'Evidence Level',
      type: 'string',
      required: false,
      description: 'Level of evidence',
      allowedValues: ['1A', '1B', '2A', '2B', '3', '4'],
    },
    {
      name: 'guidelineSource',
      displayName: 'Guideline Source',
      type: 'string',
      required: false,
      description: 'Source of clinical guideline (e.g., CPIC, DPWG)',
    },
  ],
  indexFields: ['rsid', 'gene', 'drugName'],
};

/**
 * Trait association schema
 */
export const TRAIT_ASSOCIATION_SCHEMA: DatabaseSchema = {
  id: 'trait_association',
  version: '1.0.0',
  name: 'Trait Association',
  description: 'Schema for genetic trait and phenotype associations',
  primaryKey: ['rsid', 'traitName'],
  fields: [
    COMMON_FIELDS.rsid,
    COMMON_FIELDS.chromosome,
    COMMON_FIELDS.position,
    COMMON_FIELDS.gene,
    COMMON_FIELDS.genotype,
    {
      name: 'traitName',
      displayName: 'Trait Name',
      type: 'string',
      required: true,
      description: 'Name of the trait or phenotype',
    },
    {
      name: 'traitCategory',
      displayName: 'Trait Category',
      type: 'string',
      required: false,
      description: 'Category of the trait',
      allowedValues: [
        'physical',
        'metabolic',
        'cognitive',
        'behavioral',
        'nutritional',
        'athletic',
        'other',
      ],
    },
    {
      name: 'effectAllele',
      displayName: 'Effect Allele',
      type: 'allele',
      required: false,
      description: 'Allele associated with the effect',
    },
    {
      name: 'effect',
      displayName: 'Effect',
      type: 'string',
      required: true,
      description: 'Description of the effect',
    },
    {
      name: 'magnitude',
      displayName: 'Magnitude',
      type: 'number',
      required: false,
      description: 'Effect magnitude or odds ratio',
    },
    {
      name: 'pValue',
      displayName: 'P-Value',
      type: 'number',
      required: false,
      description: 'Statistical p-value',
    },
    {
      name: 'populationStudied',
      displayName: 'Population Studied',
      type: 'string',
      required: false,
      description: 'Population in which the association was studied',
    },
  ],
  indexFields: ['rsid', 'gene', 'traitName'],
};

/**
 * Clinical significance schema
 */
export const CLINICAL_SIGNIFICANCE_SCHEMA: DatabaseSchema = {
  id: 'clinical_significance',
  version: '1.0.0',
  name: 'Clinical Significance',
  description: 'Schema for clinical significance classifications',
  primaryKey: ['rsid', 'condition'],
  fields: [
    COMMON_FIELDS.rsid,
    COMMON_FIELDS.chromosome,
    COMMON_FIELDS.position,
    COMMON_FIELDS.refAllele,
    COMMON_FIELDS.altAllele,
    COMMON_FIELDS.gene,
    {
      name: 'condition',
      displayName: 'Condition',
      type: 'string',
      required: true,
      description: 'Disease or condition name',
    },
    {
      name: 'significance',
      displayName: 'Clinical Significance',
      type: 'significance',
      required: true,
      description: 'Clinical significance classification',
      allowedValues: [
        'pathogenic',
        'likely_pathogenic',
        'uncertain_significance',
        'likely_benign',
        'benign',
        'risk_factor',
        'protective',
        'drug_response',
        'conflicting',
      ],
    },
    {
      name: 'inheritance',
      displayName: 'Inheritance',
      type: 'string',
      required: false,
      description: 'Mode of inheritance',
      allowedValues: [
        'autosomal_dominant',
        'autosomal_recessive',
        'x_linked_dominant',
        'x_linked_recessive',
        'mitochondrial',
        'complex',
        'unknown',
      ],
    },
    {
      name: 'reviewStatus',
      displayName: 'Review Status',
      type: 'string',
      required: false,
      description: 'Review status of the classification',
    },
    {
      name: 'actionability',
      displayName: 'Actionability',
      type: 'string',
      required: false,
      description: 'Whether actionable interventions exist',
      allowedValues: ['actionable', 'potentially_actionable', 'not_actionable', 'unknown'],
    },
  ],
  indexFields: ['rsid', 'gene', 'condition', 'significance'],
};

/**
 * Population frequency schema
 */
export const POPULATION_FREQUENCY_SCHEMA: DatabaseSchema = {
  id: 'population_frequency',
  version: '1.0.0',
  name: 'Population Frequency',
  description: 'Schema for allele frequency data across populations',
  primaryKey: ['rsid', 'population'],
  fields: [
    COMMON_FIELDS.rsid,
    COMMON_FIELDS.chromosome,
    COMMON_FIELDS.position,
    COMMON_FIELDS.refAllele,
    COMMON_FIELDS.altAllele,
    {
      name: 'population',
      displayName: 'Population',
      type: 'string',
      required: true,
      description: 'Population or ancestry group',
    },
    {
      name: 'alleleFrequency',
      displayName: 'Allele Frequency',
      type: 'frequency',
      required: true,
      description: 'Minor allele frequency (0-1)',
    },
    {
      name: 'sampleSize',
      displayName: 'Sample Size',
      type: 'number',
      required: false,
      description: 'Number of samples in the study',
    },
    {
      name: 'source',
      displayName: 'Source',
      type: 'string',
      required: false,
      description: 'Data source (e.g., gnomAD, 1000 Genomes)',
    },
    {
      name: 'version',
      displayName: 'Version',
      type: 'string',
      required: false,
      description: 'Database version',
    },
  ],
  indexFields: ['rsid', 'population'],
};

/**
 * Gene function schema
 */
export const GENE_FUNCTION_SCHEMA: DatabaseSchema = {
  id: 'gene_function',
  version: '1.0.0',
  name: 'Gene Function',
  description: 'Schema for gene function and pathway information',
  primaryKey: ['gene'],
  fields: [
    {
      name: 'gene',
      displayName: 'Gene Symbol',
      type: 'gene',
      required: true,
      description: 'Official gene symbol',
    },
    {
      name: 'geneName',
      displayName: 'Gene Name',
      type: 'string',
      required: false,
      description: 'Full gene name',
    },
    {
      name: 'geneId',
      displayName: 'Gene ID',
      type: 'string',
      required: false,
      description: 'NCBI Gene ID or Ensembl ID',
    },
    {
      name: 'function',
      displayName: 'Function',
      type: 'string',
      required: true,
      description: 'Gene function description',
    },
    {
      name: 'pathway',
      displayName: 'Pathway',
      type: 'string',
      required: false,
      description: 'Biological pathway',
    },
    {
      name: 'goTerms',
      displayName: 'GO Terms',
      type: 'string',
      required: false,
      description: 'Gene Ontology terms (comma-separated)',
    },
    {
      name: 'expression',
      displayName: 'Expression',
      type: 'string',
      required: false,
      description: 'Tissue expression profile',
    },
    {
      name: 'associatedDiseases',
      displayName: 'Associated Diseases',
      type: 'string',
      required: false,
      description: 'Associated diseases (comma-separated)',
    },
  ],
  indexFields: ['gene', 'geneId'],
};

/**
 * Get predefined schema by type
 */
export function getPredefinedSchema(type: PredefinedSchemaType): DatabaseSchema | null {
  const schemas: Record<PredefinedSchemaType, DatabaseSchema | null> = {
    variant_annotation: VARIANT_ANNOTATION_SCHEMA,
    drug_response: DRUG_RESPONSE_SCHEMA,
    trait_association: TRAIT_ASSOCIATION_SCHEMA,
    clinical_significance: CLINICAL_SIGNIFICANCE_SCHEMA,
    population_frequency: POPULATION_FREQUENCY_SCHEMA,
    gene_function: GENE_FUNCTION_SCHEMA,
    custom: null,
  };

  return schemas[type];
}

/**
 * Get all predefined schemas
 */
export function getAllPredefinedSchemas(): DatabaseSchema[] {
  return [
    VARIANT_ANNOTATION_SCHEMA,
    DRUG_RESPONSE_SCHEMA,
    TRAIT_ASSOCIATION_SCHEMA,
    CLINICAL_SIGNIFICANCE_SCHEMA,
    POPULATION_FREQUENCY_SCHEMA,
    GENE_FUNCTION_SCHEMA,
  ];
}

/**
 * Create a custom schema
 */
export function createCustomSchema(options: {
  name: string;
  description?: string;
  fields: DatabaseField[];
  primaryKey: string[];
  indexFields?: string[];
}): DatabaseSchema {
  return {
    id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    version: '1.0.0',
    name: options.name,
    description: options.description,
    primaryKey: options.primaryKey,
    fields: options.fields,
    indexFields: options.indexFields,
  };
}

/**
 * Validate a schema definition
 */
export function validateSchema(schema: DatabaseSchema): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!schema.id) {
    errors.push('Schema must have an id');
  }

  if (!schema.name) {
    errors.push('Schema must have a name');
  }

  if (!schema.fields || schema.fields.length === 0) {
    errors.push('Schema must have at least one field');
  }

  if (!schema.primaryKey || schema.primaryKey.length === 0) {
    errors.push('Schema must have at least one primary key field');
  }

  // Validate primary key fields exist
  const fieldNames = new Set(schema.fields.map((f) => f.name));
  for (const pk of schema.primaryKey) {
    if (!fieldNames.has(pk)) {
      errors.push(`Primary key field '${pk}' not found in schema fields`);
    }
  }

  // Validate index fields exist
  if (schema.indexFields) {
    for (const idx of schema.indexFields) {
      if (!fieldNames.has(idx)) {
        errors.push(`Index field '${idx}' not found in schema fields`);
      }
    }
  }

  // Validate field definitions
  const seenNames = new Set<string>();
  for (const field of schema.fields) {
    if (!field.name) {
      errors.push('All fields must have a name');
    } else if (seenNames.has(field.name)) {
      errors.push(`Duplicate field name: ${field.name}`);
    } else {
      seenNames.add(field.name);
    }

    if (!field.type) {
      errors.push(`Field '${field.name}' must have a type`);
    }
  }

  return { valid: errors.length === 0, errors };
}
