import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function VariantDetailScreen() {
  const { rsid } = useLocalSearchParams<{ rsid: string }>();

  // Mock variant data - in real app, this would come from the database
  const variant = {
    rsid: rsid || 'rs12345',
    gene: 'BRCA1',
    chromosome: '17',
    position: 41245466,
    referenceAllele: 'A',
    alternateAllele: 'G',
    clinicalSignificance: 'Pathogenic',
    reviewStatus: 3,
    conditions: [
      { name: 'Hereditary breast and ovarian cancer syndrome', omimId: '604370' },
    ],
    frequency: 0.001,
    studies: 15,
  };

  const getSignificanceColor = (significance: string): string => {
    const colors: Record<string, string> = {
      Pathogenic: '#dc2626',
      'Likely Pathogenic': '#f97316',
      'Uncertain Significance': '#eab308',
      'Likely Benign': '#22c55e',
      Benign: '#22c55e',
    };
    return colors[significance] || '#6b7280';
  };

  const renderStars = (count: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4].map((i) => (
          <Ionicons
            key={i}
            name={i <= count ? 'star' : 'star-outline'}
            size={16}
            color={i <= count ? '#eab308' : '#d1d5db'}
          />
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.rsidRow}>
          <Text style={styles.rsid}>{variant.rsid}</Text>
          <View
            style={[
              styles.significanceBadge,
              { backgroundColor: getSignificanceColor(variant.clinicalSignificance) + '20' },
            ]}
          >
            <Text
              style={[
                styles.significanceText,
                { color: getSignificanceColor(variant.clinicalSignificance) },
              ]}
            >
              {variant.clinicalSignificance}
            </Text>
          </View>
        </View>
        <Text style={styles.gene}>Gene: {variant.gene}</Text>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Review Status:</Text>
          {renderStars(variant.reviewStatus)}
        </View>
      </View>

      {/* Location Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Genomic Location</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Chromosome</Text>
            <Text style={styles.infoValue}>{variant.chromosome}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Position</Text>
            <Text style={styles.infoValue}>{variant.position.toLocaleString()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Reference Allele</Text>
            <Text style={styles.alleleText}>{variant.referenceAllele}</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoLabel}>Alternate Allele</Text>
            <Text style={styles.alleleText}>{variant.alternateAllele}</Text>
          </View>
        </View>
      </View>

      {/* Associated Conditions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Associated Conditions</Text>
        {variant.conditions.map((condition, index) => (
          <View key={index} style={styles.conditionCard}>
            <Ionicons name="medical" size={20} color="#dc2626" />
            <View style={styles.conditionText}>
              <Text style={styles.conditionName}>{condition.name}</Text>
              {condition.omimId && (
                <Text style={styles.conditionOmim}>OMIM: {condition.omimId}</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Population Frequency */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Population Frequency</Text>
        <View style={styles.infoCard}>
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoLabel}>Global Frequency</Text>
            <Text style={styles.infoValue}>
              {(variant.frequency * 100).toFixed(3)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Studies */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Evidence</Text>
        <View style={styles.evidenceCard}>
          <Ionicons name="library" size={24} color="#2563eb" />
          <View style={styles.evidenceText}>
            <Text style={styles.evidenceCount}>{variant.studies}</Text>
            <Text style={styles.evidenceLabel}>Supporting Studies</Text>
          </View>
        </View>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Ionicons name="information-circle" size={20} color="#6b7280" />
        <Text style={styles.disclaimerText}>
          This information is for educational purposes only. Always consult with a
          healthcare professional or genetic counselor for interpretation of genetic
          results.
        </Text>
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
  headerCard: {
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
  rsidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rsid: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  significanceBadge: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  significanceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  gene: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  infoCard: {
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  alleleText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  conditionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
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
  conditionText: {
    flex: 1,
  },
  conditionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    lineHeight: 20,
  },
  conditionOmim: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  evidenceCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  evidenceText: {
    flex: 1,
  },
  evidenceCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  evidenceLabel: {
    fontSize: 14,
    color: '#3b82f6',
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
  },
});
