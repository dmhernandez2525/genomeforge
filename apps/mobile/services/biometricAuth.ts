/**
 * Biometric Authentication Service
 *
 * Provides Face ID / Touch ID authentication for the mobile app.
 * Supports both iOS (Face ID/Touch ID) and Android (Biometric/Fingerprint).
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

// Storage keys
const AUTH_ENABLED_KEY = 'genomeforge_biometric_enabled';
const LAST_AUTH_KEY = 'genomeforge_last_auth';

// Auth timeout in milliseconds (5 minutes)
const AUTH_TIMEOUT_MS = 5 * 60 * 1000;

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

export interface BiometricCapabilities {
  isAvailable: boolean;
  isEnrolled: boolean;
  biometricTypes: BiometricType[];
  securityLevel: 'none' | 'weak' | 'strong';
}

export interface AuthResult {
  success: boolean;
  error?: string;
  errorCode?: string;
}

/**
 * Check if biometric authentication is available and enrolled
 */
export async function checkBiometricCapabilities(): Promise<BiometricCapabilities> {
  const isAvailable = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

  const biometricTypes: BiometricType[] = supportedTypes.map((type) => {
    switch (type) {
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        return 'fingerprint';
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        return 'facial';
      case LocalAuthentication.AuthenticationType.IRIS:
        return 'iris';
      default:
        return 'none';
    }
  }).filter((t): t is BiometricType => t !== 'none');

  const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();
  let securityLevelStr: 'none' | 'weak' | 'strong' = 'none';
  if (securityLevel === LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG) {
    securityLevelStr = 'strong';
  } else if (securityLevel === LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK) {
    securityLevelStr = 'weak';
  }

  return {
    isAvailable,
    isEnrolled,
    biometricTypes,
    securityLevel: securityLevelStr,
  };
}

/**
 * Get a human-readable description of available biometric types
 */
export async function getBiometricTypeLabel(): Promise<string> {
  const capabilities = await checkBiometricCapabilities();

  if (!capabilities.isAvailable) {
    return 'Not Available';
  }

  if (capabilities.biometricTypes.includes('facial')) {
    return 'Face ID';
  }

  if (capabilities.biometricTypes.includes('fingerprint')) {
    return 'Touch ID';
  }

  if (capabilities.biometricTypes.includes('iris')) {
    return 'Iris Scanner';
  }

  return 'Biometric';
}

/**
 * Authenticate using biometrics
 */
export async function authenticate(
  promptMessage?: string,
  options?: {
    cancelLabel?: string;
    fallbackLabel?: string;
    disableDeviceFallback?: boolean;
  }
): Promise<AuthResult> {
  try {
    const capabilities = await checkBiometricCapabilities();

    if (!capabilities.isAvailable) {
      return {
        success: false,
        error: 'Biometric authentication is not available on this device',
        errorCode: 'NOT_AVAILABLE',
      };
    }

    if (!capabilities.isEnrolled) {
      return {
        success: false,
        error: 'No biometric data is enrolled. Please set up Face ID or Touch ID in Settings.',
        errorCode: 'NOT_ENROLLED',
      };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage || 'Authenticate to access your genetic data',
      cancelLabel: options?.cancelLabel || 'Cancel',
      fallbackLabel: options?.fallbackLabel || 'Use Passcode',
      disableDeviceFallback: options?.disableDeviceFallback ?? false,
    });

    if (result.success) {
      // Record successful auth time
      await recordAuthTime();
      return { success: true };
    }

    // Handle different error types
    let errorMessage = 'Authentication failed';
    let errorCode = 'UNKNOWN';

    if (result.error === 'user_cancel') {
      errorMessage = 'Authentication was cancelled';
      errorCode = 'USER_CANCEL';
    } else if (result.error === 'lockout') {
      errorMessage = 'Too many failed attempts. Please try again later.';
      errorCode = 'LOCKOUT';
    } else if (result.error === 'user_fallback') {
      errorMessage = 'User selected to use passcode';
      errorCode = 'FALLBACK';
    }

    return {
      success: false,
      error: errorMessage,
      errorCode,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication error',
      errorCode: 'EXCEPTION',
    };
  }
}

/**
 * Check if biometric authentication is enabled in app settings
 */
export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(AUTH_ENABLED_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

/**
 * Enable or disable biometric authentication
 */
export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(AUTH_ENABLED_KEY, enabled ? 'true' : 'false');
}

/**
 * Record the time of successful authentication
 */
async function recordAuthTime(): Promise<void> {
  await SecureStore.setItemAsync(LAST_AUTH_KEY, Date.now().toString());
}

/**
 * Check if the user needs to re-authenticate (session expired)
 */
export async function needsReauthentication(): Promise<boolean> {
  try {
    const enabled = await isBiometricEnabled();
    if (!enabled) {
      return false;
    }

    const lastAuthStr = await SecureStore.getItemAsync(LAST_AUTH_KEY);
    if (!lastAuthStr) {
      return true;
    }

    const lastAuth = parseInt(lastAuthStr, 10);
    const elapsed = Date.now() - lastAuth;

    return elapsed > AUTH_TIMEOUT_MS;
  } catch {
    return true;
  }
}

/**
 * Clear the last auth time (for testing or logout)
 */
export async function clearAuthSession(): Promise<void> {
  await SecureStore.deleteItemAsync(LAST_AUTH_KEY);
}

/**
 * Get time remaining until re-authentication is required (in seconds)
 */
export async function getSessionTimeRemaining(): Promise<number> {
  try {
    const lastAuthStr = await SecureStore.getItemAsync(LAST_AUTH_KEY);
    if (!lastAuthStr) {
      return 0;
    }

    const lastAuth = parseInt(lastAuthStr, 10);
    const elapsed = Date.now() - lastAuth;
    const remaining = AUTH_TIMEOUT_MS - elapsed;

    return Math.max(0, Math.floor(remaining / 1000));
  } catch {
    return 0;
  }
}
