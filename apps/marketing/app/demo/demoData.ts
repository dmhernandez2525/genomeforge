/**
 * Demo data for GenomeForge demonstration mode
 * Contains realistic sample genomics data for showcase purposes
 */

// ============================================================================
// Types for Demo Data
// ============================================================================

export interface DemoSNP {
  rsid: string;
  chromosome: string;
  position: number;
  genotype: string;
  referenceAllele: string;
  alternateAllele: string;
}

export interface DemoClinVarVariant {
  rsid: string;
  gene: string;
  clinicalSignificance: 'pathogenic' | 'likely_pathogenic' | 'uncertain_significance' | 'likely_benign' | 'benign';
  conditions: { name: string; traits: string[] }[];
  reviewStatus: 0 | 1 | 2 | 3 | 4;
}

export interface DemoPharmGKBVariant {
  rsid: string;
  gene: string;
  drugs: {
    drugName: string;
    evidenceLevel: '1A' | '1B' | '2A' | '2B' | '3' | '4';
    annotation: string;
  }[];
}

export interface DemoGWASAssociation {
  rsid: string;
  trait: string;
  pValue: number;
  riskAllele: string;
  hasRiskAllele: boolean;
  riskAlleleCopies: number;
}

export interface DemoMetabolizerPhenotype {
  gene: string;
  diplotype: string;
  phenotype: 'ultrarapid' | 'rapid' | 'normal' | 'intermediate' | 'poor';
  activityScore: number;
  affectedDrugs: {
    drugName: string;
    recommendation: string;
    severity: 'critical' | 'moderate' | 'informational';
    evidenceLevel: string;
  }[];
}

export interface DemoCarrierStatus {
  gene: string;
  condition: string;
  inheritance: 'autosomal_recessive' | 'x_linked';
  carrierType: 'heterozygous' | 'x_linked_female';
  populationFrequency: number;
}

export interface DemoTraitAssociation {
  trait: string;
  category: 'disease' | 'cardiovascular' | 'metabolic' | 'neurological' | 'physical_trait';
  variantCount: number;
  riskScore: number;
  interpretation: 'increased' | 'typical' | 'decreased';
  confidence: 'high' | 'moderate' | 'low';
}

export interface DemoPolygenicScore {
  trait: string;
  percentile: number;
  zScore: number;
  riskCategory: 'very_high' | 'high' | 'moderate' | 'average' | 'low' | 'very_low';
  variantsUsed: number;
}

export interface DemoRiskAssessment {
  condition: string;
  gene: string;
  riskLevel: 'high' | 'moderate' | 'low' | 'informational';
  confidence: number;
  explanation: string;
}

// ============================================================================
// Demo Genome Summary
// ============================================================================

export const demoGenomeSummary = {
  id: 'demo-genome-2024',
  format: '23andMe v5',
  snpCount: 638_291,
  buildVersion: 'GRCh37/hg19',
  uploadedAt: new Date().toISOString(),
};

// ============================================================================
// Demo Analysis Summary
// ============================================================================

export const demoAnalysisSummary = {
  totalVariantsAnalyzed: 638_291,
  matchedVariants: 42_856,
  pathogenicCount: 3,
  likelyPathogenicCount: 7,
  drugInteractionCount: 28,
  carrierCount: 5,
  gwasAssociationCount: 156,
  analysisDate: new Date().toISOString(),
};

// ============================================================================
// Demo ClinVar Variants (Disease Risk)
// ============================================================================

