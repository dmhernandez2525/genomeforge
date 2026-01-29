/**
 * Spanish (es) Translations
 */

import type { Translations } from '../types';

export const common: Translations = {
  // App
  appName: 'GenomeForge',
  tagline: 'Análisis Genético con Privacidad Primero',

  // Navigation
  home: 'Inicio',
  upload: 'Subir',
  analysis: 'Análisis',
  reports: 'Informes',
  settings: 'Configuración',
  help: 'Ayuda',
  about: 'Acerca de',

  // Actions
  save: 'Guardar',
  cancel: 'Cancelar',
  delete: 'Eliminar',
  edit: 'Editar',
  create: 'Crear',
  update: 'Actualizar',
  close: 'Cerrar',
  confirm: 'Confirmar',
  back: 'Atrás',
  next: 'Siguiente',
  previous: 'Anterior',
  submit: 'Enviar',
  reset: 'Restablecer',
  clear: 'Limpiar',
  search: 'Buscar',
  filter: 'Filtrar',
  sort: 'Ordenar',
  export: 'Exportar',
  import: 'Importar',
  download: 'Descargar',
  refresh: 'Actualizar',
  retry: 'Reintentar',
  loading: 'Cargando...',
  processing: 'Procesando...',

  // Status
  status: 'Estado',
  pending: 'Pendiente',
  inProgress: 'En Progreso',
  complete: 'Completo',
  completed: 'Completado',
  failed: 'Fallido',
  cancelled: 'Cancelado',
  active: 'Activo',
  inactive: 'Inactivo',
  enabled: 'Habilitado',
  disabled: 'Deshabilitado',

  // Time
  now: 'Ahora',
  today: 'Hoy',
  yesterday: 'Ayer',
  tomorrow: 'Mañana',
  thisWeek: 'Esta Semana',
  lastWeek: 'Semana Pasada',
  thisMonth: 'Este Mes',
  lastMonth: 'Mes Pasado',

  // Results
  results: 'Resultados',
  noResults: 'No se encontraron resultados',
  showingResults: 'Mostrando {{count}} resultados',
  of: 'de',
  page: 'Página',
  perPage: 'Por página',

  // Confirmation
  areYouSure: '¿Está seguro?',
  thisActionCannotBeUndone: 'Esta acción no se puede deshacer.',
  yes: 'Sí',
  no: 'No',

  // Success/Error
  success: 'Éxito',
  error: 'Error',
  warning: 'Advertencia',
  info: 'Información',

  // Privacy
  privacy: 'Privacidad',
  privacyFirst: 'Privacidad Primero',
  dataPrivacy: 'Sus datos genéticos nunca salen de su dispositivo',
  localProcessing: 'Todo el procesamiento ocurre localmente',
};

export const clinical: Translations = {
  // Section titles
  clinicalFindings: 'Hallazgos Clínicos',
  variantAnalysis: 'Análisis de Variantes',
  geneticRisks: 'Riesgos Genéticos',
  healthInsights: 'Información de Salud',

  // Significance levels
  significance: 'Significancia',
  pathogenic: 'Patogénico',
  likelyPathogenic: 'Probablemente Patogénico',
  uncertainSignificance: 'Significancia Incierta',
  likelyBenign: 'Probablemente Benigno',
  benign: 'Benigno',
  riskFactor: 'Factor de Riesgo',
  protective: 'Protector',
  drugResponse: 'Respuesta a Medicamentos',

  // Risk levels
  riskLevel: 'Nivel de Riesgo',
  highRisk: 'Alto Riesgo',
  moderateRisk: 'Riesgo Moderado',
  lowRisk: 'Bajo Riesgo',
  minimalRisk: 'Riesgo Mínimo',
  protectiveEffect: 'Efecto Protector',

  // Evidence levels
  evidenceLevel: 'Nivel de Evidencia',
  strongEvidence: 'Evidencia Fuerte',
  moderateEvidence: 'Evidencia Moderada',
  limitedEvidence: 'Evidencia Limitada',
  conflictingEvidence: 'Evidencia Contradictoria',
  expertOpinion: 'Opinión de Expertos',

  // Genetics
  variant: 'Variante',
  variants: 'Variantes',
  gene: 'Gen',
  genes: 'Genes',
  genotype: 'Genotipo',
  chromosome: 'Cromosoma',
  position: 'Posición',
  allele: 'Alelo',
  referenceAllele: 'Alelo de Referencia',
  alternateAllele: 'Alelo Alternativo',
  rsid: 'RS ID',

  // Conditions
  condition: 'Condición',
  conditions: 'Condiciones',
  inheritance: 'Herencia',
  autosomalDominant: 'Autosómico Dominante',
  autosomalRecessive: 'Autosómico Recesivo',
  xLinked: 'Ligado al X',
  mitochondrial: 'Mitocondrial',

  // Actions
  viewDetails: 'Ver Detalles',
  learnMore: 'Más Información',
  consultDoctor: 'Consulte a un Profesional de la Salud',

  // Counts
  findingsCount: {
    one: '{{count}} hallazgo',
    other: '{{count}} hallazgos',
  },
  variantsAnalyzed: {
    one: '{{count}} variante analizada',
    other: '{{count}} variantes analizadas',
  },
};

