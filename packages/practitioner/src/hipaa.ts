/**
 * HIPAA Compliance Module
 *
 * Utilities and checks for HIPAA compliance.
 */

import type {
  ComplianceStatus,
  ComplianceIssue,
  PractitionerModeSettings,
  SessionConfig,
} from './types';

/**
 * Default HIPAA-compliant settings
 */
export const HIPAA_COMPLIANT_SETTINGS: PractitionerModeSettings = {
  enabled: true,
  sessionConfig: {
    maxIdleTimeMinutes: 15,
    maxSessionDurationMinutes: 480,
    requireReauthOnSensitiveOps: true,
    lockOnMinimize: true,
    warningBeforeTimeoutSeconds: 60,
  },
  auditRetentionDays: 2190, // 6 years as required by HIPAA
  requireMFA: true,
  encryptAtRest: true,
  encryptInTransit: true,
  autoLogoutEnabled: true,
  watermarkEnabled: true,
  printingAllowed: false,
  exportAllowed: true,
  allowedExportFormats: ['pdf', 'encrypted_json'],
};

/**
 * HIPAA Technical Safeguards checklist
 */
export const HIPAA_TECHNICAL_SAFEGUARDS = {
  accessControl: [
    'Unique user identification',
    'Emergency access procedure',
    'Automatic logoff',
    'Encryption and decryption',
  ],
  auditControls: [
    'Hardware, software, and procedural mechanisms to record and examine access',
  ],
  integrity: [
    'Mechanism to authenticate ePHI',
    'Person or entity authentication',
  ],
  transmissionSecurity: [
    'Integrity controls',
    'Encryption',
  ],
};

/**
 * HIPAA compliance checker
 */
export class HIPAAComplianceChecker {
  /**
   * Check overall compliance status
   */
  checkCompliance(settings: PractitionerModeSettings): ComplianceStatus {
    const issues: ComplianceIssue[] = [];
    const recommendations: string[] = [];

    // Check encryption at rest
    if (!settings.encryptAtRest) {
      issues.push({
        id: 'encrypt-at-rest',
        severity: 'critical',
        category: 'Technical Safeguards',
        description: 'Data is not encrypted at rest',
        remediation: 'Enable encryption for all stored ePHI',
        detectedAt: new Date().toISOString(),
      });
    }

    // Check encryption in transit
    if (!settings.encryptInTransit) {
      issues.push({
        id: 'encrypt-in-transit',
        severity: 'critical',
        category: 'Technical Safeguards',
        description: 'Data is not encrypted in transit',
        remediation: 'Enable TLS/SSL for all data transmissions',
        detectedAt: new Date().toISOString(),
      });
    }

    // Check session timeout
    if (settings.sessionConfig.maxIdleTimeMinutes > 20) {
      issues.push({
        id: 'session-timeout',
        severity: 'high',
        category: 'Access Controls',
        description: `Idle timeout (${settings.sessionConfig.maxIdleTimeMinutes} min) exceeds recommended 15-20 minutes`,
        remediation: 'Set idle timeout to 15-20 minutes',
        detectedAt: new Date().toISOString(),
      });
    }

    // Check auto logout
    if (!settings.autoLogoutEnabled) {
      issues.push({
        id: 'auto-logout',
        severity: 'high',
        category: 'Access Controls',
        description: 'Automatic logoff is not enabled',
        remediation: 'Enable automatic logoff after inactivity',
        detectedAt: new Date().toISOString(),
      });
    }

    // Check audit retention
    if (settings.auditRetentionDays < 2190) {
      issues.push({
        id: 'audit-retention',
        severity: 'high',
        category: 'Audit Controls',
        description: `Audit retention (${settings.auditRetentionDays} days) is less than required 6 years`,
        remediation: 'Set audit retention to at least 2190 days (6 years)',
        detectedAt: new Date().toISOString(),
      });
    }

    // Check MFA
    if (!settings.requireMFA) {
      issues.push({
        id: 'mfa-required',
        severity: 'medium',
        category: 'Access Controls',
        description: 'Multi-factor authentication is not required',
        remediation: 'Enable MFA for all users',
        detectedAt: new Date().toISOString(),
      });
      recommendations.push('Enable multi-factor authentication for enhanced security');
    }

    // Check sensitive operation re-auth
    if (!settings.sessionConfig.requireReauthOnSensitiveOps) {
      recommendations.push(
        'Consider requiring re-authentication for sensitive operations like data export or deletion'
      );
    }

    // Check watermarking
    if (!settings.watermarkEnabled) {
      recommendations.push(
        'Consider enabling watermarks on exported documents for tracking'
      );
    }

    // Check printing
    if (settings.printingAllowed) {
      recommendations.push(
        'Review printing policies - printed ePHI requires physical safeguards'
      );
    }

    return {
      isCompliant: issues.filter((i) => i.severity === 'critical' || i.severity === 'high').length === 0,
      lastAudit: new Date().toISOString(),
      issues,
      recommendations,
    };
  }