export const demoClinVarVariants: DemoClinVarVariant[] = [
  {
    rsid: 'rs1800562',
    gene: 'HFE',
    clinicalSignificance: 'pathogenic',
    conditions: [{ name: 'Hereditary hemochromatosis', traits: ['Iron overload', 'Liver disease'] }],
    reviewStatus: 4,
  },
  {
    rsid: 'rs1799945',
    gene: 'HFE',
    clinicalSignificance: 'likely_pathogenic',
    conditions: [{ name: 'Hereditary hemochromatosis (H63D variant)', traits: ['Mild iron overload'] }],
    reviewStatus: 3,
  },
  {
    rsid: 'rs1801133',
    gene: 'MTHFR',
    clinicalSignificance: 'likely_pathogenic',
    conditions: [{ name: 'MTHFR deficiency (C677T)', traits: ['Elevated homocysteine', 'Folate metabolism'] }],
    reviewStatus: 4,
  },
  {
    rsid: 'rs429358',
    gene: 'APOE',
    clinicalSignificance: 'uncertain_significance',
    conditions: [{ name: 'Alzheimer disease susceptibility', traits: ['Late-onset Alzheimer risk'] }],
    reviewStatus: 3,
  },
  {
    rsid: 'rs7412',
    gene: 'APOE',
    clinicalSignificance: 'likely_benign',
    conditions: [{ name: 'APOE polymorphism', traits: ['Lipid metabolism variant'] }],
    reviewStatus: 3,
  },
  {
    rsid: 'rs1805007',
    gene: 'MC1R',
    clinicalSignificance: 'likely_pathogenic',
    conditions: [{ name: 'Melanoma susceptibility', traits: ['Increased UV sensitivity', 'Red hair phenotype'] }],
    reviewStatus: 3,
  },
  {
    rsid: 'rs334',
    gene: 'HBB',
    clinicalSignificance: 'pathogenic',
    conditions: [{ name: 'Sickle cell trait (carrier)', traits: ['Carrier status - not affected'] }],
    reviewStatus: 4,
  },
  {
    rsid: 'rs80357906',
    gene: 'BRCA2',
    clinicalSignificance: 'uncertain_significance',
    conditions: [{ name: 'BRCA2 variant of uncertain significance', traits: ['Further testing recommended'] }],
    reviewStatus: 2,
  },
  {
    rsid: 'rs12255372',
    gene: 'TCF7L2',
    clinicalSignificance: 'likely_pathogenic',
    conditions: [{ name: 'Type 2 diabetes susceptibility', traits: ['Increased T2D risk'] }],
    reviewStatus: 3,
  },
  {
    rsid: 'rs9939609',
    gene: 'FTO',
    clinicalSignificance: 'uncertain_significance',
    conditions: [{ name: 'Obesity susceptibility', traits: ['BMI influence'] }],
    reviewStatus: 2,
  },
];

// ============================================================================
// Demo PharmGKB Variants (Pharmacogenomics)
// ============================================================================

export const demoPharmGKBVariants: DemoPharmGKBVariant[] = [
  {
    rsid: 'rs4244285',
    gene: 'CYP2C19',
    drugs: [
      { drugName: 'Clopidogrel (Plavix)', evidenceLevel: '1A', annotation: 'Poor metabolizer - reduced efficacy, consider alternative antiplatelet therapy' },
      { drugName: 'Omeprazole (Prilosec)', evidenceLevel: '1A', annotation: 'Poor metabolizer - increased drug levels, consider dose reduction' },
      { drugName: 'Escitalopram (Lexapro)', evidenceLevel: '2A', annotation: 'Poor metabolizer - may need dose adjustment' },
    ],
  },
  {
    rsid: 'rs1065852',
    gene: 'CYP2D6',
    drugs: [
      { drugName: 'Codeine', evidenceLevel: '1A', annotation: 'Intermediate metabolizer - reduced conversion to morphine, may have diminished pain relief' },
      { drugName: 'Tramadol', evidenceLevel: '1A', annotation: 'Intermediate metabolizer - consider alternative analgesic' },
      { drugName: 'Tamoxifen', evidenceLevel: '1A', annotation: 'Intermediate metabolizer - reduced conversion to active metabolite' },
    ],
  },
  {
    rsid: 'rs9923231',
    gene: 'VKORC1',
    drugs: [
      { drugName: 'Warfarin (Coumadin)', evidenceLevel: '1A', annotation: 'Sensitive - requires lower dose, increased bleeding risk at standard doses' },
    ],
  },
  {
    rsid: 'rs1799853',
    gene: 'CYP2C9',
    drugs: [
      { drugName: 'Warfarin (Coumadin)', evidenceLevel: '1A', annotation: 'Intermediate metabolizer - slower drug clearance, dose reduction recommended' },
      { drugName: 'Celecoxib (Celebrex)', evidenceLevel: '2A', annotation: 'Intermediate metabolizer - consider lower starting dose' },
    ],
  },
  {
    rsid: 'rs2279343',
    gene: 'CYP2B6',
    drugs: [
      { drugName: 'Efavirenz', evidenceLevel: '1B', annotation: 'Slow metabolizer - higher plasma levels, consider dose reduction' },
      { drugName: 'Bupropion (Wellbutrin)', evidenceLevel: '2A', annotation: 'May affect drug metabolism' },
    ],
  },
  {
    rsid: 'rs1051266',
    gene: 'SLC19A1',
    drugs: [
      { drugName: 'Methotrexate', evidenceLevel: '2A', annotation: 'Reduced folate transport - may affect drug response' },
    ],
  },
  {
    rsid: 'rs4149056',
    gene: 'SLCO1B1',
    drugs: [
      { drugName: 'Simvastatin (Zocor)', evidenceLevel: '1A', annotation: 'Increased myopathy risk - use lower dose or alternative statin' },
      { drugName: 'Atorvastatin (Lipitor)', evidenceLevel: '2A', annotation: 'Moderately increased exposure - monitor for side effects' },
    ],
  },
  {
    rsid: 'rs1800497',
    gene: 'ANKK1/DRD2',
    drugs: [
      { drugName: 'Antipsychotics', evidenceLevel: '2B', annotation: 'Altered dopamine receptor sensitivity - may affect drug response' },
    ],
  },
];

