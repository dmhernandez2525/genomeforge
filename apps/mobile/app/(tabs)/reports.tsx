import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAnalysisStore } from '@/store/analysis';
import { useReportsStore } from '@/store/reports';
import { generateReport, type ReportType } from '@/services/reportGenerator';

interface ReportTypeConfig {
  id: ReportType;
  name: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}

const reportTypes: ReportTypeConfig[] = [
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
  {
    id: 'traits',
    name: 'Traits',
    description: 'Genetic trait associations',
    icon: 'color-palette',
    color: '#ec4899',
  },
];

export default function ReportsScreen() {
  const router = useRouter();
  const { hasGenomeData, analysisResult, genomeData } = useAnalysisStore();
  const { reports, addReport, deleteReport } = useReportsStore();
  const [generating, setGenerating] = useState<ReportType | null>(null);

  const handleGenerateReport = async (reportType: ReportTypeConfig) => {
    if (!hasGenomeData || !analysisResult) {
      Alert.alert(
        'No Analysis Data',
        'Please upload and analyze your genetic data first.',
        [{ text: 'Upload', onPress: () => router.push('/upload') }, { text: 'Cancel' }]
      );
      return;
    }

    setGenerating(reportType.id);

    try {
      // Simulate async generation with a small delay for UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      const report = generateReport(
        reportType.id,
        analysisResult,
        genomeData?.filename || 'Unknown file'
      );

      addReport(report);

      Alert.alert(
        'Report Generated',
        `Your ${reportType.name} has been created successfully.`,
        [
          {
            text: 'View Report',
            onPress: () => router.push(`/report/${report.id}`),
          },
          { text: 'OK' },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    } finally {
      setGenerating(null);
    }
  };

  const handleViewReport = (reportId: string) => {
    router.push(`/report/${reportId}`);
  };

  const handleDeleteReport = (reportId: string, reportName: string) => {
    Alert.alert(
      'Delete Report',
      `Are you sure you want to delete "${reportName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteReport(reportId),
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getReportIcon = (type: ReportType): React.ComponentProps<typeof Ionicons>['name'] => {
    return reportTypes.find((t) => t.id === type)?.icon || 'document-text';
  };

  const getReportColor = (type: ReportType): string => {
    return reportTypes.find((t) => t.id === type)?.color || '#2563eb';
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
                <Ionicons name="sync" size={24} color="#2563eb" />
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
      {reports.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Saved Reports</Text>
            <Text style={styles.reportCount}>{reports.length} report(s)</Text>
          </View>
          <View style={styles.savedReports}>
            {reports.map((report) => (
              <TouchableOpacity
                key={report.id}
                style={styles.savedReportCard}
                onPress={() => handleViewReport(report.id)}
              >
                <View
                  style={[
                    styles.savedReportIcon,
                    { backgroundColor: getReportColor(report.type) + '20' },
                  ]}
                >
                  <Ionicons
                    name={getReportIcon(report.type)}
                    size={24}
                    color={getReportColor(report.type)}
                  />
                </View>
                <View style={styles.savedReportText}>
                  <Text style={styles.savedReportName}>{report.title}</Text>
                  <Text style={styles.savedReportDate}>
                    Generated {formatDate(report.generatedAt)}
                  </Text>
                  <View style={styles.savedReportMeta}>
                    <View style={styles.metaBadge}>
                      <Text style={styles.metaBadgeText}>
                        {report.summary.totalFindings} findings
                      </Text>
                    </View>
                    {report.summary.actionableItems > 0 && (
                      <View style={[styles.metaBadge, styles.actionableBadge]}>
                        <Text style={[styles.metaBadgeText, styles.actionableBadgeText]}>
                          {report.summary.actionableItems} actionable
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.savedReportActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleViewReport(report.id)}
                  >
                    <Ionicons name="eye-outline" size={20} color="#6b7280" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleDeleteReport(report.id, report.title)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* No Reports Yet */}
      {reports.length === 0 && (
        <View style={styles.noReportsCard}>
          <Ionicons name="documents-outline" size={32} color="#9ca3af" />
          <Text style={styles.noReportsText}>
            No reports generated yet. Select a report type above to get started.
          </Text>
        </View>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  reportCount: {
    fontSize: 14,
    color: '#6b7280',
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
    alignItems: 'flex-start',
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
  savedReportMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  metaBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaBadgeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  actionableBadge: {
    backgroundColor: '#fef2f2',
  },
  actionableBadgeText: {
    color: '#dc2626',
  },
  savedReportActions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconButton: {
    padding: 8,
  },
  noReportsCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  noReportsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
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
