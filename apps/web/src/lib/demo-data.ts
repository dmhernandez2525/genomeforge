/**
 * Demo Mode Data for GenomeForge
 *
 * Mock genomics data for portfolio demonstration purposes.
 * This data is realistic but entirely fictional.
 */

import type {
  AnnotatedSNP,
  ClinVarVariant,
  EnhancedAnalysisResult,
  EnhancedCarrierStatus,
  EnhancedMetabolizerPhenotype,
  GWASAssociation,
  MatchResult,
  ParsedGenome,
  PharmGKBVariant,
  PolygenicRiskScore,
  RiskAssessment,
  SNP,
  TraitAssociation
} from '@genomeforge/types';

// ============================================================================
// Demo User Roles
// ============================================================================

export type DemoRole = 'researcher' | 'patient';

export interface DemoUser {
  id: string;
  name: string;
  role: DemoRole;
  description: string;
  avatar: string;
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'demo-researcher',
    name: 'Dr. Sarah Chen',
    role: 'researcher',
    description:
      'Genetic researcher with full access to detailed analysis tools and raw data exports',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah&backgroundColor=b6e3f4'
  },
  {
    id: 'demo-patient',
    name: 'Alex Morgan',
    role: 'patient',
    description: 'Patient viewing their own genetic analysis with simplified, actionable insights',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex&backgroundColor=c0aede'
  }
];

// ============================================================================
// Demo SNP Data
// ============================================================================

const createSNP = (rsid: string, chromosome: string, position: number, genotype: string): SNP => ({
  rsid,
  chromosome: chromosome as SNP['chromosome'],
  position,
  genotype,
  allele1: genotype[0] as SNP['allele1'],
  allele2: genotype[1] as SNP['allele2']
});

// Create a set of realistic SNPs for demo purposes
const demoSNPsArray: SNP[] = [
  // CYP2D6 - Drug metabolism (Codeine, Tramadol, etc.)
  createSNP('rs1065852', '22', 42523805, 'GA'),
  createSNP('rs16947', '22', 42524947, 'CT'),
  createSNP('rs1135840', '22', 42525134, 'CG'),

  // CYP2C19 - Drug metabolism (Clopidogrel, PPIs)
  createSNP('rs4244285', '10', 96541616, 'GA'),
  createSNP('rs12248560', '10', 96521657, 'CT'),

  // APOE - Alzheimer's risk
  createSNP('rs429358', '19', 45411941, 'TC'),
  createSNP('rs7412', '19', 45412079, 'CT'),

  // MTHFR - Folate metabolism
  createSNP('rs1801133', '1', 11856378, 'CT'),
  createSNP('rs1801131', '1', 11854476, 'AC'),

  // BRCA1/BRCA2 - Cancer risk (benign variants)
  createSNP('rs1799950', '17', 43094464, 'GG'),
  createSNP('rs1799966', '17', 43071077, 'CT'),

  // Factor V Leiden - Blood clotting
  createSNP('rs6025', '1', 169549811, 'CC'),

  // SLCO1B1 - Statin metabolism
  createSNP('rs4149056', '12', 21178615, 'TC'),

  // HLA-B*57:01 - Abacavir hypersensitivity
  createSNP('rs2395029', '6', 31431780, 'TT'),

  // VKORC1 - Warfarin sensitivity
  createSNP('rs9923231', '16', 31107689, 'CT'),

  // CYP3A4 - Drug metabolism
  createSNP('rs2740574', '7', 99784473, 'AG'),

  // UGT1A1 - Gilbert syndrome / Irinotecan metabolism
  createSNP('rs8175347', '2', 234668879, 'TA'),

  // DPYD - 5-FU toxicity
  createSNP('rs3918290', '1', 97915614, 'CC'),

  // TPMT - Thiopurine metabolism
  createSNP('rs1800460', '6', 18138997, 'CC'),
  createSNP('rs1142345', '6', 18143724, 'CC'),

  // ACE - Blood pressure / Exercise response
  createSNP('rs4646994', '17', 63488529, 'DI'),

  // ACTN3 - Athletic performance
  createSNP('rs1815739', '11', 66560624, 'CT'),

  // LCT - Lactose tolerance
  createSNP('rs4988235', '2', 136608646, 'CT'),

  // ALDH2 - Alcohol metabolism
  createSNP('rs671', '12', 111803962, 'GG'),

  // MC1R - Hair/skin pigmentation
  createSNP('rs1805007', '16', 89986117, 'CT'),
  createSNP('rs1805008', '16', 89986144, 'CC'),

  // OCA2 - Eye color
  createSNP('rs12913832', '15', 28365618, 'AG'),

  // Caffeine metabolism (CYP1A2)
  createSNP('rs762551', '15', 75041917, 'AC'),

  // COMT - Pain sensitivity / Stress response
  createSNP('rs4680', '22', 19963748, 'AG'),

  // BDNF - Brain plasticity
  createSNP('rs6265', '11', 27679916, 'CT'),

  // GWAS-associated variants
  createSNP('rs10811661', '9', 22134094, 'TT'), // Type 2 diabetes
  createSNP('rs9939609', '16', 53820527, 'TA'), // FTO obesity
  createSNP('rs4402960', '3', 185793899, 'GT'), // Type 2 diabetes
  createSNP('rs1801282', '3', 12351626, 'CG'), // PPARG diabetes
  createSNP('rs7903146', '10', 114758349, 'CT'), // TCF7L2 diabetes
  createSNP('rs12255372', '10', 114808902, 'GT') // TCF7L2 diabetes
];