export const drugs: Translations = {
  // Section titles
  drugResponses: 'Respuestas a Medicamentos',
  pharmacogenomics: 'Farmacogenómica',
  medicationInsights: 'Información sobre Medicamentos',

  // Metabolizer phenotypes
  phenotype: 'Fenotipo',
  poorMetabolizer: 'Metabolizador Lento',
  intermediateMetabolizer: 'Metabolizador Intermedio',
  normalMetabolizer: 'Metabolizador Normal',
  rapidMetabolizer: 'Metabolizador Rápido',
  ultrarapidMetabolizer: 'Metabolizador Ultrarrápido',
  indeterminate: 'Indeterminado',

  // Drug info
  drug: 'Medicamento',
  drugs: 'Medicamentos',
  drugName: 'Nombre del Medicamento',
  drugClass: 'Clase de Medicamento',
  recommendation: 'Recomendación',
  dosingGuidance: 'Guía de Dosificación',
  clinicalAction: 'Acción Clínica',

  // Warnings
  adjustDosage: 'Puede ser necesario ajustar la dosis',
  alternativeRecommended: 'Se recomienda medicamento alternativo',
  standardDosing: 'Se espera dosificación estándar',
  increasedSensitivity: 'Posible aumento de sensibilidad',
  decreasedEfficacy: 'Posible disminución de eficacia',

  // Guidelines
  guideline: 'Guía',
  guidelineSource: 'Fuente de la Guía',
  cpic: 'CPIC',
  dpwg: 'DPWG',

  // Counts
  responsesCount: {
    one: '{{count}} respuesta a medicamento',
    other: '{{count}} respuestas a medicamentos',
  },
};

export const traits: Translations = {
  // Section titles
  traitAssociations: 'Asociaciones de Rasgos',
  geneticTraits: 'Rasgos Genéticos',
  yourTraits: 'Sus Rasgos',

  // Categories
  category: 'Categoría',
  physical: 'Físico',
  metabolic: 'Metabólico',
  cognitive: 'Cognitivo',
  behavioral: 'Conductual',
  nutritional: 'Nutricional',
  athletic: 'Atlético',
  longevity: 'Longevidad',
  other: 'Otro',

  // Effect
  effect: 'Efecto',
  effectDirection: 'Dirección del Efecto',
  increased: 'Aumentado',
  decreased: 'Disminuido',
  associated: 'Asociado',
  unknown: 'Desconocido',

  // Confidence
  confidence: 'Confianza',
  highConfidence: 'Alta Confianza',
  moderateConfidence: 'Confianza Moderada',
  lowConfidence: 'Baja Confianza',

  // Ancestry
  ancestry: 'Ascendencia',
  ancestryComposition: 'Composición de Ascendencia',
  population: 'Población',
  maternalHaplogroup: 'Haplogrupo Materno',
  paternalHaplogroup: 'Haplogrupo Paterno',
  neanderthal: 'Ascendencia Neandertal',

  // Counts
  traitsCount: {
    one: '{{count}} rasgo',
    other: '{{count}} rasgos',
  },
};

export const reports: Translations = {
  // Section titles
  reports: 'Informes',
  generateReport: 'Generar Informe',
  reportHistory: 'Historial de Informes',

  // Report types
  reportType: 'Tipo de Informe',
  clinicalReport: 'Informe Clínico',
  personalReport: 'Informe Personal',
  researchReport: 'Informe de Investigación',
  summaryReport: 'Informe Resumido',
  detailedReport: 'Informe Detallado',

  // Sections
  executiveSummary: 'Resumen Ejecutivo',
  methodology: 'Metodología',
  limitations: 'Limitaciones',
  recommendations: 'Recomendaciones',
  references: 'Referencias',
  appendix: 'Apéndice',

  // Export
  exportFormat: 'Formato de Exportación',
  pdf: 'PDF',
  html: 'HTML',
  json: 'JSON',
  markdown: 'Markdown',

  // Status
  generating: 'Generando informe...',
  reportReady: 'El informe está listo',
  downloadReport: 'Descargar Informe',

  // Timestamps
  generatedAt: 'Generado el',
  lastGenerated: 'Última generación',
};

