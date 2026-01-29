import { create } from 'zustand';
import {
  isBiometricEnabled,
  setBiometricEnabled,
  checkBiometricCapabilities,
  needsReauthentication,
  authenticate,
  clearAuthSession,
  type BiometricCapabilities,
  type AuthResult,
} from '@/services/biometricAuth';

interface AuthStore {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  biometricEnabled: boolean;
  capabilities: BiometricCapabilities | null;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  authenticate: (promptMessage?: string) => Promise<AuthResult>;
  checkSession: () => Promise<void>;
  enableBiometric: () => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  lock: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
  // Initial State
  isAuthenticated: false,
  isLoading: true,
  biometricEnabled: false,
  capabilities: null,
  error: null,

  // Initialize auth state on app launch
  initialize: async () => {
    set({ isLoading: true, error: null });

    try {
      const [enabled, capabilities] = await Promise.all([
        isBiometricEnabled(),
        checkBiometricCapabilities(),
      ]);

      set({ biometricEnabled: enabled, capabilities });

      // If biometric is not enabled, user is automatically authenticated
      if (!enabled) {
        set({ isAuthenticated: true, isLoading: false });
        return;
      }

      // Check if session is still valid
      const needsAuth = await needsReauthentication();
      if (!needsAuth) {
        set({ isAuthenticated: true, isLoading: false });
        return;
      }

      // Need to authenticate
      set({ isAuthenticated: false, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize auth',
      });
    }
  },

  // Authenticate the user
  authenticate: async (promptMessage?: string) => {
    const { capabilities, biometricEnabled } = get();

    // If biometric is not enabled, auto-authenticate
    if (!biometricEnabled) {
      set({ isAuthenticated: true, error: null });
      return { success: true };
    }

    // If biometric is not available, auto-authenticate
    if (!capabilities?.isAvailable || !capabilities?.isEnrolled) {
      set({ isAuthenticated: true, error: null });
      return { success: true };
    }

    set({ isLoading: true, error: null });

    const result = await authenticate(promptMessage);

    if (result.success) {
      set({ isAuthenticated: true, isLoading: false });
    } else {
      set({
        isLoading: false,
        error: result.error || 'Authentication failed',
      });
    }

    return result;
  },

  // Check if session is still valid
  checkSession: async () => {
    const { biometricEnabled } = get();

    if (!biometricEnabled) {
      return;
    }

    const needsAuth = await needsReauthentication();
    if (needsAuth) {
      set({ isAuthenticated: false });
    }
  },

  // Enable biometric authentication
  enableBiometric: async () => {
    const { capabilities } = get();

    if (!capabilities?.isAvailable) {
      set({ error: 'Biometric authentication is not available on this device' });
      return false;
    }

    if (!capabilities?.isEnrolled) {
      set({ error: 'Please set up Face ID or Touch ID in your device Settings first' });
      return false;
    }

    // Authenticate first to confirm identity
    const result = await authenticate('Confirm your identity to enable biometric lock');

    if (!result.success) {
      set({ error: result.error || 'Failed to verify identity' });
      return false;
    }

    await setBiometricEnabled(true);
    set({ biometricEnabled: true, error: null });
    return true;
  },

  // Disable biometric authentication
  disableBiometric: async () => {
    // Authenticate first to confirm identity before disabling
    const result = await authenticate('Confirm your identity to disable biometric lock');

    if (!result.success) {
      set({ error: result.error || 'Failed to verify identity' });
      return;
    }

    await setBiometricEnabled(false);
    set({ biometricEnabled: false, error: null });
  },

  // Lock the app (require re-authentication)
  lock: async () => {
    await clearAuthSession();
    set({ isAuthenticated: false });
  },

  // Clear error message
  clearError: () => set({ error: null }),
}));