// Create SNP map
const demoSNPsMap = new Map<string, SNP>();
for (const snp of demoSNPsArray) {
  demoSNPsMap.set(snp.rsid, snp);
}

// ============================================================================
// Demo Parsed Genome
// ============================================================================

export const DEMO_GENOME: ParsedGenome = {
  id: 'demo-genome-001',
  fileName: 'demo_genome_23andme_v5.txt',
  format: '23andme_v5',
  build: 'GRCh38',
  buildConfidence: 0.98,
  snpCount: demoSNPsArray.length,
  snps: demoSNPsMap,
  metadata: {
    source: '23andMe',
    chipVersion: 'v5',
    rawFileSize: 15728640 // ~15 MB
  },
  validation: {
    valid: true,
    snpsProcessed: demoSNPsArray.length,
    snpsSkipped: 0,
    warnings: [],
    errors: []
  },
  parsedAt: new Date()
};

// ============================================================================
// Demo ClinVar Annotations
// ============================================================================

const demoClinVarVariants: Map<string, ClinVarVariant> = new Map([
  [
    'rs1801133',
    {
      rsid: 'rs1801133',
      vcv: 'VCV000003520',
      gene: 'MTHFR',
      geneId: 4524,
      clinicalSignificance: 'uncertain_significance',
      reviewStatus: 2,
      conditions: [
        {
          name: 'MTHFR thermolabile variant',
          medgenId: 'C0268275',
          traits: ['Hyperhomocysteinemia']
        }
      ],
      molecularConsequence: 'missense_variant'
    }
  ],
  [
    'rs6025',
    {
      rsid: 'rs6025',
      vcv: 'VCV000017058',
      gene: 'F5',
      geneId: 2153,
      clinicalSignificance: 'benign',
      reviewStatus: 3,
      conditions: [
        {
          name: 'Factor V Leiden thrombophilia',
          medgenId: 'C1861171',
          traits: ['Blood clotting disorder']
        }
      ],
      molecularConsequence: 'missense_variant'
    }
  ],
  [
    'rs429358',
    {
      rsid: 'rs429358',
      vcv: 'VCV000001142',
      gene: 'APOE',
      geneId: 348,
      clinicalSignificance: 'uncertain_significance',
      reviewStatus: 2,
      conditions: [
        {
          name: "Alzheimer's disease susceptibility",
          medgenId: 'C0002395',
          traits: ['Neurodegeneration', "Alzheimer's disease"]
        }
      ],
      molecularConsequence: 'missense_variant'
    }
  ]
]);