// ============================================================================
// Demo Metabolizer Phenotypes
// ============================================================================

export const demoMetabolizerPhenotypes: DemoMetabolizerPhenotype[] = [
  {
    gene: 'CYP2D6',
    diplotype: '*1/*4',
    phenotype: 'intermediate',
    activityScore: 1.0,
    affectedDrugs: [
      { drugName: 'Codeine', recommendation: 'Use label-recommended age-specific dosing', severity: 'moderate', evidenceLevel: '1A' },
      { drugName: 'Tramadol', recommendation: 'Use label-recommended age-specific dosing', severity: 'moderate', evidenceLevel: '1A' },
      { drugName: 'Ondansetron', recommendation: 'Standard dosing', severity: 'informational', evidenceLevel: '2A' },
      { drugName: 'Tamoxifen', recommendation: 'Consider alternative hormonal therapy', severity: 'critical', evidenceLevel: '1A' },
    ],
  },
  {
    gene: 'CYP2C19',
    diplotype: '*1/*2',
    phenotype: 'intermediate',
    activityScore: 1.0,
    affectedDrugs: [
      { drugName: 'Clopidogrel', recommendation: 'Alternative antiplatelet therapy recommended', severity: 'critical', evidenceLevel: '1A' },
      { drugName: 'Omeprazole', recommendation: 'Consider dose reduction or alternative PPI', severity: 'moderate', evidenceLevel: '1A' },
      { drugName: 'Sertraline', recommendation: 'Standard dosing typically appropriate', severity: 'informational', evidenceLevel: '2B' },
    ],
  },
  {
    gene: 'CYP2C9',
    diplotype: '*1/*2',
    phenotype: 'intermediate',
    activityScore: 1.5,
    affectedDrugs: [
      { drugName: 'Warfarin', recommendation: 'Reduce dose by 20-40%, monitor INR closely', severity: 'critical', evidenceLevel: '1A' },
      { drugName: 'Phenytoin', recommendation: 'Consider 25% dose reduction', severity: 'moderate', evidenceLevel: '1A' },
    ],
  },
  {
    gene: 'CYP3A5',
    diplotype: '*3/*3',
    phenotype: 'poor',
    activityScore: 0,
    affectedDrugs: [
      { drugName: 'Tacrolimus', recommendation: 'Standard initial dosing (non-expresser)', severity: 'moderate', evidenceLevel: '1A' },
    ],
  },
  {
    gene: 'SLCO1B1',
    diplotype: '*1/*5',
    phenotype: 'intermediate',
    activityScore: 1.0,
    affectedDrugs: [
      { drugName: 'Simvastatin', recommendation: 'Use max 20mg dose, consider alternative statin', severity: 'critical', evidenceLevel: '1A' },
      { drugName: 'Rosuvastatin', recommendation: 'Use lower starting dose', severity: 'moderate', evidenceLevel: '2A' },
    ],
  },
  {
    gene: 'VKORC1',
    diplotype: 'A/G',
    phenotype: 'intermediate',
    activityScore: 1.0,
    affectedDrugs: [
      { drugName: 'Warfarin', recommendation: 'May require lower than average dose', severity: 'critical', evidenceLevel: '1A' },
    ],
  },
];

// ============================================================================
// Demo Carrier Statuses
// ============================================================================

