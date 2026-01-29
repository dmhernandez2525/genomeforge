/**
 * English (en) Translations
 */

import type { Translations } from '../types';

export const common: Translations = {
  // App
  appName: 'GenomeForge',
  tagline: 'Privacy-First Genetic Analysis',

  // Navigation
  home: 'Home',
  upload: 'Upload',
  analysis: 'Analysis',
  reports: 'Reports',
  settings: 'Settings',
  help: 'Help',
  about: 'About',

  // Actions
  save: 'Save',
  cancel: 'Cancel',
  delete: 'Delete',
  edit: 'Edit',
  create: 'Create',
  update: 'Update',
  close: 'Close',
  confirm: 'Confirm',
  back: 'Back',
  next: 'Next',
  previous: 'Previous',
  submit: 'Submit',
  reset: 'Reset',
  clear: 'Clear',
  search: 'Search',
  filter: 'Filter',
  sort: 'Sort',
  export: 'Export',
  import: 'Import',
  download: 'Download',
  upload: 'Upload',
  refresh: 'Refresh',
  retry: 'Retry',
  loading: 'Loading...',
  processing: 'Processing...',

  // Status
  status: 'Status',
  pending: 'Pending',
  inProgress: 'In Progress',
  complete: 'Complete',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
  active: 'Active',
  inactive: 'Inactive',
  enabled: 'Enabled',
  disabled: 'Disabled',

  // Time
  now: 'Now',
  today: 'Today',
  yesterday: 'Yesterday',
  tomorrow: 'Tomorrow',
  thisWeek: 'This Week',
  lastWeek: 'Last Week',
  thisMonth: 'This Month',
  lastMonth: 'Last Month',

  // Results
  results: 'Results',
  noResults: 'No results found',
  showingResults: 'Showing {{count}} results',
  of: 'of',
  page: 'Page',
  perPage: 'Per page',

  // Confirmation
  areYouSure: 'Are you sure?',
  thisActionCannotBeUndone: 'This action cannot be undone.',
  yes: 'Yes',
  no: 'No',

  // Success/Error
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',

  // Privacy
  privacy: 'Privacy',
  privacyFirst: 'Privacy First',
  dataPrivacy: 'Your genetic data never leaves your device',
  localProcessing: 'All processing happens locally',
};

export const clinical: Translations = {
  // Section titles
  clinicalFindings: 'Clinical Findings',
  variantAnalysis: 'Variant Analysis',
  geneticRisks: 'Genetic Risks',
  healthInsights: 'Health Insights',

  // Significance levels
  significance: 'Significance',
  pathogenic: 'Pathogenic',
  likelyPathogenic: 'Likely Pathogenic',
  uncertainSignificance: 'Uncertain Significance',
  likelyBenign: 'Likely Benign',
  benign: 'Benign',
  riskFactor: 'Risk Factor',
  protective: 'Protective',
  drugResponse: 'Drug Response',

  // Risk levels
  riskLevel: 'Risk Level',
  highRisk: 'High Risk',
  moderateRisk: 'Moderate Risk',
  lowRisk: 'Low Risk',
  minimalRisk: 'Minimal Risk',
  protectiveEffect: 'Protective Effect',

  // Evidence levels
  evidenceLevel: 'Evidence Level',
  strongEvidence: 'Strong Evidence',
  moderateEvidence: 'Moderate Evidence',
  limitedEvidence: 'Limited Evidence',
  conflictingEvidence: 'Conflicting Evidence',
  expertOpinion: 'Expert Opinion',

  // Genetics
  variant: 'Variant',
  variants: 'Variants',
  gene: 'Gene',
  genes: 'Genes',
  genotype: 'Genotype',
  chromosome: 'Chromosome',
  position: 'Position',
  allele: 'Allele',
  referenceAllele: 'Reference Allele',
  alternateAllele: 'Alternate Allele',
  rsid: 'RS ID',

  // Conditions
  condition: 'Condition',
  conditions: 'Conditions',
  inheritance: 'Inheritance',
  autosomalDominant: 'Autosomal Dominant',
  autosomalRecessive: 'Autosomal Recessive',
  xLinked: 'X-Linked',
  mitochondrial: 'Mitochondrial',

  // Actions
  viewDetails: 'View Details',
  learnMore: 'Learn More',
  consultDoctor: 'Consult a Healthcare Provider',

  // Counts
  findingsCount: {
    one: '{{count}} finding',
    other: '{{count}} findings',
  },
  variantsAnalyzed: {
    one: '{{count}} variant analyzed',
    other: '{{count}} variants analyzed',
  },
};