// ============================================================================
// Demo PharmGKB Annotations
// ============================================================================

const demoPharmGKBVariants: Map<string, PharmGKBVariant> = new Map([
  [
    'rs1065852',
    {
      rsid: 'rs1065852',
      gene: 'CYP2D6',
      hasCPICGuideline: true,
      hasDPWGGuideline: true,
      drugs: [
        {
          drugName: 'Codeine',
          drugId: 'PA449088',
          evidenceLevel: '1A',
          phenotypeCategory: 'Efficacy',
          significance: 'Yes',
          annotation: 'Reduced conversion to morphine'
        },
        {
          drugName: 'Tramadol',
          drugId: 'PA451735',
          evidenceLevel: '1A',
          phenotypeCategory: 'Efficacy',
          significance: 'Yes',
          annotation: 'Reduced analgesic effect'
        },
        {
          drugName: 'Tamoxifen',
          drugId: 'PA451581',
          evidenceLevel: '1A',
          phenotypeCategory: 'Efficacy',
          significance: 'Yes',
          annotation: 'Reduced formation of active metabolite'
        }
      ]
    }
  ],
  [
    'rs4244285',
    {
      rsid: 'rs4244285',
      gene: 'CYP2C19',
      hasCPICGuideline: true,
      hasDPWGGuideline: true,
      drugs: [
        {
          drugName: 'Clopidogrel',
          drugId: 'PA449053',
          evidenceLevel: '1A',
          phenotypeCategory: 'Efficacy',
          significance: 'Yes',
          annotation: 'Reduced antiplatelet effect',
          fdaLabel: true
        },
        {
          drugName: 'Omeprazole',
          drugId: 'PA450704',
          evidenceLevel: '2A',
          phenotypeCategory: 'Efficacy',
          significance: 'Yes',
          annotation: 'Increased drug exposure'
        }
      ]
    }
  ],
  [
    'rs4149056',
    {
      rsid: 'rs4149056',
      gene: 'SLCO1B1',
      hasCPICGuideline: true,
      hasDPWGGuideline: true,
      drugs: [
        {
          drugName: 'Simvastatin',
          drugId: 'PA451363',
          evidenceLevel: '1A',
          phenotypeCategory: 'Toxicity',
          significance: 'Yes',
          annotation: 'Increased risk of myopathy',
          fdaLabel: true
        },
        {
          drugName: 'Atorvastatin',
          drugId: 'PA448500',
          evidenceLevel: '2A',
          phenotypeCategory: 'Toxicity',
          significance: 'Yes',
          annotation: 'Increased statin exposure'
        }
      ]
    }
  ],
  [
    'rs9923231',
    {
      rsid: 'rs9923231',
      gene: 'VKORC1',
      hasCPICGuideline: true,
      hasDPWGGuideline: true,
      drugs: [
        {
          drugName: 'Warfarin',
          drugId: 'PA451906',
          evidenceLevel: '1A',
          phenotypeCategory: 'Dosage',
          significance: 'Yes',
          annotation: 'Lower dose requirement',
          fdaLabel: true
        }
      ]
    }
  ]
]);

// ============================================================================
// Demo GWAS Associations
// ============================================================================

