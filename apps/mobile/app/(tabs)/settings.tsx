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
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAnalysisStore } from '@/store/analysis';

interface SettingItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  type: 'switch' | 'link' | 'action';
  value?: boolean;
  onPress?: () => void;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

export default function SettingsScreen() {
  const { clearAllData, hasGenomeData, databaseStatus } = useAnalysisStore();

  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your genetic data, analysis results, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            clearAllData();
            Alert.alert('Data Cleared', 'All data has been removed from the app.');
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your data will be exported as an encrypted file that you can backup.',
      [{ text: 'OK' }]
    );
  };

  const sections: SettingSection[] = [
    {
      title: 'Security',
      items: [
        {
          id: 'biometric',
          title: 'Biometric Authentication',
          description: 'Use Face ID or Touch ID to secure the app',
          icon: 'finger-print',
          iconColor: '#2563eb',
          type: 'switch',
          value: biometricEnabled,
          onPress: () => setBiometricEnabled(!biometricEnabled),
        },
        {
          id: 'api-keys',
          title: 'API Keys',
          description: 'Manage your AI provider API keys',
          icon: 'key',
          iconColor: '#7c3aed',
          type: 'link',
          onPress: () => {
            // Navigate to API keys screen
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
          description: `${Object.values(databaseStatus).filter(s => s.loaded).length}/3 loaded`,
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
          onPress: () => setNotificationsEnabled(!notificationsEnabled),
        },
        {
          id: 'analytics',
          title: 'Usage Analytics',
          description: 'Help improve the app with anonymous usage data',
          icon: 'analytics',
          iconColor: '#6b7280',
          type: 'switch',
          value: analyticsEnabled,
          onPress: () => setAnalyticsEnabled(!analyticsEnabled),
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
            <Text style={styles.storageValue}>
              {Object.values(databaseStatus).filter((s) => s.loaded).length}
            </Text>
            <Text style={styles.storageLabel}>Databases</Text>
          </View>
          <View style={styles.storageStat}>
            <Text style={styles.storageValue}>~50 MB</Text>
            <Text style={styles.storageLabel}>Total</Text>
          </View>
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
                ]}
                onPress={item.onPress}
                disabled={item.type === 'switch'}
              >
                <View
                  style={[
                    styles.settingIcon,
                    { backgroundColor: item.iconColor + '20' },
                  ]}
                >
                  <Ionicons name={item.icon} size={20} color={item.iconColor} />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>{item.title}</Text>
                  {item.description && (
                    <Text style={styles.settingDescription}>{item.description}</Text>
                  )}
                </View>
                {item.type === 'switch' ? (
                  <Switch
                    value={item.value}
                    onValueChange={item.onPress}
                    trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                    thumbColor={item.value ? '#2563eb' : '#f3f4f6'}
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
    marginBottom: 24,
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
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
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
