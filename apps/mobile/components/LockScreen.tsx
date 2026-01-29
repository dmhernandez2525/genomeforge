import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import { getBiometricTypeLabel } from '@/services/biometricAuth';

interface LockScreenProps {
  onAuthenticated?: () => void;
}

export function LockScreen({ onAuthenticated }: LockScreenProps) {
  const { authenticate, isLoading, error, clearError } = useAuthStore();
  const [biometricLabel, setBiometricLabel] = useState('Biometric');

  useEffect(() => {
    // Get the biometric type label
    getBiometricTypeLabel().then(setBiometricLabel);

    // Auto-prompt for authentication on mount
    const timer = setTimeout(() => {
      handleAuthenticate();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleAuthenticate = async () => {
    clearError();
    const result = await authenticate();
    if (result.success && onAuthenticated) {
      onAuthenticated();
    }
  };

  const getIcon = (): React.ComponentProps<typeof Ionicons>['name'] => {
    if (biometricLabel === 'Face ID') {
      return 'scan';
    }
    if (biometricLabel === 'Touch ID') {
      return 'finger-print';
    }
    return 'lock-closed';
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* App Logo/Icon */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="fitness" size={48} color="#2563eb" />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>GenomeForge</Text>
        <Text style={styles.subtitle}>Your genetic data is protected</Text>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Unlock Button */}
        <TouchableOpacity
          style={[styles.unlockButton, isLoading && styles.unlockButtonDisabled]}
          onPress={handleAuthenticate}
          disabled={isLoading}
        >
          <Ionicons name={getIcon()} size={24} color="#fff" />
          <Text style={styles.unlockButtonText}>
            {isLoading ? 'Authenticating...' : `Unlock with ${biometricLabel}`}
          </Text>
        </TouchableOpacity>

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Ionicons name="shield-checkmark" size={16} color="#059669" />
          <Text style={styles.privacyText}>
            Your data never leaves this device
          </Text>
        </View>
      </View>

      {/* Security Info */}
      <View style={styles.footer}>
        <View style={styles.securityInfo}>
          <View style={styles.securityItem}>
            <Ionicons name="lock-closed" size={16} color="#6b7280" />
            <Text style={styles.securityText}>End-to-end encrypted</Text>
          </View>
          <View style={styles.securityItem}>
            <Ionicons name="hardware-chip" size={16} color="#6b7280" />
            <Text style={styles.securityText}>On-device processing</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#dc2626',
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  unlockButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  unlockButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  privacyText: {
    fontSize: 14,
    color: '#059669',
  },
  footer: {
    padding: 24,
  },
  securityInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  securityText: {
    fontSize: 12,
    color: '#6b7280',
  },
});