const demoGWASAssociations: GWASAssociation[] = [
  {
    rsid: 'rs9939609',
    trait: 'Body mass index',
    pValue: 1.2e-30,
    orBeta: 0.39,
    riskAllele: 'A',
    studyAccession: 'GCST000242',
    pubmedId: '17434869',
    userGenotype: 'TA',
    hasRiskAllele: true,
    riskAlleleCopies: 1
  },
  {
    rsid: 'rs7903146',
    trait: 'Type 2 diabetes',
    pValue: 2.4e-45,
    orBeta: 1.37,
    riskAllele: 'T',
    studyAccession: 'GCST000882',
    pubmedId: '17293876',
    userGenotype: 'CT',
    hasRiskAllele: true,
    riskAlleleCopies: 1
  },
  {
    rsid: 'rs10811661',
    trait: 'Type 2 diabetes',
    pValue: 8.5e-20,
    orBeta: 1.2,
    riskAllele: 'T',
    studyAccession: 'GCST000108',
    pubmedId: '17554300',
    userGenotype: 'TT',
    hasRiskAllele: true,
    riskAlleleCopies: 2
  },
  {
    rsid: 'rs12913832',
    trait: 'Eye color',
    pValue: 1.0e-300,
    orBeta: 20.0,
    riskAllele: 'G',
    studyAccession: 'GCST000559',
    pubmedId: '18172690',
    userGenotype: 'AG',
    hasRiskAllele: true,
    riskAlleleCopies: 1
  },
  {
    rsid: 'rs1815739',
    trait: 'Muscle fiber composition',
    pValue: 4.2e-12,
    orBeta: 1.5,
    riskAllele: 'T',
    studyAccession: 'GCST003159',
    pubmedId: '26119289',
    userGenotype: 'CT',
    hasRiskAllele: true,
    riskAlleleCopies: 1
  }
];

// ============================================================================
// Demo Annotated SNPs
// ============================================================================

const createAnnotatedSNP = (
  snp: SNP,
  clinvar?: ClinVarVariant,
  pharmgkb?: PharmGKBVariant,
  gwas?: GWASAssociation[]
): AnnotatedSNP => {
  let impactScore = 0;
  let category: AnnotatedSNP['category'] = 'neutral';

  if (clinvar) {
    if (
      clinvar.clinicalSignificance === 'pathogenic' ||
      clinvar.clinicalSignificance === 'likely_pathogenic'
    ) {
      impactScore += 5;
      category = 'pathogenic';
    } else if (clinvar.clinicalSignificance === 'uncertain_significance') {
      impactScore += 2;
    }
  }

  if (pharmgkb && pharmgkb.drugs.length > 0) {
    impactScore += 3;
    if (category === 'neutral') category = 'drug';
  }

  if (gwas && gwas.length > 0) {
    impactScore += 1;
  }

  return {
    snp,
    clinvar,
    pharmgkb,
    gwas,
    impactScore,
    category
  };
};

const demoAnnotatedSNPs: AnnotatedSNP[] = demoSNPsArray.map((snp) =>
  createAnnotatedSNP(
    snp,
    demoClinVarVariants.get(snp.rsid),
    demoPharmGKBVariants.get(snp.rsid),
    demoGWASAssociations.filter((g) => g.rsid === snp.rsid)
  )
);

// ============================================================================
// Demo Match Result
// ============================================================================

export const DEMO_MATCH_RESULT: MatchResult = {
  genomeId: 'demo-genome-001',
  totalSNPs: demoSNPsArray.length,
  matchedSNPs: 15,
  pathogenicCount: 0,
  drugInteractionCount: 4,
  carrierCount: 0,
  gwasAssociationCount: 5,
  annotatedSNPs: demoAnnotatedSNPs.sort((a, b) => b.impactScore - a.impactScore),
  summary: {
    highImpact: [],
    moderateImpact: [
      'CYP2D6 intermediate metabolizer status',
      'CYP2C19 intermediate metabolizer status'
    ],
    pharmacogenes: ['CYP2D6', 'CYP2C19', 'SLCO1B1', 'VKORC1'],
    carrierStatuses: [],
    gwasTraits: ['Type 2 diabetes', 'Body mass index', 'Eye color']
  },
  buildVersion: 'GRCh38',
  databaseVersions: {
    clinvar: '2024-01',
    pharmgkb: '2024-01',
    gwas: '2024-01'
  }
};

// ============================================================================
// Demo Risk Assessments
// ============================================================================

