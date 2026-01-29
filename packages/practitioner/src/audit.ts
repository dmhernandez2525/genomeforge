/**
 * Audit Logging Module
 *
 * HIPAA-compliant audit logging for all practitioner actions.
 */

import type {
  AuditLogEntry,
  AuditAction,
  ResourceType,
  Practitioner,
} from './types';

/**
 * Generate a unique audit log ID
 */
function generateAuditId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `audit_${timestamp}_${random}`;
}

/**
 * Audit log storage interface
 */
export interface AuditLogStorage {
  save(entry: AuditLogEntry): Promise<void>;
  getByPractitioner(practitionerId: string, limit?: number): Promise<AuditLogEntry[]>;
  getByPatient(patientId: string, limit?: number): Promise<AuditLogEntry[]>;
  getByDateRange(start: Date, end: Date): Promise<AuditLogEntry[]>;
  getAll(limit?: number): Promise<AuditLogEntry[]>;
  purgeOlderThan(days: number): Promise<number>;
}

/**
 * In-memory audit log storage (for development/testing)
 */
export class InMemoryAuditStorage implements AuditLogStorage {
  private logs: AuditLogEntry[] = [];
  private maxEntries: number;

  constructor(maxEntries: number = 10000) {
    this.maxEntries = maxEntries;
  }

  async save(entry: AuditLogEntry): Promise<void> {
    this.logs.unshift(entry);
    if (this.logs.length > this.maxEntries) {
      this.logs = this.logs.slice(0, this.maxEntries);
    }
  }

  async getByPractitioner(practitionerId: string, limit: number = 100): Promise<AuditLogEntry[]> {
    return this.logs
      .filter((log) => log.practitionerId === practitionerId)
      .slice(0, limit);
  }

  async getByPatient(patientId: string, limit: number = 100): Promise<AuditLogEntry[]> {
    return this.logs
      .filter((log) => log.patientId === patientId)
      .slice(0, limit);
  }

  async getByDateRange(start: Date, end: Date): Promise<AuditLogEntry[]> {
    return this.logs.filter((log) => {
      const logDate = new Date(log.timestamp);
      return logDate >= start && logDate <= end;
    });
  }

  async getAll(limit: number = 100): Promise<AuditLogEntry[]> {
    return this.logs.slice(0, limit);
  }

  async purgeOlderThan(days: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const initialLength = this.logs.length;
    this.logs = this.logs.filter((log) => new Date(log.timestamp) >= cutoff);
    return initialLength - this.logs.length;
  }
}

/**
 * Audit logger class
 */
export class AuditLogger {
  private storage: AuditLogStorage;
  private currentPractitioner: Practitioner | null = null;
  private deviceInfo?: string;
  private ipAddress?: string;

  constructor(storage?: AuditLogStorage) {
    this.storage = storage || new InMemoryAuditStorage();
  }

  /**
   * Set the current practitioner for audit logs
   */
  setPractitioner(practitioner: Practitioner | null): void {
    this.currentPractitioner = practitioner;
  }

  /**
   * Set device information for audit logs
   */
  setDeviceInfo(info: string): void {
    this.deviceInfo = info;
  }

  /**
   * Set IP address for audit logs
   */
  setIpAddress(ip: string): void {
    this.ipAddress = ip;
  }

  /**
   * Log an action
   */
  async log(
    action: AuditAction,
    resourceType: ResourceType,
    options: {
      resourceId?: string;
      patientId?: string;
      details?: Record<string, unknown>;
      success?: boolean;
      errorMessage?: string;
    } = {}
  ): Promise<AuditLogEntry> {
    if (!this.currentPractitioner) {
      throw new Error('No practitioner set for audit logging');
    }

    const entry: AuditLogEntry = {
      id: generateAuditId(),
      timestamp: new Date().toISOString(),
      practitionerId: this.currentPractitioner.id,
      practitionerName: `${this.currentPractitioner.firstName} ${this.currentPractitioner.lastName}`,
      action,
      resourceType,
      resourceId: options.resourceId,
      patientId: options.patientId,
      ipAddress: this.ipAddress,
      userAgent: this.deviceInfo,
      details: options.details,
      success: options.success ?? true,
      errorMessage: options.errorMessage,
    };

    await this.storage.save(entry);
    return entry;
  }

