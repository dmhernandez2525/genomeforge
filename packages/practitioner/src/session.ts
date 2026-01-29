/**
 * Session Management Module
 *
 * HIPAA-compliant session management with automatic timeouts.
 */

import type { Session, SessionConfig, Practitioner } from './types';
import { getAuditLogger } from './audit';

/**
 * Default session configuration (HIPAA recommended)
 */
export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  maxIdleTimeMinutes: 15, // HIPAA recommends 15-20 minutes
  maxSessionDurationMinutes: 480, // 8 hours max session
  requireReauthOnSensitiveOps: true,
  lockOnMinimize: true,
  warningBeforeTimeoutSeconds: 60,
};

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.getRandomValues(new Uint8Array(16));
  const randomHex = Array.from(random)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `session_${timestamp}_${randomHex}`;
}

/**
 * Session event types
 */
export type SessionEvent =
  | 'session_started'
  | 'session_activity'
  | 'session_warning'
  | 'session_expired'
  | 'session_locked'
  | 'session_unlocked'
  | 'session_ended';

/**
 * Session event listener
 */
export type SessionEventListener = (event: SessionEvent, session: Session | null) => void;

/**
 * Session manager class
 */
export class SessionManager {
  private config: SessionConfig;
  private currentSession: Session | null = null;
  private currentPractitioner: Practitioner | null = null;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private warningTimer: ReturnType<typeof setTimeout> | null = null;
  private sessionTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Set<SessionEventListener> = new Set();
  private lastActivity: Date = new Date();
  private isLocked: boolean = false;

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config };
  }

  /**
   * Add a session event listener
   */
  addEventListener(listener: SessionEventListener): void {
    this.listeners.add(listener);
  }

  /**
   * Remove a session event listener
   */
  removeEventListener(listener: SessionEventListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Emit a session event
   */
  private emit(event: SessionEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event, this.currentSession);
      } catch (error) {
        console.error('Session event listener error:', error);
      }
    }
  }

  /**
   * Start a new session
   */
  async startSession(practitioner: Practitioner, ipAddress?: string, deviceInfo?: string): Promise<Session> {
    // End any existing session
    if (this.currentSession) {
      await this.endSession();
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.maxSessionDurationMinutes * 60 * 1000);

    this.currentSession = {
      id: generateSessionId(),
      practitionerId: practitioner.id,
      startedAt: now.toISOString(),
      lastActivity: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      isActive: true,
      ipAddress,
      deviceInfo,
    };

    this.currentPractitioner = practitioner;
    this.lastActivity = now;
    this.isLocked = false;

    // Start timers
    this.startIdleTimer();
    this.startSessionTimer();

    // Log the session start
    const auditLogger = getAuditLogger();
    auditLogger.setPractitioner(practitioner);
    if (ipAddress) auditLogger.setIpAddress(ipAddress);
    if (deviceInfo) auditLogger.setDeviceInfo(deviceInfo);
    await auditLogger.logLogin(practitioner);

    this.emit('session_started');
    return this.currentSession;
  }

  /**
   * End the current session
   */
  async endSession(): Promise<void> {
    if (!this.currentSession) return;

    this.clearTimers();

    // Log the session end
    const auditLogger = getAuditLogger();
    await auditLogger.logLogout();

    this.currentSession.isActive = false;
    this.currentSession = null;
    this.currentPractitioner = null;

    this.emit('session_ended');
  }

  /**
   * Record activity to reset idle timer
   */
  recordActivity(): void {
    if (!this.currentSession || this.isLocked) return;

    this.lastActivity = new Date();
    this.currentSession.lastActivity = this.lastActivity.toISOString();
    this.startIdleTimer();

    this.emit('session_activity');
  }

  /**
   * Lock the session (require re-authentication)
   */
  lockSession(): void {
    if (!this.currentSession) return;

    this.isLocked = true;
    this.clearTimers();

    this.emit('session_locked');
  }

  /**
   * Unlock the session after re-authentication
   */
  unlockSession(): void {
    if (!this.currentSession) return;

    this.isLocked = false;
    this.lastActivity = new Date();
    this.currentSession.lastActivity = this.lastActivity.toISOString();
    this.startIdleTimer();

    this.emit('session_unlocked');
  }

  /**
   * Check if session is active and valid
   */
  isSessionValid(): boolean {
    if (!this.currentSession || !this.currentSession.isActive) {
      return false;
    }

    const now = new Date();
    const expiresAt = new Date(this.currentSession.expiresAt);

    return now < expiresAt && !this.isLocked;
  }

  /**
   * Check if session is locked
   */
  isSessionLocked(): boolean {
    return this.isLocked;
  }

  /**
   * Get current session
   */
  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  /**
   * Get current practitioner
   */
  getCurrentPractitioner(): Practitioner | null {
    return this.currentPractitioner;
  }

  /**
   * Get time until session expires (in seconds)
   */
  getTimeUntilExpiry(): number {
    if (!this.currentSession) return 0;

    const now = new Date();
    const expiresAt = new Date(this.currentSession.expiresAt);
    return Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
  }

  /**
   * Get time until idle timeout (in seconds)
   */
  getTimeUntilIdleTimeout(): number {
    if (!this.currentSession || this.isLocked) return 0;

    const idleTimeoutMs = this.config.maxIdleTimeMinutes * 60 * 1000;
    const timeSinceActivity = Date.now() - this.lastActivity.getTime();
    return Math.max(0, Math.floor((idleTimeoutMs - timeSinceActivity) / 1000));
  }

  /**
   * Update session configuration
   */
  updateConfig(config: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart timers with new config
    if (this.currentSession && !this.isLocked) {
      this.startIdleTimer();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): SessionConfig {
    return { ...this.config };
  }

  /**
   * Start the idle timer
   */
  private startIdleTimer(): void {
    this.clearIdleTimer();

    const idleTimeMs = this.config.maxIdleTimeMinutes * 60 * 1000;
    const warningTimeMs = idleTimeMs - this.config.warningBeforeTimeoutSeconds * 1000;

    // Set warning timer
    if (warningTimeMs > 0) {
      this.warningTimer = setTimeout(() => {
        this.emit('session_warning');
      }, warningTimeMs);
    }

    // Set idle timeout timer
    this.idleTimer = setTimeout(async () => {
      await this.handleIdleTimeout();
    }, idleTimeMs);
  }

  /**
   * Start the session duration timer
   */
  private startSessionTimer(): void {
    this.clearSessionTimer();

    if (!this.currentSession) return;

    const timeUntilExpiry = this.getTimeUntilExpiry() * 1000;
    if (timeUntilExpiry > 0) {
      this.sessionTimer = setTimeout(async () => {
        await this.handleSessionExpiry();
      }, timeUntilExpiry);
    }
  }

  /**
   * Handle idle timeout
   */
  private async handleIdleTimeout(): Promise<void> {
    if (!this.currentSession) return;

    const auditLogger = getAuditLogger();
    await auditLogger.logSessionTimeout();

    this.lockSession();

    this.emit('session_expired');
  }

  /**
   * Handle session expiry
   */
  private async handleSessionExpiry(): Promise<void> {
    await this.endSession();
    this.emit('session_expired');
  }

  /**
   * Clear idle timer
   */
  private clearIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  /**
   * Clear session timer
   */
  private clearSessionTimer(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    this.clearIdleTimer();
    this.clearSessionTimer();
  }
}

/**
 * Create a singleton session manager instance
 */
let defaultSessionManager: SessionManager | null = null;

export function getSessionManager(): SessionManager {
  if (!defaultSessionManager) {
    defaultSessionManager = new SessionManager();
  }
  return defaultSessionManager;
}

export function setSessionManager(manager: SessionManager): void {
  defaultSessionManager = manager;
}
