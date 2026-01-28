export interface DatabaseMetadata {
  name: string;
  version: string;
  lastUpdated: Date;
  recordCount: number;
  checksum: string;
  source: string;
  license: string;
}

export interface DatabaseUpdateInfo {
  database: string;
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  updateSize?: number;
  releaseNotes?: string;
}

export interface ClinVarRecord {
  rsid: string;
  gene: string;
  clinicalSignificance: ClinicalSignificance;
  reviewStatus: number; // Star rating 0-4
  conditions: ConditionInfo[];
  lastEvaluated?: Date;
  variationId: string;
  chromosome: string;
  position: number;
  referenceAllele: string;
  alternateAllele: string;
}

export type ClinicalSignificance =
  | 'pathogenic'
  | 'likely_pathogenic'
  | 'uncertain_significance'
  | 'likely_benign'
  | 'benign'
  | 'conflicting'
  | 'not_provided';

export interface ConditionInfo {
  name: string;
  medGenId?: string;
  omimId?: string;
}

export interface PharmGKBRecord {
  rsid: string;
  gene: string;
  drugs: DrugInteraction[];
  phenotypes: string[];
  evidenceLevel: string;
  cpicLevel?: string;
}

export interface DrugInteraction {
  name: string;
  genericName: string;
  categories: string[];
  phenotypeText: string;
  dosingGuideline?: string;
  cpicGuideline?: string;
}
