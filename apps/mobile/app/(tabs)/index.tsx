import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAnalysisStore } from '@/store/analysis';

export default function HomeScreen() {
  const router = useRouter();
  const { hasGenomeData, analysisResult, databaseStatus } = useAnalysisStore();

  const features = [
    {
      id: 'upload',
      title: 'Upload DNA',
      description: 'Import your genetic data from 23andMe, AncestryDNA, or VCF files',
      icon: 'cloud-upload' as const,
      route: '/upload',
      color: '#2563eb',
    },
    {
      id: 'analysis',
      title: 'View Analysis',
      description: 'Explore your genetic variants and health insights',
      icon: 'analytics' as const,
      route: '/analysis',
      color: '#7c3aed',
      disabled: !hasGenomeData,
    },
    {
      id: 'reports',
      title: 'Reports',
      description: 'Generate detailed genetic health reports',
      icon: 'document-text' as const,
      route: '/reports',
      color: '#059669',
      disabled: !analysisResult,
    },
    {
      id: 'chat',
      title: 'AI Assistant',
      description: 'Ask questions about your genetic data',
      icon: 'chatbubbles' as const,
      route: '/chat',
      color: '#dc2626',
    },
  ];

  const loadedDatabases = Object.entries(databaseStatus).filter(
    ([, status]) => status.loaded
  ).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Welcome to GenomeForge</Text>
        <Text style={styles.heroSubtitle}>
          Your privacy-first genetic analysis companion
        </Text>
      </View>

      {/* Quick Status */}
      <View style={styles.statusRow}>
        <View style={styles.statusCard}>
          <Ionicons
            name={hasGenomeData ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={hasGenomeData ? '#059669' : '#9ca3af'}
          />
          <Text style={[styles.statusText, hasGenomeData && styles.statusTextActive]}>
            {hasGenomeData ? 'DNA Loaded' : 'No DNA Data'}
          </Text>
        </View>
        <View style={styles.statusCard}>
          <Ionicons
            name="server"
            size={24}
            color={loadedDatabases > 0 ? '#059669' : '#9ca3af'}
          />
          <Text style={[styles.statusText, loadedDatabases > 0 && styles.statusTextActive]}>
            {loadedDatabases}/3 Databases
          </Text>
        </View>
      </View>

      {/* Features Grid */}
      <Text style={styles.sectionTitle}>Get Started</Text>
      <View style={styles.featuresGrid}>
        {features.map((feature) => (
          <TouchableOpacity
            key={feature.id}
            style={[
              styles.featureCard,
              feature.disabled && styles.featureCardDisabled,
            ]}
            onPress={() => !feature.disabled && router.push(feature.route as never)}
            disabled={feature.disabled}
          >
            <View style={[styles.featureIconContainer, { backgroundColor: feature.color + '20' }]}>
              <Ionicons name={feature.icon} size={28} color={feature.color} />
            </View>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Privacy Notice */}
      <View style={styles.privacyCard}>
        <Ionicons name="shield-checkmark" size={24} color="#059669" />
        <View style={styles.privacyText}>
          <Text style={styles.privacyTitle}>100% Private</Text>
          <Text style={styles.privacyDescription}>
            Your genetic data never leaves your device. All processing happens locally.
          </Text>
        </View>
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
  hero: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#bfdbfe',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  statusText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  statusTextActive: {
    color: '#059669',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
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
  featureCardDisabled: {
    opacity: 0.5,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
  },
  privacyCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  privacyText: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 4,
  },
  privacyDescription: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
});
