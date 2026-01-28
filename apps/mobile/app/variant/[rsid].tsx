import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAnalysisStore } from '@/store/analysis';
import {
  generateExternalLinks,
  getImpactDescription,
  getConsequenceDescription,
  getSiftDescription,
  getPolyphenDescription,
  formatFrequency,
  getRarityClassification,
  getClinicalSignificanceInfo,
  formatGenotype,
  getReviewStatusStars,
  type ExternalLink,
} from '@/services/variantAnalysis';

export default function VariantDetailScreen() {
  const { rsid } = useLocalSearchParams<{ rsid: string }>();
  const { analysisResult, genomeData } = useAnalysisStore();

  // Find the variant from analysis results
  const clinicalFinding = analysisResult?.clinicalFindings.find((f) => f.rsid === rsid);
  const drugResponse = analysisResult?.drugResponses.find((d) => d.rsid === rsid);
  const traitAssociation = analysisResult?.traitAssociations.find((t) => t.rsid === rsid);

  // Get genotype from parsed genome data if available
  const parsedVariant = genomeData?.variants?.get?.(rsid || '');

  // Build variant details from available data
  const variant = {
    rsid: rsid || 'Unknown',
    gene: clinicalFinding?.gene || drugResponse?.gene,
    chromosome: parsedVariant?.chromosome || clinicalFinding?.chromosome || '?',
    position: parsedVariant?.position || 0,
    genotype: parsedVariant?.genotype || 'N/A',
    referenceAllele: parsedVariant?.genotype?.split(/[\/|]/)[0] || '?',
    alternateAllele: parsedVariant?.genotype?.split(/[\/|]/)[1] || '?',
    clinicalSignificance: clinicalFinding?.significance || 'Unknown',
    condition: clinicalFinding?.condition,
    drugInfo: drugResponse,
    traitInfo: traitAssociation,
  };

  const significanceInfo = getClinicalSignificanceInfo(variant.clinicalSignificance);
  const genotypeInfo = formatGenotype(variant.genotype);
  const externalLinks = generateExternalLinks(variant.rsid, variant.gene);

  const handleOpenLink = (url: string) => {
    Linking.openURL(url);
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
      <Stack.Screen
        options={{
          title: variant.rsid,
        }}
      />

      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.rsidRow}>
          <View>
            <Text style={styles.rsid}>{variant.rsid}</Text>
            {variant.gene && <Text style={styles.gene}>Gene: {variant.gene}</Text>}
          </View>
          <View
            style={[styles.significanceBadge, { backgroundColor: significanceInfo.color + '20' }]}
          >
            <Ionicons
              name={significanceInfo.icon as any}
              size={16}
              color={significanceInfo.color}
            />
            <Text style={[styles.significanceText, { color: significanceInfo.color }]}>
              {significanceInfo.label}
            </Text>
          </View>
        </View>
        <Text style={styles.significanceDescription}>{significanceInfo.description}</Text>
        {clinicalFinding && (
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>ClinVar Review:</Text>
            {renderStars(getReviewStatusStars(clinicalFinding.reviewStatus || ''))}
          </View>
        )}
      </View>

      {/* Your Genotype */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Genotype</Text>
        <View style={styles.genotypeCard}>
          <View style={styles.genotypeDisplay}>
            <Text style={styles.genotypeText}>{variant.genotype}</Text>
          </View>
          <View style={styles.genotypeInfo}>
            <View style={styles.zygosityBadge}>
              <Text style={styles.zygosityText}>{genotypeInfo.zygosity}</Text>
            </View>
            <Text style={styles.zygosityDescription}>{genotypeInfo.description}</Text>
          </View>
        </View>
      </View>

      {/* Genomic Location */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Genomic Location</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Chromosome</Text>
            <Text style={styles.infoValue}>{variant.chromosome}</Text>
          </View>
          {variant.position > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Position</Text>
              <Text style={styles.infoValue}>{variant.position.toLocaleString()}</Text>
            </View>
          )}
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoLabel}>Alleles</Text>
            <View style={styles.allelesContainer}>
              <Text style={styles.alleleText}>{variant.referenceAllele}</Text>
              <Ionicons name="arrow-forward" size={14} color="#9ca3af" />
              <Text style={styles.alleleText}>{variant.alternateAllele}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Associated Condition */}
      {variant.condition && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Associated Condition</Text>
          <View style={styles.conditionCard}>
            <Ionicons name="medical" size={24} color="#dc2626" />
            <View style={styles.conditionText}>
              <Text style={styles.conditionName}>{variant.condition}</Text>
              <Text style={styles.conditionNote}>
                Based on ClinVar clinical annotations
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Drug Response */}
      {variant.drugInfo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pharmacogenomics</Text>
          <View style={styles.drugCard}>
            <View style={styles.drugHeader}>
              <Ionicons name="medkit" size={24} color="#7c3aed" />
              <Text style={styles.drugName}>{variant.drugInfo.drug}</Text>
            </View>
            <View style={styles.drugContent}>
              <View style={styles.drugRow}>
                <Text style={styles.drugLabel}>Your Response</Text>
                <Text style={styles.drugValue}>{variant.drugInfo.response}</Text>
              </View>
              <View style={[styles.drugRow, styles.drugRowLast]}>
                <Text style={styles.drugLabel}>Recommendation</Text>
                <Text style={styles.drugRecommendation}>{variant.drugInfo.recommendation}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Trait Association */}
      {variant.traitInfo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trait Association</Text>
          <View style={styles.traitCard}>
            <View style={styles.traitHeader}>
              <Ionicons name="color-palette" size={24} color="#ec4899" />
              <View style={styles.traitInfo}>
                <Text style={styles.traitName}>{variant.traitInfo.trait}</Text>
                <Text style={styles.traitCategory}>{variant.traitInfo.category}</Text>
              </View>
            </View>
            <View style={styles.traitContent}>
              <Text style={styles.traitEffect}>{variant.traitInfo.effect}</Text>
              <View style={styles.confidenceBar}>
                <View
                  style={[
                    styles.confidenceFill,
                    { width: `${variant.traitInfo.confidence * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.confidenceLabel}>
                {(variant.traitInfo.confidence * 100).toFixed(0)}% confidence
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* External Resources */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>External Resources</Text>
        <View style={styles.linksGrid}>
          {externalLinks.slice(0, 6).map((link) => (
            <TouchableOpacity
              key={link.name}
              style={styles.linkCard}
              onPress={() => handleOpenLink(link.url)}
            >
              <Ionicons name={link.icon as any} size={20} color="#2563eb" />
              <Text style={styles.linkName}>{link.name}</Text>
              <Ionicons name="open-outline" size={14} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>
        {externalLinks.length > 6 && (
          <TouchableOpacity
            style={styles.moreLinksButton}
            onPress={() => handleOpenLink(externalLinks[0].url)}
          >
            <Text style={styles.moreLinksText}>
              View all {externalLinks.length} resources
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#2563eb" />
          </TouchableOpacity>
        )}
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              handleOpenLink(`https://www.ncbi.nlm.nih.gov/clinvar/?term=${variant.rsid}`)
            }
          >
            <Ionicons name="search" size={20} color="#2563eb" />
            <Text style={styles.actionText}>Search ClinVar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              handleOpenLink(`https://pubmed.ncbi.nlm.nih.gov/?term=${variant.rsid}`)
            }
          >
            <Ionicons name="library" size={20} color="#2563eb" />
            <Text style={styles.actionText}>Find Publications</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Ionicons name="information-circle" size={20} color="#6b7280" />
        <Text style={styles.disclaimerText}>
          This information is for educational purposes only and should not be used for medical
          decision-making. Always consult with a healthcare professional or genetic counselor
          for interpretation of genetic results and any health-related decisions.
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
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  rsidRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rsid: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  gene: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  significanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  significanceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  significanceDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
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
  genotypeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
  genotypeDisplay: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  genotypeText: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#2563eb',
  },
  genotypeInfo: {
    flex: 1,
  },
  zygosityBadge: {
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  zygosityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  zygosityDescription: {
    fontSize: 14,
    color: '#6b7280',
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
  allelesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  conditionText: {
    flex: 1,
  },
  conditionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991b1b',
    lineHeight: 22,
  },
  conditionNote: {
    fontSize: 12,
    color: '#b91c1c',
    marginTop: 4,
  },
  drugCard: {
    backgroundColor: '#f5f3ff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  drugHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9e3ff',
  },
  drugName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5b21b6',
  },
  drugContent: {
    padding: 16,
    paddingTop: 8,
  },
  drugRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9e3ff',
  },
  drugRowLast: {
    borderBottomWidth: 0,
  },
  drugLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  drugValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5b21b6',
  },
  drugRecommendation: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  traitCard: {
    backgroundColor: '#fdf2f8',
    borderRadius: 12,
    overflow: 'hidden',
  },
  traitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#fce7f3',
  },
  traitInfo: {
    flex: 1,
  },
  traitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9d174d',
  },
  traitCategory: {
    fontSize: 12,
    color: '#be185d',
    marginTop: 2,
  },
  traitContent: {
    padding: 16,
  },
  traitEffect: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
  confidenceBar: {
    height: 8,
    backgroundColor: '#fce7f3',
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#ec4899',
    borderRadius: 4,
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#9d174d',
    marginTop: 4,
    textAlign: 'right',
  },
  linksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  linkName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  moreLinksButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    marginTop: 8,
  },
  moreLinksText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
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
