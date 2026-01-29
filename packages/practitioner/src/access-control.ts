/**
 * Access Control Module
 *
 * Role-based access control for practitioner mode.
 */

import type {
  Practitioner,
  PractitionerRole,
  AccessLevel,
  AccessRule,
  ResourceType,
} from './types';
import { getAuditLogger } from './audit';

/**
 * Default access rules based on HIPAA minimum necessary standard
 */
export const DEFAULT_ACCESS_RULES: AccessRule[] = [
  // Admin has full access
  { role: 'admin', resource: 'session', actions: ['read', 'write', 'delete', 'admin'] },
  { role: 'admin', resource: 'patient', actions: ['read', 'write', 'delete', 'admin'] },
  { role: 'admin', resource: 'genome_data', actions: ['read', 'write', 'delete', 'admin'] },
  { role: 'admin', resource: 'analysis', actions: ['read', 'write', 'delete', 'admin'] },
  { role: 'admin', resource: 'report', actions: ['read', 'write', 'delete', 'admin'] },
  { role: 'admin', resource: 'consent', actions: ['read', 'write', 'delete', 'admin'] },
  { role: 'admin', resource: 'settings', actions: ['read', 'write', 'delete', 'admin'] },

  // Physician access
  { role: 'physician', resource: 'session', actions: ['read'] },
  {
    role: 'physician',
    resource: 'patient',
    actions: ['read', 'write'],
    conditions: [{ type: 'patient_assigned' }],
  },
  {
    role: 'physician',
    resource: 'genome_data',
    actions: ['read'],
    conditions: [{ type: 'patient_assigned' }, { type: 'consent_given' }],
  },
  {
    role: 'physician',
    resource: 'analysis',
    actions: ['read', 'write'],
    conditions: [{ type: 'patient_assigned' }],
  },
  {
    role: 'physician',
    resource: 'report',
    actions: ['read', 'write'],
    conditions: [{ type: 'patient_assigned' }],
  },
  {
    role: 'physician',
    resource: 'consent',
    actions: ['read', 'write'],
    conditions: [{ type: 'patient_assigned' }],
  },
  { role: 'physician', resource: 'settings', actions: ['read'] },

  // Genetic counselor access
  { role: 'genetic_counselor', resource: 'session', actions: ['read'] },
  {
    role: 'genetic_counselor',
    resource: 'patient',
    actions: ['read', 'write'],
    conditions: [{ type: 'patient_assigned' }],
  },
  {
    role: 'genetic_counselor',
    resource: 'genome_data',
    actions: ['read'],
    conditions: [{ type: 'patient_assigned' }, { type: 'consent_given' }],
  },
  {
    role: 'genetic_counselor',
    resource: 'analysis',
    actions: ['read', 'write'],
    conditions: [{ type: 'patient_assigned' }],
  },
  {
    role: 'genetic_counselor',
    resource: 'report',
    actions: ['read', 'write'],
    conditions: [{ type: 'patient_assigned' }],
  },
  {
    role: 'genetic_counselor',
    resource: 'consent',
    actions: ['read', 'write'],
    conditions: [{ type: 'patient_assigned' }],
  },
  { role: 'genetic_counselor', resource: 'settings', actions: ['read'] },

  // Nurse access
  { role: 'nurse', resource: 'session', actions: ['read'] },
  {
    role: 'nurse',
    resource: 'patient',
    actions: ['read'],
    conditions: [{ type: 'patient_assigned' }],
  },
  {
    role: 'nurse',
    resource: 'analysis',
    actions: ['read'],
    conditions: [{ type: 'patient_assigned' }],
  },
  {
    role: 'nurse',
    resource: 'report',
    actions: ['read'],
    conditions: [{ type: 'patient_assigned' }],
  },
  { role: 'nurse', resource: 'settings', actions: ['read'] },

  // Lab technician access
  { role: 'lab_technician', resource: 'session', actions: ['read'] },
  {
    role: 'lab_technician',
    resource: 'genome_data',
    actions: ['read', 'write'],
    conditions: [{ type: 'consent_given' }],
  },
  { role: 'lab_technician', resource: 'analysis', actions: ['read', 'write'] },
  { role: 'lab_technician', resource: 'settings', actions: ['read'] },

  // Researcher access (limited, anonymized)
  { role: 'researcher', resource: 'session', actions: ['read'] },
  {
    role: 'researcher',
    resource: 'genome_data',
    actions: ['read'],
    conditions: [{ type: 'consent_given' }],
  },
  {
    role: 'researcher',
    resource: 'analysis',
    actions: ['read'],
    conditions: [{ type: 'consent_given' }],
  },
  { role: 'researcher', resource: 'settings', actions: ['read'] },
];

/**
 * Access control context for checking conditions
 */
export interface AccessContext {
  practitionerId: string;
  patientId?: string;
  assignedPatients?: string[];
  patientConsent?: {
    geneticTesting: boolean;
    dataStorage: boolean;
    dataSharing: boolean;
    researchParticipation: boolean;
  };
}

/**
 * Access check result
 */