export const settings: Translations = {
  // Section titles
  settings: 'Configuración',
  preferences: 'Preferencias',
  account: 'Cuenta',
  security: 'Seguridad',
  privacy: 'Privacidad',
  notifications: 'Notificaciones',
  appearance: 'Apariencia',
  language: 'Idioma',
  accessibility: 'Accesibilidad',

  // General
  general: 'General',
  defaultSettings: 'Configuración Predeterminada',
  resetToDefaults: 'Restablecer Valores Predeterminados',

  // Theme
  theme: 'Tema',
  lightMode: 'Modo Claro',
  darkMode: 'Modo Oscuro',
  systemDefault: 'Predeterminado del Sistema',

  // Language
  selectLanguage: 'Seleccionar Idioma',
  languageChanged: 'Idioma cambiado exitosamente',

  // Notifications
  enableNotifications: 'Habilitar Notificaciones',
  pushNotifications: 'Notificaciones Push',
  emailNotifications: 'Notificaciones por Email',
  analysisComplete: 'Análisis Completo',
  reportReady: 'Informe Listo',

  // Security
  biometricAuth: 'Autenticación Biométrica',
  faceId: 'Face ID',
  touchId: 'Touch ID',
  fingerprint: 'Huella Digital',
  passcode: 'Código de Acceso',
  autoLock: 'Bloqueo Automático',

  // Data
  dataManagement: 'Gestión de Datos',
  clearCache: 'Limpiar Caché',
  exportData: 'Exportar Datos',
  deleteAllData: 'Eliminar Todos los Datos',

  // About
  version: 'Versión',
  buildNumber: 'Número de Compilación',
  termsOfService: 'Términos de Servicio',
  privacyPolicy: 'Política de Privacidad',
  licenses: 'Licencias',
};

export const errors: Translations = {
  // Generic
  genericError: 'Ocurrió un error',
  unexpectedError: 'Ocurrió un error inesperado',
  tryAgain: 'Por favor, inténtelo de nuevo',
  contactSupport: 'Contacte a soporte si el problema persiste',

  // Network
  networkError: 'Error de red',
  connectionFailed: 'Conexión fallida',
  timeout: 'La solicitud expiró',
  offline: 'Está desconectado',

  // File
  fileError: 'Error de archivo',
  fileNotFound: 'Archivo no encontrado',
  invalidFileFormat: 'Formato de archivo inválido',
  fileTooLarge: 'El archivo es demasiado grande',
  fileReadError: 'Error al leer el archivo',

  // Analysis
  analysisError: 'Error de análisis',
  analysisFailed: 'El análisis falló',
  parsingFailed: 'Error al analizar los datos genómicos',
  invalidGenomeData: 'Datos genómicos inválidos',
  unsupportedFormat: 'Formato de archivo no soportado',

  // Authentication
  authError: 'Error de autenticación',
  unauthorized: 'No autorizado',
  sessionExpired: 'Sesión expirada',
  biometricFailed: 'La autenticación biométrica falló',

  // Validation
  validationError: 'Error de validación',
  requiredField: 'Este campo es obligatorio',
  invalidEmail: 'Dirección de email inválida',
  invalidFormat: 'Formato inválido',
};

export const validation: Translations = {
  required: 'Este campo es obligatorio',
  email: 'Por favor, ingrese una dirección de email válida',
  minLength: 'Debe tener al menos {{min}} caracteres',
  maxLength: 'No debe tener más de {{max}} caracteres',
  pattern: 'Formato inválido',
  numeric: 'Debe ser un número',
  integer: 'Debe ser un número entero',
  positive: 'Debe ser un número positivo',
  min: 'Debe ser al menos {{min}}',
  max: 'No debe ser más de {{max}}',
  date: 'Por favor, ingrese una fecha válida',
  url: 'Por favor, ingrese una URL válida',
  rsid: 'Por favor, ingrese un RS ID válido (ej., rs1234567)',
  gene: 'Por favor, ingrese un símbolo de gen válido',
};

/**
 * All Spanish translations
 */
export const es = {
  common,
  clinical,
  drugs,
  traits,
  reports,
  settings,
  errors,
  validation,
};

export default es;