const demoRiskAssessments: RiskAssessment[] = [
  {
    condition: 'Type 2 Diabetes Susceptibility',
    gene: 'TCF7L2',
    riskLevel: 'moderate',
    confidence: 0.75,
    variants: demoAnnotatedSNPs.filter((s) => s.snp.rsid === 'rs7903146'),
    explanation:
      'You carry one copy of the T allele at rs7903146 in the TCF7L2 gene, associated with moderately increased risk of Type 2 diabetes. Lifestyle factors play a significant role in disease development.',
    inheritance: 'complex'
  },
  {
    condition: 'Elevated BMI Tendency',
    gene: 'FTO',
    riskLevel: 'low',
    confidence: 0.7,
    variants: demoAnnotatedSNPs.filter((s) => s.snp.rsid === 'rs9939609'),
    explanation:
      'You carry one copy of the A allele at the FTO locus, associated with slightly higher average BMI. This effect can be modified by physical activity and diet.',
    inheritance: 'complex'
  }
];

// ============================================================================
// Demo Metabolizer Phenotypes
// ============================================================================

const demoMetabolizerPhenotypes: EnhancedMetabolizerPhenotype[] = [
  {
    gene: 'CYP2D6',
    diplotype: '*1/*4',
    phenotype: 'intermediate',
    activityScore: 1.0,
    affectedDrugs: [
      {
        drugName: 'Codeine',
        genericName: 'codeine',
        recommendation: 'Use alternative analgesic not metabolized by CYP2D6',
        severity: 'moderate',
        evidenceLevel: '1A',
        hasFDALabel: true,
        cpicLevel: 'Strong',
        therapeuticCategory: 'Analgesic'
      },
      {
        drugName: 'Tramadol',
        genericName: 'tramadol',
        recommendation: 'Consider alternative analgesic or adjust dose',
        severity: 'moderate',
        evidenceLevel: '1A',
        hasFDALabel: false,
        cpicLevel: 'Strong',
        therapeuticCategory: 'Analgesic'
      }
    ],
    cpicStatus: 'available',
    contributingVariants: ['rs1065852', 'rs16947']
  },
  {
    gene: 'CYP2C19',
    diplotype: '*1/*2',
    phenotype: 'intermediate',
    activityScore: 1.0,
    affectedDrugs: [
      {
        drugName: 'Clopidogrel',
        genericName: 'clopidogrel',
        recommendation:
          'Consider alternative antiplatelet therapy. Reduced conversion to active metabolite may decrease efficacy.',
        severity: 'critical',
        evidenceLevel: '1A',
        hasFDALabel: true,
        cpicLevel: 'Strong',
        therapeuticCategory: 'Antiplatelet'
      }
    ],
    cpicStatus: 'available',
    contributingVariants: ['rs4244285']
  },
  {
    gene: 'SLCO1B1',
    phenotype: 'intermediate',
    affectedDrugs: [
      {
        drugName: 'Simvastatin',
        genericName: 'simvastatin',
        recommendation: 'Prescribe lower dose or consider alternative statin',
        severity: 'moderate',
        evidenceLevel: '1A',
        hasFDALabel: true,
        cpicLevel: 'Strong',
        therapeuticCategory: 'Statin'
      }
    ],
    cpicStatus: 'available',
    contributingVariants: ['rs4149056']
  },
  {
    gene: 'VKORC1',
    phenotype: 'intermediate',
    affectedDrugs: [
      {
        drugName: 'Warfarin',
        genericName: 'warfarin',
        recommendation: 'May require lower initial dose. Monitor INR closely.',
        severity: 'moderate',
        evidenceLevel: '1A',
        hasFDALabel: true,
        cpicLevel: 'Strong',
        therapeuticCategory: 'Anticoagulant'
      }
    ],
    cpicStatus: 'available',
    contributingVariants: ['rs9923231']
  }
];

// ============================================================================
// Demo Carrier Statuses
// ============================================================================

const demoCarrierStatuses: EnhancedCarrierStatus[] = [
  // No significant carrier statuses in this demo
];

// ============================================================================
// Demo Trait Associations
// ============================================================================

