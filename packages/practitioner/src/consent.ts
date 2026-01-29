/**
 * Consent Management Module
 *
 * HIPAA-compliant patient consent tracking and management.
 */

import type { ConsentRecord, ConsentType, Practitioner } from './types';
import { getAuditLogger } from './audit';

/**
 * Generate a unique consent ID
 */
function generateConsentId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `consent_${timestamp}_${random}`;
}

/**
 * Consent storage interface
 */
export interface ConsentStorage {
  save(consent: ConsentRecord): Promise<void>;
  get(id: string): Promise<ConsentRecord | null>;
  getByPatient(patientId: string): Promise<ConsentRecord[]>;
  getByType(patientId: string, type: ConsentType): Promise<ConsentRecord | null>;
  update(id: string, updates: Partial<ConsentRecord>): Promise<ConsentRecord | null>;
  delete(id: string): Promise<boolean>;
}

/**
 * In-memory consent storage (for development/testing)
 */
export class InMemoryConsentStorage implements ConsentStorage {
  private consents: Map<string, ConsentRecord> = new Map();

  async save(consent: ConsentRecord): Promise<void> {
    this.consents.set(consent.id, consent);
  }

  async get(id: string): Promise<ConsentRecord | null> {
    return this.consents.get(id) || null;
  }

  async getByPatient(patientId: string): Promise<ConsentRecord[]> {
    return Array.from(this.consents.values()).filter(
      (c) => c.patientId === patientId
    );
  }

  async getByType(patientId: string, type: ConsentType): Promise<ConsentRecord | null> {
    const consents = await this.getByPatient(patientId);
    return consents.find((c) => c.consentType === type && !c.revokedAt) || null;
  }

  async update(id: string, updates: Partial<ConsentRecord>): Promise<ConsentRecord | null> {
    const existing = this.consents.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates };
    this.consents.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.consents.delete(id);
  }
}

/**
 * Consent description templates
 */
export const CONSENT_DESCRIPTIONS: Record<ConsentType, { title: string; description: string }> = {
  genetic_testing: {
    title: 'Genetic Testing Consent',
    description:
      'I consent to have my genetic material analyzed for the purposes discussed with my healthcare provider.',
  },
  data_storage: {
    title: 'Data Storage Consent',
    description:
      'I consent to have my genetic data stored securely for the purposes of my ongoing care.',
  },
  data_sharing: {
    title: 'Data Sharing Consent',
    description:
      'I consent to have my genetic data shared with other healthcare providers involved in my care.',
  },
  research_participation: {
    title: 'Research Participation Consent',
    description:
      'I consent to have my de-identified genetic data used for research purposes.',
  },
  third_party_disclosure: {
    title: 'Third-Party Disclosure Consent',
    description:
      'I consent to the disclosure of my genetic information to specified third parties.',
  },
  family_sharing: {
    title: 'Family Sharing Consent',
    description:
      'I consent to share relevant genetic findings with specified family members.',
  },
};

/**
 * Consent manager class
 */
export class ConsentManager {
  private storage: ConsentStorage;

  constructor(storage?: ConsentStorage) {
    this.storage = storage || new InMemoryConsentStorage();
  }

  /**
   * Create a new consent record
   */
  async createConsent(
    patientId: string,
    patientName: string,
    consentType: ConsentType,
    practitioner: Practitioner,
    options: {
      witnessName?: string;
      notes?: string;
      expiresAt?: string;
      documentHash?: string;
    } = {}
  ): Promise<ConsentRecord> {
    const consent: ConsentRecord = {
      id: generateConsentId(),
      patientId,
      patientName,
      consentType,
      consentGiven: true,
      grantedAt: new Date().toISOString(),
      expiresAt: options.expiresAt,
      witnessName: options.witnessName,
      practitionerId: practitioner.id,
      notes: options.notes,
      documentHash: options.documentHash,
    };

    await this.storage.save(consent);

    // Log the consent creation
    const auditLogger = getAuditLogger();
    await auditLogger.logConsentModification(patientId, consent.id, 'grant');

    return consent;
  }

