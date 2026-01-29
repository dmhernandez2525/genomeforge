/**
 * Practitioner Mode Types
 *
 * Type definitions for HIPAA-compliant practitioner features.
 */

/**
 * Practitioner role levels
 */
export type PractitionerRole =
  | 'admin'
  | 'physician'
  | 'genetic_counselor'
  | 'nurse'
  | 'lab_technician'
  | 'researcher';

/**
 * Access level for data operations
 */
export type AccessLevel = 'read' | 'write' | 'delete' | 'admin';

/**
 * Practitioner profile
 */
export interface Practitioner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: PractitionerRole;
  npiNumber?: string; // National Provider Identifier
  licenseNumber?: string;
  organization: string;
  department?: string;
  specialties?: string[];
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

/**
 * Patient consent record
 */
export interface ConsentRecord {
  id: string;
  patientId: string;
  patientName: string;
  consentType: ConsentType;
  consentGiven: boolean;
  grantedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  witnessName?: string;
  practitionerId: string;
  notes?: string;
  documentHash?: string;
}

/**
 * Types of consent that can be granted
 */
export type ConsentType =
  | 'genetic_testing'
  | 'data_storage'
  | 'data_sharing'
  | 'research_participation'
  | 'third_party_disclosure'
  | 'family_sharing';

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  practitionerId: string;
  practitionerName: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  patientId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  success: boolean;
  errorMessage?: string;
}

/**
 * Actions that can be audited
 */
export type AuditAction =
  | 'login'
  | 'logout'
  | 'view_patient'
  | 'view_analysis'
  | 'create_report'
  | 'export_data'
  | 'modify_consent'
  | 'share_data'
  | 'delete_data'
  | 'change_settings'
  | 'session_timeout'
  | 'access_denied';

/**
 * Resource types for audit logging
 */
export type ResourceType =
  | 'session'
  | 'patient'
  | 'genome_data'
  | 'analysis'
  | 'report'
  | 'consent'
  | 'settings';

/**
 * Session configuration for practitioner mode
 */
export interface SessionConfig {
  maxIdleTimeMinutes: number;
  maxSessionDurationMinutes: number;
  requireReauthOnSensitiveOps: boolean;
  lockOnMinimize: boolean;
  warningBeforeTimeoutSeconds: number;
}

/**
 * Active session information
 */
export interface Session {
  id: string;
  practitionerId: string;
  startedAt: string;
  lastActivity: string;
  expiresAt: string;
  isActive: boolean;
  ipAddress?: string;
  deviceInfo?: string;
}

/**
 * Access control rule
 */
export interface AccessRule {
  role: PractitionerRole;
  resource: ResourceType;
  actions: AccessLevel[];
  conditions?: AccessCondition[];
}

/**
 * Conditions for access control
 */
export interface AccessCondition {
  type: 'patient_assigned' | 'consent_given' | 'time_range' | 'location';
  value?: string | boolean | { start: string; end: string };
}

/**
 * HIPAA compliance status
 */
export interface ComplianceStatus {
  isCompliant: boolean;
  lastAudit: string;
  issues: ComplianceIssue[];
  recommendations: string[];
}

/**
 * Compliance issue details
 */
export interface ComplianceIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  remediation: string;
  detectedAt: string;
  resolvedAt?: string;
}

/**
 * Practitioner mode settings
 */
export interface PractitionerModeSettings {
  enabled: boolean;
  sessionConfig: SessionConfig;
  auditRetentionDays: number;
  requireMFA: boolean;
  encryptAtRest: boolean;
  encryptInTransit: boolean;
  autoLogoutEnabled: boolean;
  watermarkEnabled: boolean;
  printingAllowed: boolean;
  exportAllowed: boolean;
  allowedExportFormats: string[];
}

/**
 * Patient summary for practitioner view
 */
export interface PatientSummary {
  id: string;
  mrn?: string; // Medical Record Number
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  hasGenomeData: boolean;
  hasAnalysis: boolean;
  lastVisit?: string;
  consentStatus: {
    geneticTesting: boolean;
    dataStorage: boolean;
    dataSharing: boolean;
  };
  assignedPractitioners: string[];
}