export const demoCarrierStatuses: DemoCarrierStatus[] = [
  {
    gene: 'HBB',
    condition: 'Sickle Cell Disease',
    inheritance: 'autosomal_recessive',
    carrierType: 'heterozygous',
    populationFrequency: 0.08,
  },
  {
    gene: 'CFTR',
    condition: 'Cystic Fibrosis',
    inheritance: 'autosomal_recessive',
    carrierType: 'heterozygous',
    populationFrequency: 0.04,
  },
  {
    gene: 'HFE',
    condition: 'Hereditary Hemochromatosis',
    inheritance: 'autosomal_recessive',
    carrierType: 'heterozygous',
    populationFrequency: 0.10,
  },
  {
    gene: 'GJB2',
    condition: 'Nonsyndromic Hearing Loss',
    inheritance: 'autosomal_recessive',
    carrierType: 'heterozygous',
    populationFrequency: 0.03,
  },
  {
    gene: 'SMN1',
    condition: 'Spinal Muscular Atrophy',
    inheritance: 'autosomal_recessive',
    carrierType: 'heterozygous',
    populationFrequency: 0.02,
  },
];

// ============================================================================
// Demo GWAS Trait Associations
// ============================================================================

export const demoTraitAssociations: DemoTraitAssociation[] = [
  {
    trait: 'Type 2 Diabetes',
    category: 'metabolic',
    variantCount: 12,
    riskScore: 0.68,
    interpretation: 'increased',
    confidence: 'high',
  },
  {
    trait: 'Coronary Artery Disease',
    category: 'cardiovascular',
    variantCount: 8,
    riskScore: 0.52,
    interpretation: 'typical',
    confidence: 'high',
  },
  {
    trait: 'Age-related Macular Degeneration',
    category: 'disease',
    variantCount: 5,
    riskScore: 0.35,
    interpretation: 'decreased',
    confidence: 'moderate',
  },
  {
    trait: 'Caffeine Metabolism',
    category: 'metabolic',
    variantCount: 3,
    riskScore: 0.72,
    interpretation: 'increased',
    confidence: 'high',
  },
  {
    trait: 'Lactose Intolerance',
    category: 'metabolic',
    variantCount: 2,
    riskScore: 0.15,
    interpretation: 'decreased',
    confidence: 'high',
  },
  {
    trait: 'Alzheimer Disease',
    category: 'neurological',
    variantCount: 4,
    riskScore: 0.58,
    interpretation: 'typical',
    confidence: 'moderate',
  },
  {
    trait: 'BMI / Obesity',
    category: 'metabolic',
    variantCount: 15,
    riskScore: 0.61,
    interpretation: 'increased',
    confidence: 'moderate',
  },
  {
    trait: 'Atrial Fibrillation',
    category: 'cardiovascular',
    variantCount: 6,
    riskScore: 0.45,
    interpretation: 'typical',
    confidence: 'moderate',
  },
  {
    trait: 'Height',
    category: 'physical_trait',
    variantCount: 28,
    riskScore: 0.67,
    interpretation: 'increased',
    confidence: 'high',
  },
  {
    trait: 'Eye Color (Blue)',
    category: 'physical_trait',
    variantCount: 4,
    riskScore: 0.82,
    interpretation: 'increased',
    confidence: 'high',
  },
];

// ============================================================================
// Demo Polygenic Risk Scores
// ============================================================================

export const demoPolygenicScores: DemoPolygenicScore[] = [
  {
    trait: 'Coronary Artery Disease',
    percentile: 62,
    zScore: 0.31,
    riskCategory: 'average',
    variantsUsed: 1247,
  },
  {
    trait: 'Type 2 Diabetes',
    percentile: 78,
    zScore: 0.77,
    riskCategory: 'moderate',
    variantsUsed: 892,
  },
  {
    trait: 'Breast Cancer',
    percentile: 45,
    zScore: -0.13,
    riskCategory: 'average',
    variantsUsed: 313,
  },
  {
    trait: 'Prostate Cancer',
    percentile: 28,
    zScore: -0.58,
    riskCategory: 'low',
    variantsUsed: 147,
  },
  {
    trait: 'Atrial Fibrillation',
    percentile: 71,
    zScore: 0.55,
    riskCategory: 'moderate',
    variantsUsed: 184,
  },
  {
    trait: 'Alzheimer Disease',
    percentile: 55,
    zScore: 0.13,
    riskCategory: 'average',
    variantsUsed: 84,
  },
  {
    trait: 'BMI',
    percentile: 68,
    zScore: 0.47,
    riskCategory: 'moderate',
    variantsUsed: 2105,
  },
  {
    trait: 'LDL Cholesterol',
    percentile: 81,
    zScore: 0.88,
    riskCategory: 'high',
    variantsUsed: 456,
  },
];

// ============================================================================
// Demo Risk Assessments
// ============================================================================