  /**
   * Check session configuration compliance
   */
  checkSessionConfig(config: SessionConfig): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];

    if (config.maxIdleTimeMinutes > 20) {
      issues.push({
        id: 'idle-timeout-high',
        severity: 'high',
        category: 'Access Controls',
        description: 'Idle timeout exceeds HIPAA recommendation',
        remediation: 'Set maxIdleTimeMinutes to 15-20',
        detectedAt: new Date().toISOString(),
      });
    }

    if (config.maxSessionDurationMinutes > 960) {
      issues.push({
        id: 'session-duration-high',
        severity: 'medium',
        category: 'Access Controls',
        description: 'Maximum session duration is very long',
        remediation: 'Consider limiting session duration to 8-16 hours',
        detectedAt: new Date().toISOString(),
      });
    }

    if (!config.requireReauthOnSensitiveOps) {
      issues.push({
        id: 'reauth-sensitive',
        severity: 'low',
        category: 'Access Controls',
        description: 'Re-authentication not required for sensitive operations',
        remediation: 'Enable requireReauthOnSensitiveOps',
        detectedAt: new Date().toISOString(),
      });
    }

    return issues;
  }

  /**
   * Get HIPAA-compliant default settings
   */
  getCompliantSettings(): PractitionerModeSettings {
    return { ...HIPAA_COMPLIANT_SETTINGS };
  }

  /**
   * Apply HIPAA-compliant settings to existing settings
   */
  applyCompliantSettings(current: Partial<PractitionerModeSettings>): PractitionerModeSettings {
    return {
      ...HIPAA_COMPLIANT_SETTINGS,
      ...current,
      // Force critical settings
      encryptAtRest: true,
      encryptInTransit: true,
      autoLogoutEnabled: true,
      auditRetentionDays: Math.max(
        current.auditRetentionDays || 0,
        HIPAA_COMPLIANT_SETTINGS.auditRetentionDays
      ),
      sessionConfig: {
        ...HIPAA_COMPLIANT_SETTINGS.sessionConfig,
        ...current.sessionConfig,
        maxIdleTimeMinutes: Math.min(
          current.sessionConfig?.maxIdleTimeMinutes || 20,
          20
        ),
      },
    };
  }

  /**
   * Generate a compliance report
   */
  generateComplianceReport(settings: PractitionerModeSettings): string {
    const status = this.checkCompliance(settings);
    const lines: string[] = [];

    lines.push('HIPAA COMPLIANCE REPORT');
    lines.push('='.repeat(50));
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(`Overall Status: ${status.isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}`);
    lines.push('');

    if (status.issues.length > 0) {
      lines.push('ISSUES:');
      lines.push('-'.repeat(50));
      for (const issue of status.issues) {
        lines.push(`[${issue.severity.toUpperCase()}] ${issue.description}`);
        lines.push(`  Category: ${issue.category}`);
        lines.push(`  Remediation: ${issue.remediation}`);
        lines.push('');
      }
    }

    if (status.recommendations.length > 0) {
      lines.push('RECOMMENDATIONS:');
      lines.push('-'.repeat(50));
      for (const rec of status.recommendations) {
        lines.push(`• ${rec}`);
      }
      lines.push('');
    }

    lines.push('CURRENT SETTINGS:');
    lines.push('-'.repeat(50));
    lines.push(`Encryption at Rest: ${settings.encryptAtRest ? 'Yes' : 'No'}`);
    lines.push(`Encryption in Transit: ${settings.encryptInTransit ? 'Yes' : 'No'}`);
    lines.push(`MFA Required: ${settings.requireMFA ? 'Yes' : 'No'}`);
    lines.push(`Auto Logout: ${settings.autoLogoutEnabled ? 'Yes' : 'No'}`);
    lines.push(`Idle Timeout: ${settings.sessionConfig.maxIdleTimeMinutes} minutes`);
    lines.push(`Audit Retention: ${settings.auditRetentionDays} days`);
    lines.push(`Watermarking: ${settings.watermarkEnabled ? 'Yes' : 'No'}`);
    lines.push(`Printing Allowed: ${settings.printingAllowed ? 'Yes' : 'No'}`);

    return lines.join('\n');
  }
}

/**
 * Create a singleton compliance checker instance
 */
let defaultComplianceChecker: HIPAAComplianceChecker | null = null;

export function getComplianceChecker(): HIPAAComplianceChecker {
  if (!defaultComplianceChecker) {
    defaultComplianceChecker = new HIPAAComplianceChecker();
  }
  return defaultComplianceChecker;
}

/**
 * Quick compliance check
 */
export function isHIPAACompliant(settings: PractitionerModeSettings): boolean {
  const checker = getComplianceChecker();
  const status = checker.checkCompliance(settings);
  return status.isCompliant;
}

/**
 * Get compliance issues
 */
export function getComplianceIssues(settings: PractitionerModeSettings): ComplianceIssue[] {
  const checker = getComplianceChecker();
  const status = checker.checkCompliance(settings);
  return status.issues;
}