export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
  conditions?: string[];
}

/**
 * Access control manager
 */
export class AccessControl {
  private rules: AccessRule[];

  constructor(rules: AccessRule[] = DEFAULT_ACCESS_RULES) {
    this.rules = rules;
  }

  /**
   * Check if a practitioner can perform an action on a resource
   */
  checkAccess(
    practitioner: Practitioner,
    resource: ResourceType,
    action: AccessLevel,
    context: AccessContext
  ): AccessCheckResult {
    // Find applicable rules
    const applicableRules = this.rules.filter(
      (rule) => rule.role === practitioner.role && rule.resource === resource
    );

    if (applicableRules.length === 0) {
      return {
        allowed: false,
        reason: `No access rules defined for ${practitioner.role} on ${resource}`,
      };
    }

    // Check each rule
    for (const rule of applicableRules) {
      if (!rule.actions.includes(action)) {
        continue;
      }

      // Check conditions
      if (rule.conditions && rule.conditions.length > 0) {
        const conditionResults = this.checkConditions(rule.conditions, context);
        if (conditionResults.passed) {
          return { allowed: true, conditions: conditionResults.metConditions };
        }
      } else {
        // No conditions, access granted
        return { allowed: true };
      }
    }

    return {
      allowed: false,
      reason: `Action '${action}' not allowed for ${practitioner.role} on ${resource}`,
    };
  }

  /**
   * Check conditions for a rule
   */
  private checkConditions(
    conditions: AccessRule['conditions'],
    context: AccessContext
  ): { passed: boolean; metConditions: string[] } {
    if (!conditions || conditions.length === 0) {
      return { passed: true, metConditions: [] };
    }

    const metConditions: string[] = [];

    for (const condition of conditions) {
      switch (condition.type) {
        case 'patient_assigned':
          if (
            context.patientId &&
            context.assignedPatients &&
            context.assignedPatients.includes(context.patientId)
          ) {
            metConditions.push('patient_assigned');
          } else if (condition.type === 'patient_assigned') {
            return { passed: false, metConditions };
          }
          break;

        case 'consent_given':
          if (context.patientConsent) {
            const hasConsent =
              context.patientConsent.geneticTesting ||
              context.patientConsent.dataStorage ||
              context.patientConsent.dataSharing;
            if (hasConsent) {
              metConditions.push('consent_given');
            } else {
              return { passed: false, metConditions };
            }
          } else {
            return { passed: false, metConditions };
          }
          break;

        case 'time_range':
          if (condition.value && typeof condition.value === 'object') {
            const now = new Date();
            const start = new Date((condition.value as { start: string }).start);
            const end = new Date((condition.value as { end: string }).end);
            if (now >= start && now <= end) {
              metConditions.push('time_range');
            } else {
              return { passed: false, metConditions };
            }
          }
          break;
      }
    }

    return { passed: true, metConditions };
  }

  /**
   * Check access and log the attempt
   */
  async checkAccessWithAudit(
    practitioner: Practitioner,
    resource: ResourceType,
    action: AccessLevel,
    context: AccessContext,
    resourceId?: string
  ): Promise<AccessCheckResult> {
    const result = this.checkAccess(practitioner, resource, action, context);
    const auditLogger = getAuditLogger();

    if (!result.allowed) {
      await auditLogger.logAccessDenied(resource, resourceId, result.reason);
    }

    return result;
  }

  /**
   * Get all actions allowed for a role on a resource
   */
  getAllowedActions(role: PractitionerRole, resource: ResourceType): AccessLevel[] {
    const actions = new Set<AccessLevel>();

    for (const rule of this.rules) {
      if (rule.role === role && rule.resource === resource) {
        for (const action of rule.actions) {
          actions.add(action);
        }
      }
    }

    return Array.from(actions);
  }

  /**
   * Get all resources accessible by a role
   */
  getAccessibleResources(role: PractitionerRole): ResourceType[] {
    const resources = new Set<ResourceType>();

    for (const rule of this.rules) {
      if (rule.role === role) {
        resources.add(rule.resource);
      }
    }

    return Array.from(resources);
  }

  /**
   * Add a custom access rule
   */
  addRule(rule: AccessRule): void {
    this.rules.push(rule);
  }

  /**
   * Remove rules by role and resource
   */
  removeRules(role: PractitionerRole, resource: ResourceType): void {
    this.rules = this.rules.filter(
      (r) => !(r.role === role && r.resource === resource)
    );
  }

  /**
   * Get all rules
   */
  getRules(): AccessRule[] {
    return [...this.rules];
  }

  /**
   * Reset to default rules
   */
  resetToDefault(): void {
    this.rules = [...DEFAULT_ACCESS_RULES];
  }
}

/**
 * Create a singleton access control instance
 */
let defaultAccessControl: AccessControl | null = null;

export function getAccessControl(): AccessControl {
  if (!defaultAccessControl) {
    defaultAccessControl = new AccessControl();
  }
  return defaultAccessControl;
}

export function setAccessControl(ac: AccessControl): void {
  defaultAccessControl = ac;
}