const demoTraitAssociations: TraitAssociation[] = [
  {
    trait: 'Type 2 Diabetes',
    category: 'metabolic',
    variantCount: 3,
    associations: demoGWASAssociations.filter((g) => g.trait.includes('diabetes')),
    riskScore: 0.62,
    interpretation: 'increased',
    confidence: 'moderate'
  },
  {
    trait: 'Body Mass Index',
    category: 'physical_trait',
    variantCount: 1,
    associations: demoGWASAssociations.filter((g) => g.trait.includes('Body mass')),
    riskScore: 0.55,
    interpretation: 'typical',
    confidence: 'moderate'
  },
  {
    trait: 'Eye Color (Blue/Brown)',
    category: 'physical_trait',
    variantCount: 1,
    associations: demoGWASAssociations.filter((g) => g.trait.includes('Eye')),
    riskScore: 0.5,
    interpretation: 'typical',
    confidence: 'high'
  }
];

// ============================================================================
// Demo Polygenic Risk Scores
// ============================================================================

export const DEMO_POLYGENIC_SCORES: PolygenicRiskScore[] = [
  {
    trait: 'Type 2 Diabetes',
    rawScore: 2.45,
    zScore: 0.85,
    percentile: 80,
    riskCategory: 'moderate',
    variantsUsed: 3,
    variantsMissing: 147,
    coverage: 2.0,
    relativeRisk: 1.35
  },
  {
    trait: 'Coronary Artery Disease',
    rawScore: 1.12,
    zScore: 0.22,
    percentile: 59,
    riskCategory: 'average',
    variantsUsed: 2,
    variantsMissing: 198,
    coverage: 1.0,
    relativeRisk: 1.05
  },
  {
    trait: 'Body Mass Index',
    rawScore: 1.89,
    zScore: 0.45,
    percentile: 67,
    riskCategory: 'average',
    variantsUsed: 1,
    variantsMissing: 96,
    coverage: 1.0,
    relativeRisk: 1.1
  }
];

// ============================================================================
// Demo Enhanced Analysis Result
// ============================================================================

export const DEMO_ENHANCED_RESULT: EnhancedAnalysisResult = {
  genomeId: 'demo-genome-001',
  analyzedAt: new Date(),
  riskAssessments: demoRiskAssessments,
  metabolizerPhenotypes: demoMetabolizerPhenotypes,
  carrierStatuses: demoCarrierStatuses,
  traitAssociations: demoTraitAssociations,
  polygenicRiskScores: DEMO_POLYGENIC_SCORES,
  summary: {
    totalVariantsAnalyzed: demoSNPsArray.length,
    pathogenicCount: 0,
    highRiskCount: 0,
    moderateRiskCount: 2,
    pharmacogeneCount: 4,
    carrierCount: 0,
    traitAssociationCount: 3,
    prsCount: 3,
    keyFindings: [
      {
        type: 'drug',
        priority: 'important',
        title: 'CYP2C19 Intermediate Metabolizer',
        description:
          'Reduced clopidogrel efficacy. Consider alternative antiplatelet therapy if prescribed.',
        relatedItem: 'CYP2C19'
      },
      {
        type: 'drug',
        priority: 'important',
        title: 'CYP2D6 Intermediate Metabolizer',
        description:
          'Reduced codeine and tramadol efficacy. Alternative pain medications may be more effective.',
        relatedItem: 'CYP2D6'
      },
      {
        type: 'drug',
        priority: 'informational',
        title: 'SLCO1B1 Intermediate Function',
        description:
          'Increased risk of statin-related muscle side effects. Lower doses may be appropriate.',
        relatedItem: 'SLCO1B1'
      },
      {
        type: 'prs',
        priority: 'informational',
        title: 'Type 2 Diabetes Risk',
        description:
          'Moderately elevated genetic risk score (80th percentile). Lifestyle modifications recommended.',
        relatedItem: 'Type 2 Diabetes'
      }
    ]
  },
  databaseVersions: {
    clinvar: '2024-01',
    pharmgkb: '2024-01',
    gwas: '2024-01'
  }
};

// ============================================================================
// Database Status for Demo
// ============================================================================

export const DEMO_DATABASE_STATUS = {
  clinvar: { loaded: true, count: 341256, loading: false, error: null },
  pharmgkb: { loaded: true, count: 12847, loading: false, error: null },
  gwas: { loaded: true, count: 276543, loading: false, error: null }
};
