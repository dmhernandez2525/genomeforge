import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAnalysisStore } from '@/store/analysis';

interface RiskCategory {
  id: string;
  name: string;
  count: number;
  color: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

export default function AnalysisScreen() {
  const router = useRouter();
  const { hasGenomeData, analysisResult, genomeData } = useAnalysisStore();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  if (!hasGenomeData) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="flask-outline" size={64} color="#d1d5db" />
        </View>
        <Text style={styles.emptyTitle}>No DNA Data</Text>
        <Text style={styles.emptyDescription}>
          Upload your genetic data to view analysis results
        </Text>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => router.push('/upload')}
        >
          <Text style={styles.uploadButtonText}>Upload DNA Data</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const riskCategories: RiskCategory[] = [
    { id: 'pathogenic', name: 'Pathogenic', count: 5, color: '#dc2626', icon: 'alert-circle' },
    { id: 'likely_pathogenic', name: 'Likely Pathogenic', count: 12, color: '#f97316', icon: 'warning' },
    { id: 'vus', name: 'Uncertain', count: 234, color: '#eab308', icon: 'help-circle' },
    { id: 'benign', name: 'Benign', count: 15234, color: '#22c55e', icon: 'checkmark-circle' },
  ];

  const quickStats = [
    { label: 'Variants Analyzed', value: genomeData?.variantCount?.toLocaleString() || '0' },
    { label: 'Clinical Matches', value: '45' },
    { label: 'Drug Interactions', value: '8' },
    { label: 'Trait Associations', value: '127' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* File Info */}
      <View style={styles.fileInfoCard}>
        <Ionicons name="document-text" size={24} color="#2563eb" />
        <View style={styles.fileInfoText}>
          <Text style={styles.fileName}>{genomeData?.filename || 'Unknown file'}</Text>
          <Text style={styles.fileSource}>Source: {genomeData?.source || 'Unknown'}</Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        {quickStats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Risk Categories */}
      <Text style={styles.sectionTitle}>Clinical Significance</Text>
      <View style={styles.riskCategories}>
        {riskCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.riskCard}
            onPress={() => {
              // Navigate to filtered list
            }}
          >
            <View style={[styles.riskIconContainer, { backgroundColor: category.color + '20' }]}>
              <Ionicons name={category.icon} size={24} color={category.color} />
            </View>
            <View style={styles.riskText}>
              <Text style={styles.riskName}>{category.name}</Text>
              <Text style={styles.riskCount}>{category.count.toLocaleString()} variants</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Analysis Sections */}
      <Text style={styles.sectionTitle}>Analysis Categories</Text>
      <View style={styles.analysisCategories}>
        <TouchableOpacity style={styles.analysisCard}>
          <View style={[styles.analysisBadge, { backgroundColor: '#eff6ff' }]}>
            <Ionicons name="fitness" size={24} color="#2563eb" />
          </View>
          <Text style={styles.analysisTitle}>Health Conditions</Text>
          <Text style={styles.analysisDescription}>
            Genetic predispositions to health conditions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.analysisCard}>
          <View style={[styles.analysisBadge, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="medkit" size={24} color="#d97706" />
          </View>
          <Text style={styles.analysisTitle}>Pharmacogenomics</Text>
          <Text style={styles.analysisDescription}>
            How your genes affect drug metabolism
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.analysisCard}>
          <View style={[styles.analysisBadge, { backgroundColor: '#f3e8ff' }]}>
            <Ionicons name="body" size={24} color="#7c3aed" />
          </View>
          <Text style={styles.analysisTitle}>Traits</Text>
          <Text style={styles.analysisDescription}>
            Genetic influences on physical traits
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.analysisCard}>
          <View style={[styles.analysisBadge, { backgroundColor: '#ecfdf5' }]}>
            <Ionicons name="people" size={24} color="#059669" />
          </View>
          <Text style={styles.analysisTitle}>Ancestry</Text>
          <Text style={styles.analysisDescription}>
            Your genetic ancestry breakdown
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/chat')}
        >
          <Ionicons name="chatbubbles" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>Ask AI About Results</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/reports')}
        >
          <Ionicons name="document-text" size={20} color="#2563eb" />
          <Text style={styles.secondaryButtonText}>Generate Report</Text>
        </TouchableOpacity>
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
  emptyContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  uploadButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fileInfoCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  fileInfoText: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
  },
  fileSource: {
    fontSize: 14,
    color: '#3b82f6',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
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
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  riskCategories: {
    gap: 8,
    marginBottom: 24,
  },
  riskCard: {
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
  riskIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskText: {
    flex: 1,
  },
  riskName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  riskCount: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  analysisCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  analysisCard: {
    width: '47%',
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
  analysisBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  analysisDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
  },
  actionButtons: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
});
