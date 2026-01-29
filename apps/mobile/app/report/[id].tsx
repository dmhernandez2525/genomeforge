import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Share,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useReportsStore } from '@/store/reports';
import {
  formatReportAsText,
  formatReportAsHTML,
  type ReportSection,
  type ReportItem,
} from '@/services/reportGenerator';

const severityColors: Record<string, { bg: string; border: string }> = {
  info: { bg: '#eff6ff', border: '#3b82f6' },
  low: { bg: '#f9fafb', border: '#9ca3af' },
  medium: { bg: '#fffbeb', border: '#f59e0b' },
  high: { bg: '#fef2f2', border: '#dc2626' },
};

const riskLevelConfig = {
  low: { color: '#059669', bg: '#ecfdf5', text: 'Low Risk' },
  moderate: { color: '#f59e0b', bg: '#fffbeb', text: 'Moderate Risk' },
  elevated: { color: '#dc2626', bg: '#fef2f2', text: 'Elevated Risk' },
};

export default function ReportViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getReport, deleteReport } = useReportsStore();

  const report = getReport(id || '');

  if (!report) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ title: 'Report Not Found' }} />
        <Ionicons name="alert-circle" size={64} color="#dc2626" />
        <Text style={styles.errorTitle}>Report Not Found</Text>
        <Text style={styles.errorMessage}>
          The requested report could not be found.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleShare = async () => {
    try {
      const textContent = formatReportAsText(report);
      await Share.share({
        message: textContent,
        title: report.title,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share report');
    }
  };

  const handleExportHTML = async () => {
    try {
      const htmlContent = formatReportAsHTML(report);
      const filename = `${report.title.replace(/\s+/g, '_')}_${report.id}.html`;
      const filePath = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(filePath, htmlContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/html',
          dialogTitle: 'Export Report',
        });
      } else {
        Alert.alert('Success', `Report saved to ${filename}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export report');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Report',
      'Are you sure you want to delete this report? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteReport(report.id);
            router.back();
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const riskConfig = riskLevelConfig[report.summary.riskLevel];

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: report.title,
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
                <Ionicons name="share-outline" size={24} color="#2563eb" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
                <Ionicons name="trash-outline" size={24} color="#dc2626" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Report Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{report.title}</Text>
          <Text style={styles.subtitle}>{report.subtitle}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            <Text style={styles.metaText}>{formatDate(report.generatedAt)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="document-outline" size={16} color="#6b7280" />
            <Text style={styles.metaText}>{report.genomeFilename}</Text>
          </View>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Report Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{report.summary.totalFindings}</Text>
              <Text style={styles.summaryLabel}>Total Findings</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{report.summary.actionableItems}</Text>
              <Text style={styles.summaryLabel}>Actionable</Text>
            </View>
            <View style={[styles.summaryItem, styles.riskItem, { backgroundColor: riskConfig.bg }]}>
              <Text style={[styles.summaryValue, { color: riskConfig.color }]}>
                {riskConfig.text}
              </Text>
              <Text style={styles.summaryLabel}>Risk Level</Text>
            </View>
          </View>
        </View>

        {/* Report Sections */}
        {report.sections.map((section, index) => (
          <ReportSectionView key={index} section={section} />
        ))}

        {/* Export Actions */}
        <View style={styles.exportSection}>
          <Text style={styles.exportTitle}>Export Options</Text>
          <View style={styles.exportButtons}>
            <TouchableOpacity style={styles.exportButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color="#2563eb" />
              <Text style={styles.exportButtonText}>Share as Text</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportButton} onPress={handleExportHTML}>
              <Ionicons name="code-outline" size={20} color="#2563eb" />
              <Text style={styles.exportButtonText}>Export HTML</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Ionicons name="shield-checkmark" size={20} color="#059669" />
          <Text style={styles.privacyText}>
            This report was generated locally on your device. Your genetic data has not
            been shared with any external servers.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function ReportSectionView({ section }: { section: ReportSection }) {
  const severityStyle = section.severity ? severityColors[section.severity] : null;

  return (
    <View
      style={[
        styles.section,
        severityStyle && {
          backgroundColor: severityStyle.bg,
          borderLeftWidth: 4,
          borderLeftColor: severityStyle.border,
        },
      ]}
    >
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionContent}>{section.content}</Text>

      {section.items && section.items.length > 0 && (
        <View style={styles.itemsList}>
          {section.items.map((item, index) => (
            <ReportItemView key={index} item={item} />
          ))}
        </View>
      )}
    </View>
  );
}

function ReportItemView({ item }: { item: ReportItem }) {
  return (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemLabel}>{item.label}</Text>
        {item.badge && (
          <View style={[styles.badge, { backgroundColor: item.badge.color }]}>
            <Text style={styles.badgeText}>{item.badge.text}</Text>
          </View>
        )}
      </View>
      <Text style={styles.itemValue}>{item.value}</Text>
      {item.detail && <Text style={styles.itemDetail}>{item.detail}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 24,
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
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
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  riskItem: {
    flex: 1.5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
  },
  itemsList: {
    marginTop: 16,
    gap: 12,
  },
  item: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  itemValue: {
    fontSize: 14,
    color: '#374151',
  },
  itemDetail: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  exportSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  exportButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  exportButton: {
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
    paddingHorizontal: 16,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 16,
  },
  privacyText: {
    flex: 1,
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
});