export const drugs: Translations = {
  // Section titles
  drugResponses: 'Drug Responses',
  pharmacogenomics: 'Pharmacogenomics',
  medicationInsights: 'Medication Insights',

  // Metabolizer phenotypes
  phenotype: 'Phenotype',
  poorMetabolizer: 'Poor Metabolizer',
  intermediateMetabolizer: 'Intermediate Metabolizer',
  normalMetabolizer: 'Normal Metabolizer',
  rapidMetabolizer: 'Rapid Metabolizer',
  ultrarapidMetabolizer: 'Ultrarapid Metabolizer',
  indeterminate: 'Indeterminate',

  // Drug info
  drug: 'Drug',
  drugs: 'Drugs',
  drugName: 'Drug Name',
  drugClass: 'Drug Class',
  recommendation: 'Recommendation',
  dosingGuidance: 'Dosing Guidance',
  clinicalAction: 'Clinical Action',

  // Warnings
  adjustDosage: 'Dosage adjustment may be needed',
  alternativeRecommended: 'Alternative medication recommended',
  standardDosing: 'Standard dosing expected',
  increasedSensitivity: 'Increased sensitivity possible',
  decreasedEfficacy: 'Decreased efficacy possible',

  // Guidelines
  guideline: 'Guideline',
  guidelineSource: 'Guideline Source',
  cpic: 'CPIC',
  dpwg: 'DPWG',

  // Counts
  responsesCount: {
    one: '{{count}} drug response',
    other: '{{count}} drug responses',
  },
};

export const traits: Translations = {
  // Section titles
  traitAssociations: 'Trait Associations',
  geneticTraits: 'Genetic Traits',
  yourTraits: 'Your Traits',

  // Categories
  category: 'Category',
  physical: 'Physical',
  metabolic: 'Metabolic',
  cognitive: 'Cognitive',
  behavioral: 'Behavioral',
  nutritional: 'Nutritional',
  athletic: 'Athletic',
  longevity: 'Longevity',
  other: 'Other',

  // Effect
  effect: 'Effect',
  effectDirection: 'Effect Direction',
  increased: 'Increased',
  decreased: 'Decreased',
  associated: 'Associated',
  unknown: 'Unknown',

  // Confidence
  confidence: 'Confidence',
  highConfidence: 'High Confidence',
  moderateConfidence: 'Moderate Confidence',
  lowConfidence: 'Low Confidence',

  // Ancestry
  ancestry: 'Ancestry',
  ancestryComposition: 'Ancestry Composition',
  population: 'Population',
  maternalHaplogroup: 'Maternal Haplogroup',
  paternalHaplogroup: 'Paternal Haplogroup',
  neanderthal: 'Neanderthal Ancestry',

  // Counts
  traitsCount: {
    one: '{{count}} trait',
    other: '{{count}} traits',
  },
};

export const reports: Translations = {
  // Section titles
  reports: 'Reports',
  generateReport: 'Generate Report',
  reportHistory: 'Report History',

  // Report types
  reportType: 'Report Type',
  clinicalReport: 'Clinical Report',
  personalReport: 'Personal Report',
  researchReport: 'Research Report',
  summaryReport: 'Summary Report',
  detailedReport: 'Detailed Report',

  // Sections
  executiveSummary: 'Executive Summary',
  methodology: 'Methodology',
  limitations: 'Limitations',
  recommendations: 'Recommendations',
  references: 'References',
  appendix: 'Appendix',

  // Export
  exportFormat: 'Export Format',
  pdf: 'PDF',
  html: 'HTML',
  json: 'JSON',
  markdown: 'Markdown',

  // Status
  generating: 'Generating report...',
  reportReady: 'Report is ready',
  downloadReport: 'Download Report',

  // Timestamps
  generatedAt: 'Generated at',
  lastGenerated: 'Last generated',
};