  /**
   * Log a successful login
   */
  async logLogin(practitioner: Practitioner): Promise<AuditLogEntry> {
    this.setPractitioner(practitioner);
    return this.log('login', 'session', { success: true });
  }

  /**
   * Log a logout
   */
  async logLogout(): Promise<AuditLogEntry> {
    return this.log('logout', 'session', { success: true });
  }

  /**
   * Log a session timeout
   */
  async logSessionTimeout(): Promise<AuditLogEntry> {
    return this.log('session_timeout', 'session', { success: true });
  }

  /**
   * Log an access denied event
   */
  async logAccessDenied(
    resourceType: ResourceType,
    resourceId?: string,
    reason?: string
  ): Promise<AuditLogEntry> {
    return this.log('access_denied', resourceType, {
      resourceId,
      success: false,
      errorMessage: reason || 'Access denied',
    });
  }

  /**
   * Log viewing patient data
   */
  async logViewPatient(patientId: string, details?: Record<string, unknown>): Promise<AuditLogEntry> {
    return this.log('view_patient', 'patient', { patientId, details });
  }

  /**
   * Log viewing analysis results
   */
  async logViewAnalysis(patientId: string, analysisId: string): Promise<AuditLogEntry> {
    return this.log('view_analysis', 'analysis', {
      resourceId: analysisId,
      patientId,
    });
  }

  /**
   * Log report creation
   */
  async logCreateReport(
    patientId: string,
    reportId: string,
    reportType: string
  ): Promise<AuditLogEntry> {
    return this.log('create_report', 'report', {
      resourceId: reportId,
      patientId,
      details: { reportType },
    });
  }

  /**
   * Log data export
   */
  async logExportData(
    patientId: string,
    format: string,
    dataTypes: string[]
  ): Promise<AuditLogEntry> {
    return this.log('export_data', 'genome_data', {
      patientId,
      details: { format, dataTypes },
    });
  }

  /**
   * Log consent modification
   */
  async logConsentModification(
    patientId: string,
    consentId: string,
    action: 'grant' | 'revoke' | 'update'
  ): Promise<AuditLogEntry> {
    return this.log('modify_consent', 'consent', {
      resourceId: consentId,
      patientId,
      details: { action },
    });
  }

  /**
   * Get audit logs for current practitioner
   */
  async getMyLogs(limit?: number): Promise<AuditLogEntry[]> {
    if (!this.currentPractitioner) {
      return [];
    }
    return this.storage.getByPractitioner(this.currentPractitioner.id, limit);
  }

  /**
   * Get audit logs for a patient
   */
  async getPatientLogs(patientId: string, limit?: number): Promise<AuditLogEntry[]> {
    return this.storage.getByPatient(patientId, limit);
  }

  /**
   * Get all audit logs (admin only)
   */
  async getAllLogs(limit?: number): Promise<AuditLogEntry[]> {
    return this.storage.getAll(limit);
  }

  /**
   * Purge old audit logs (admin only)
   */
  async purgeLogs(retentionDays: number): Promise<number> {
    return this.storage.purgeOlderThan(retentionDays);
  }

  /**
   * Get the storage interface for custom operations
   */
  getStorage(): AuditLogStorage {
    return this.storage;
  }
}

/**
 * Create a singleton audit logger instance
 */
let defaultAuditLogger: AuditLogger | null = null;

export function getAuditLogger(): AuditLogger {
  if (!defaultAuditLogger) {
    defaultAuditLogger = new AuditLogger();
  }
  return defaultAuditLogger;
}

export function setAuditLogger(logger: AuditLogger): void {
  defaultAuditLogger = logger;
}