export const demoRiskAssessments: DemoRiskAssessment[] = [
  {
    condition: 'Hereditary Hemochromatosis',
    gene: 'HFE',
    riskLevel: 'moderate',
    confidence: 0.85,
    explanation: 'Compound heterozygote for C282Y/H63D mutations. Moderate risk for iron overload. Regular monitoring of serum ferritin and transferrin saturation recommended.',
  },
  {
    condition: 'Drug Metabolism - CYP2C19',
    gene: 'CYP2C19',
    riskLevel: 'high',
    confidence: 0.95,
    explanation: 'Intermediate metabolizer status affects multiple commonly prescribed medications including clopidogrel and certain antidepressants. Alternative medications or dose adjustments may be needed.',
  },
  {
    condition: 'Statin-induced Myopathy Risk',
    gene: 'SLCO1B1',
    riskLevel: 'moderate',
    confidence: 0.90,
    explanation: 'Carrier of SLCO1B1*5 variant associated with increased risk of statin-induced myopathy. Lower statin doses recommended, especially for simvastatin.',
  },
  {
    condition: 'Type 2 Diabetes',
    gene: 'TCF7L2',
    riskLevel: 'moderate',
    confidence: 0.75,
    explanation: 'Carries risk variants associated with Type 2 Diabetes. Lifestyle modifications and regular glucose monitoring recommended.',
  },
  {
    condition: 'MTHFR Deficiency',
    gene: 'MTHFR',
    riskLevel: 'low',
    confidence: 0.80,
    explanation: 'Heterozygous for C677T variant. May have slightly elevated homocysteine. Adequate folate intake recommended.',
  },
  {
    condition: 'Melanoma Susceptibility',
    gene: 'MC1R',
    riskLevel: 'informational',
    confidence: 0.70,
    explanation: 'Carries MC1R variant associated with fair skin and increased UV sensitivity. Sun protection measures advised.',
  },
];

// ============================================================================
// Demo Chat Messages
// ============================================================================

export const demoChatMessages = [
  {
    role: 'user' as const,
    content: 'What does my CYP2D6 intermediate metabolizer status mean?',
  },
  {
    role: 'assistant' as const,
    content: `Based on your genetic analysis, you have a CYP2D6 *1/*4 diplotype, which classifies you as an **Intermediate Metabolizer**.

**What this means:**
CYP2D6 is a liver enzyme that metabolizes about 25% of commonly prescribed medications. As an intermediate metabolizer, you process these drugs more slowly than normal metabolizers.

**Key medications affected:**
- **Codeine & Tramadol**: You may have reduced pain relief since these prodrugs need CYP2D6 to convert them to their active forms
- **Tamoxifen**: Reduced conversion to active metabolite (endoxifen) - alternative therapies should be considered if needed for breast cancer treatment
- **Some antidepressants**: May need dose adjustments for drugs like venlafaxine

**Recommendations:**
1. Share this information with your healthcare providers
2. Ask about pharmacogenomic testing for new prescriptions
3. Consider carrying a card noting your CYP2D6 status

Would you like me to explain any specific drug interactions in more detail?`,
  },
];

// ============================================================================
// Demo Report Preview
// ============================================================================

export const demoReportPreview = {
  title: 'Comprehensive Genetic Analysis Report',
  generatedAt: new Date().toISOString(),
  sections: [
    {
      title: 'Executive Summary',
      content: 'This report summarizes the genetic analysis of 638,291 variants from your 23andMe data. Key findings include 3 pathogenic variants, 28 pharmacogenomic interactions, and 5 carrier statuses.',
    },
    {
      title: 'Disease Risk Findings',
      content: 'Analysis identified variants of clinical significance in HFE, MTHFR, and APOE genes.',
      items: [
        'HFE: Compound heterozygote for hemochromatosis variants',
        'MTHFR: Heterozygous C677T - monitor folate status',
        'APOE: E3/E4 genotype - moderate Alzheimer risk factor',
      ],
    },
    {
      title: 'Pharmacogenomics Summary',
      content: 'Your genetic profile affects how you metabolize several common medications.',
      items: [
        'CYP2D6: Intermediate metabolizer - affects codeine, tramadol, tamoxifen',
        'CYP2C19: Intermediate metabolizer - affects clopidogrel, PPIs',
        'SLCO1B1: Increased statin myopathy risk',
        'VKORC1: Warfarin sensitive - lower doses needed',
      ],
    },
    {
      title: 'Carrier Status',
      content: 'You are a carrier for the following recessive conditions:',
      items: [
        'Sickle Cell Trait (HBB gene)',
        'Cystic Fibrosis carrier (CFTR gene)',
        'Hemochromatosis carrier (HFE gene)',
      ],
    },
  ],
};