export const settings: Translations = {
  // Section titles
  settings: 'Settings',
  preferences: 'Preferences',
  account: 'Account',
  security: 'Security',
  privacy: 'Privacy',
  notifications: 'Notifications',
  appearance: 'Appearance',
  language: 'Language',
  accessibility: 'Accessibility',

  // General
  general: 'General',
  defaultSettings: 'Default Settings',
  resetToDefaults: 'Reset to Defaults',

  // Theme
  theme: 'Theme',
  lightMode: 'Light Mode',
  darkMode: 'Dark Mode',
  systemDefault: 'System Default',

  // Language
  selectLanguage: 'Select Language',
  languageChanged: 'Language changed successfully',

  // Notifications
  enableNotifications: 'Enable Notifications',
  pushNotifications: 'Push Notifications',
  emailNotifications: 'Email Notifications',
  analysisComplete: 'Analysis Complete',
  reportReady: 'Report Ready',

  // Security
  biometricAuth: 'Biometric Authentication',
  faceId: 'Face ID',
  touchId: 'Touch ID',
  fingerprint: 'Fingerprint',
  passcode: 'Passcode',
  autoLock: 'Auto-Lock',

  // Data
  dataManagement: 'Data Management',
  clearCache: 'Clear Cache',
  exportData: 'Export Data',
  deleteAllData: 'Delete All Data',

  // About
  version: 'Version',
  buildNumber: 'Build Number',
  termsOfService: 'Terms of Service',
  privacyPolicy: 'Privacy Policy',
  licenses: 'Licenses',
};

export const errors: Translations = {
  // Generic
  genericError: 'An error occurred',
  unexpectedError: 'An unexpected error occurred',
  tryAgain: 'Please try again',
  contactSupport: 'Contact support if the problem persists',

  // Network
  networkError: 'Network error',
  connectionFailed: 'Connection failed',
  timeout: 'Request timed out',
  offline: 'You are offline',

  // File
  fileError: 'File error',
  fileNotFound: 'File not found',
  invalidFileFormat: 'Invalid file format',
  fileTooLarge: 'File is too large',
  fileReadError: 'Failed to read file',

  // Analysis
  analysisError: 'Analysis error',
  analysisFailed: 'Analysis failed',
  parsingFailed: 'Failed to parse genome data',
  invalidGenomeData: 'Invalid genome data',
  unsupportedFormat: 'Unsupported file format',

  // Authentication
  authError: 'Authentication error',
  unauthorized: 'Unauthorized',
  sessionExpired: 'Session expired',
  biometricFailed: 'Biometric authentication failed',

  // Validation
  validationError: 'Validation error',
  requiredField: 'This field is required',
  invalidEmail: 'Invalid email address',
  invalidFormat: 'Invalid format',
};

export const validation: Translations = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  minLength: 'Must be at least {{min}} characters',
  maxLength: 'Must be no more than {{max}} characters',
  pattern: 'Invalid format',
  numeric: 'Must be a number',
  integer: 'Must be a whole number',
  positive: 'Must be a positive number',
  min: 'Must be at least {{min}}',
  max: 'Must be no more than {{max}}',
  date: 'Please enter a valid date',
  url: 'Please enter a valid URL',
  rsid: 'Please enter a valid RS ID (e.g., rs1234567)',
  gene: 'Please enter a valid gene symbol',
};

/**
 * All English translations
 */
export const en = {
  common,
  clinical,
  drugs,
  traits,
  reports,
  settings,
  errors,
  validation,
};

export default en;