  /**
   * Revoke a consent
   */
  async revokeConsent(
    consentId: string,
    reason?: string
  ): Promise<ConsentRecord | null> {
    const consent = await this.storage.get(consentId);
    if (!consent) return null;

    const updated = await this.storage.update(consentId, {
      revokedAt: new Date().toISOString(),
      notes: reason ? `${consent.notes || ''}\nRevoked: ${reason}` : consent.notes,
    });

    if (updated) {
      const auditLogger = getAuditLogger();
      await auditLogger.logConsentModification(consent.patientId, consentId, 'revoke');
    }

    return updated;
  }

  /**
   * Check if a patient has given consent for a specific type
   */
  async hasConsent(patientId: string, consentType: ConsentType): Promise<boolean> {
    const consent = await this.storage.getByType(patientId, consentType);
    if (!consent) return false;

    // Check if consent is revoked
    if (consent.revokedAt) return false;

    // Check if consent has expired
    if (consent.expiresAt && new Date(consent.expiresAt) < new Date()) {
      return false;
    }

    return consent.consentGiven;
  }

  /**
   * Get all consents for a patient
   */
  async getPatientConsents(patientId: string): Promise<ConsentRecord[]> {
    return this.storage.getByPatient(patientId);
  }

  /**
   * Get active consents for a patient
   */
  async getActiveConsents(patientId: string): Promise<ConsentRecord[]> {
    const consents = await this.storage.getByPatient(patientId);
    const now = new Date();

    return consents.filter((c) => {
      if (c.revokedAt) return false;
      if (c.expiresAt && new Date(c.expiresAt) < now) return false;
      return c.consentGiven;
    });
  }

  /**
   * Get consent status summary for a patient
   */
  async getConsentStatus(patientId: string): Promise<Record<ConsentType, boolean>> {
    const consentTypes: ConsentType[] = [
      'genetic_testing',
      'data_storage',
      'data_sharing',
      'research_participation',
      'third_party_disclosure',
      'family_sharing',
    ];

    const status: Record<ConsentType, boolean> = {} as Record<ConsentType, boolean>;

    for (const type of consentTypes) {
      status[type] = await this.hasConsent(patientId, type);
    }

    return status;
  }

  /**
   * Get a specific consent record
   */
  async getConsent(consentId: string): Promise<ConsentRecord | null> {
    return this.storage.get(consentId);
  }

  /**
   * Update consent notes
   */
  async updateConsentNotes(
    consentId: string,
    notes: string
  ): Promise<ConsentRecord | null> {
    const consent = await this.storage.get(consentId);
    if (!consent) return null;

    const updated = await this.storage.update(consentId, { notes });

    if (updated) {
      const auditLogger = getAuditLogger();
      await auditLogger.logConsentModification(consent.patientId, consentId, 'update');
    }

    return updated;
  }

  /**
   * Validate that all required consents are in place for an operation
   */
  async validateRequiredConsents(
    patientId: string,
    requiredTypes: ConsentType[]
  ): Promise<{ valid: boolean; missing: ConsentType[] }> {
    const missing: ConsentType[] = [];

    for (const type of requiredTypes) {
      const hasConsent = await this.hasConsent(patientId, type);
      if (!hasConsent) {
        missing.push(type);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Get the storage interface for custom operations
   */
  getStorage(): ConsentStorage {
    return this.storage;
  }
}

/**
 * Create a singleton consent manager instance
 */
let defaultConsentManager: ConsentManager | null = null;

export function getConsentManager(): ConsentManager {
  if (!defaultConsentManager) {
    defaultConsentManager = new ConsentManager();
  }
  return defaultConsentManager;
}

export function setConsentManager(manager: ConsentManager): void {
  defaultConsentManager = manager;
}
