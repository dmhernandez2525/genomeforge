import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAnalysisStore } from '@/store/analysis';

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}

const reportTypes: ReportType[] = [
  {
    id: 'summary',
    name: 'Summary Report',
    description: 'Overview of all genetic findings',
    icon: 'document-text',
    color: '#2563eb',
  },
  {
    id: 'health',
    name: 'Health Risks',
    description: 'Detailed health risk assessment',
    icon: 'fitness',
    color: '#dc2626',
  },
  {
    id: 'pharma',
    name: 'Drug Response',
    description: 'Pharmacogenomic insights',
    icon: 'medkit',
    color: '#7c3aed',
  },
  {
    id: 'carrier',
    name: 'Carrier Status',
    description: 'Inherited condition carrier screening',
    icon: 'people',
    color: '#059669',
  },
];

interface SavedReport {
  id: string;
  type: string;
  name: string;
  generatedAt: string;
}

export default function ReportsScreen() {
  const router = useRouter();
  const { hasGenomeData, analysisResult } = useAnalysisStore();
  const [generating, setGenerating] = useState<string | null>(null);

  // Mock saved reports
  const savedReports: SavedReport[] = [
    { id: '1', type: 'summary', name: 'Summary Report', generatedAt: '2024-01-28' },
    { id: '2', type: 'health', name: 'Health Risks Report', generatedAt: '2024-01-27' },
  ];

  const handleGenerateReport = async (reportType: ReportType) => {
    if (!hasGenomeData) {
      router.push('/upload');
      return;
    }

    setGenerating(reportType.id);

    // Simulate report generation
    setTimeout(() => {
      setGenerating(null);
      // Navigate to report view
    }, 2000);
  };

  if (!hasGenomeData) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
        </View>
        <Text style={styles.emptyTitle}>No Data Available</Text>
        <Text style={styles.emptyDescription}>
          Upload your genetic data to generate reports
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Generate New Report */}
      <Text style={styles.sectionTitle}>Generate Report</Text>
      <View style={styles.reportTypesGrid}>
        {reportTypes.map((reportType) => (
          <TouchableOpacity
            key={reportType.id}
            style={styles.reportTypeCard}
            onPress={() => handleGenerateReport(reportType)}
            disabled={generating !== null}
          >
            {generating === reportType.id ? (
              <View style={styles.generatingOverlay}>
                <Ionicons name="refresh" size={24} color="#2563eb" />
                <Text style={styles.generatingText}>Generating...</Text>
              </View>
            ) : (
              <>
                <View
                  style={[
                    styles.reportTypeIcon,
                    { backgroundColor: reportType.color + '20' },
                  ]}
                >
                  <Ionicons name={reportType.icon} size={28} color={reportType.color} />
                </View>
                <Text style={styles.reportTypeName}>{reportType.name}</Text>
                <Text style={styles.reportTypeDescription}>
                  {reportType.description}
                </Text>
              </>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Saved Reports */}
      {savedReports.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Saved Reports</Text>
          <View style={styles.savedReports}>
            {savedReports.map((report) => (
              <TouchableOpacity key={report.id} style={styles.savedReportCard}>
                <View style={styles.savedReportIcon}>
                  <Ionicons
                    name={
                      reportTypes.find((t) => t.id === report.type)?.icon ||
                      'document-text'
                    }
                    size={24}
                    color="#2563eb"
                  />
                </View>
                <View style={styles.savedReportText}>
                  <Text style={styles.savedReportName}>{report.name}</Text>
                  <Text style={styles.savedReportDate}>
                    Generated {report.generatedAt}
                  </Text>
                </View>
                <View style={styles.savedReportActions}>
                  <TouchableOpacity style={styles.iconButton}>
                    <Ionicons name="share-outline" size={20} color="#6b7280" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconButton}>
                    <Ionicons name="download-outline" size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Privacy Notice */}
      <View style={styles.privacyCard}>
        <Ionicons name="shield-checkmark" size={24} color="#059669" />
        <View style={styles.privacyText}>
          <Text style={styles.privacyTitle}>Private Reports</Text>
          <Text style={styles.privacyDescription}>
            All reports are generated and stored locally on your device. They are never
            uploaded to external servers.
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  reportTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  reportTypeCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    minHeight: 140,
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
  reportTypeIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  reportTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  reportTypeDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
  },
  generatingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generatingText: {
    fontSize: 14,
    color: '#2563eb',
    marginTop: 8,
  },
  savedReports: {
    gap: 12,
    marginBottom: 24,
  },
  savedReportCard: {
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
  savedReportIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedReportText: {
    flex: 1,
  },
  savedReportName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  savedReportDate: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  savedReportActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
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
