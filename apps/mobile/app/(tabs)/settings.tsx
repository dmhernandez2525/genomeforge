import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAnalysisStore } from '@/store/analysis';
import { useReportsStore } from '@/store/reports';
import { useChatStore } from '@/store/chat';
import { useAuthStore } from '@/store/auth';
import { getBiometricTypeLabel } from '@/services/biometricAuth';

interface SettingItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  type: 'switch' | 'link' | 'action';
  value?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

export default function SettingsScreen() {
  const router = useRouter();
  const { clearAllData, hasGenomeData, databaseStatus } = useAnalysisStore();
  const { reports, clearAllReports } = useReportsStore();
  const { clearAllSessions } = useChatStore();
  const {
    biometricEnabled,
    capabilities,
    enableBiometric,
    disableBiometric,
    lock,
    error,
    clearError,
  } = useAuthStore();

  const [biometricLabel, setBiometricLabel] = useState('Biometric');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    getBiometricTypeLabel().then(setBiometricLabel);
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  const handleToggleBiometric = async (enable: boolean) => {
    if (enable) {
      const success = await enableBiometric();
      if (success) {
        Alert.alert(
          'Biometric Lock Enabled',
          `${biometricLabel} will now be required to access the app.`
        );
      }
    } else {
      await disableBiometric();
      Alert.alert(
        'Biometric Lock Disabled',
        'The app is no longer protected by biometric authentication.'
      );
    }
  };

  const handleLockNow = () => {
    Alert.alert(
      'Lock App',
      `Lock the app now? You will need to use ${biometricLabel} to unlock.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Lock',
          onPress: () => lock(),
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your genetic data, analysis results, reports, chat history, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            clearAllData();
            clearAllReports();
            clearAllSessions();
            Alert.alert('Data Cleared', 'All data has been removed from the app.');
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    router.push('/export');
  };

  const biometricAvailable = capabilities?.isAvailable && capabilities?.isEnrolled;

  const sections: SettingSection[] = [
    {
      title: 'Security',
      items: [
        {
          id: 'biometric',
          title: `${biometricLabel} Lock`,
          description: biometricAvailable
            ? `Use ${biometricLabel} to secure the app`
            : `${biometricLabel} is not available on this device`,
          icon: biometricLabel === 'Face ID' ? 'scan' : 'finger-print',
          iconColor: '#2563eb',
          type: 'switch',
          value: biometricEnabled,
          disabled: !biometricAvailable,
          onToggle: handleToggleBiometric,
        },
        ...(biometricEnabled
          ? [
              {
                id: 'lock-now',
                title: 'Lock Now',
                description: 'Immediately lock the app',
                icon: 'lock-closed' as const,
                iconColor: '#dc2626',
                type: 'action' as const,
                onPress: handleLockNow,
              },
            ]
          : []),
        {
          id: 'api-keys',
          title: 'API Keys',
          description: 'Manage your AI provider API keys',
          icon: 'key',
          iconColor: '#7c3aed',
          type: 'link',
          onPress: () => {
            Alert.alert('API Keys', 'Go to the Chat screen to manage API keys in Settings.');
          },
        },
      ],
    },
    {
      title: 'Data Management',
      items: [
        {
          id: 'export',
          title: 'Export Data',
          description: 'Create an encrypted backup of your data',
          icon: 'download',
          iconColor: '#059669',
          type: 'action',
          onPress: handleExportData,
        },
        {
          id: 'databases',
          title: 'Reference Databases',
          description: `${Object.values(databaseStatus).filter((s) => s.loaded).length}/3 loaded`,
          icon: 'server',
          iconColor: '#f97316',
          type: 'link',
          onPress: () => {
            // Navigate to database management
          },
        },
        {
          id: 'clear',
          title: 'Clear All Data',
          description: 'Remove all genetic data and settings',
          icon: 'trash',
          iconColor: '#dc2626',
          type: 'action',
          onPress: handleClearData,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          id: 'notifications',
          title: 'Notifications',
          description: 'Receive updates about your analysis',
          icon: 'notifications',
          iconColor: '#2563eb',
          type: 'switch',
          value: notificationsEnabled,
          onToggle: setNotificationsEnabled,
        },
        {
          id: 'analytics',
          title: 'Usage Analytics',
          description: 'Help improve the app with anonymous usage data',
          icon: 'analytics',
          iconColor: '#6b7280',
          type: 'switch',
          value: analyticsEnabled,
          onToggle: setAnalyticsEnabled,
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          id: 'version',
          title: 'Version',
          description: '1.0.0',
          icon: 'information-circle',
          iconColor: '#6b7280',
          type: 'link',
          onPress: () => {},
        },
        {
          id: 'privacy',
          title: 'Privacy Policy',
          icon: 'shield-checkmark',
          iconColor: '#059669',
          type: 'link',
          onPress: () => Linking.openURL('https://genomeforge.com/privacy'),
        },
        {
          id: 'terms',
          title: 'Terms of Service',
          icon: 'document-text',
          iconColor: '#2563eb',
          type: 'link',
          onPress: () => Linking.openURL('https://genomeforge.com/terms'),
        },
        {
          id: 'support',
          title: 'Get Help',
          description: 'Contact support or view FAQ',
          icon: 'help-circle',
          iconColor: '#7c3aed',
          type: 'link',
          onPress: () => Linking.openURL('https://genomeforge.com/support'),
        },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Storage Info */}
      <View style={styles.storageCard}>
        <View style={styles.storageHeader}>
          <Ionicons name="folder" size={24} color="#2563eb" />
          <Text style={styles.storageTitle}>Local Storage</Text>
        </View>
        <View style={styles.storageStats}>
          <View style={styles.storageStat}>
            <Text style={styles.storageValue}>{hasGenomeData ? '1' : '0'}</Text>
            <Text style={styles.storageLabel}>DNA Files</Text>
          </View>
          <View style={styles.storageStat}>
            <Text style={styles.storageValue}>{reports.length}</Text>
            <Text style={styles.storageLabel}>Reports</Text>
          </View>
          <View style={styles.storageStat}>
            <Text style={styles.storageValue}>
              {Object.values(databaseStatus).filter((s) => s.loaded).length}
            </Text>
            <Text style={styles.storageLabel}>Databases</Text>
          </View>
        </View>
      </View>

      {/* Security Status */}
      <View
        style={[
          styles.securityStatus,
          biometricEnabled ? styles.securityStatusEnabled : styles.securityStatusDisabled,
        ]}
      >
        <Ionicons
          name={biometricEnabled ? 'shield-checkmark' : 'shield-outline'}
          size={24}
          color={biometricEnabled ? '#059669' : '#f59e0b'}
        />
        <View style={styles.securityStatusText}>
          <Text
            style={[
              styles.securityStatusTitle,
              biometricEnabled ? styles.securityStatusTitleEnabled : styles.securityStatusTitleDisabled,
            ]}
          >
            {biometricEnabled ? 'App Protected' : 'App Not Protected'}
          </Text>
          <Text style={styles.securityStatusDescription}>
            {biometricEnabled
              ? `${biometricLabel} authentication is enabled`
              : 'Enable biometric lock for extra security'}
          </Text>
        </View>
      </View>

      {/* Settings Sections */}
      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionContent}>
            {section.items.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.settingItem,
                  index === section.items.length - 1 && styles.settingItemLast,
                  item.disabled && styles.settingItemDisabled,
                ]}
                onPress={item.type !== 'switch' ? item.onPress : undefined}
                disabled={item.type === 'switch' || item.disabled}
              >
                <View
                  style={[
                    styles.settingIcon,
                    { backgroundColor: item.iconColor + '20' },
                    item.disabled && styles.settingIconDisabled,
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={item.disabled ? '#9ca3af' : item.iconColor}
                  />
                </View>
                <View style={styles.settingText}>
                  <Text
                    style={[styles.settingTitle, item.disabled && styles.settingTitleDisabled]}
                  >
                    {item.title}
                  </Text>
                  {item.description && (
                    <Text style={styles.settingDescription}>{item.description}</Text>
                  )}
                </View>
                {item.type === 'switch' ? (
                  <Switch
                    value={item.value}
                    onValueChange={item.onToggle}
                    trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                    thumbColor={item.value ? '#2563eb' : '#f3f4f6'}
                    disabled={item.disabled}
                  />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>GenomeForge v1.0.0</Text>
        <Text style={styles.appInfoText}>Made with privacy in mind</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  storageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  storageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  storageStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  storageStat: {
    alignItems: 'center',
  },
  storageValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  storageLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  securityStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  securityStatusEnabled: {
    backgroundColor: '#ecfdf5',
  },
  securityStatusDisabled: {
    backgroundColor: '#fffbeb',
  },
  securityStatusText: {
    flex: 1,
  },
  securityStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  securityStatusTitleEnabled: {
    color: '#065f46',
  },
  securityStatusTitleDisabled: {
    color: '#92400e',
  },
  securityStatusDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingItemDisabled: {
    opacity: 0.6,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingIconDisabled: {
    backgroundColor: '#f3f4f6',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  settingTitleDisabled: {
    color: '#9ca3af',
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  appInfo: {
    alignItems: 'center',
    paddingTop: 16,
  },
  appInfoText: {
    fontSize: 14,
    color: '#9ca3af',
  },
});
