import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useAnalysisStore } from '@/store/analysis';
import { useGenomeProcessing } from '@/hooks/useGenomeProcessing';
import {
  notifyAnalysisStarted,
  notifyAnalysisComplete,
  notifyAnalysisError,
} from '@/services/notifications';

interface FileFormat {
  id: string;
  name: string;
  extensions: string[];
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

const supportedFormats: FileFormat[] = [
  {
    id: '23andme',
    name: '23andMe',
    extensions: ['.txt', '.txt.gz'],
    description: 'Raw data export from 23andMe',
    icon: 'flask',
  },
  {
    id: 'ancestry',
    name: 'AncestryDNA',
    extensions: ['.txt', '.txt.gz'],
    description: 'Raw data export from AncestryDNA',
    icon: 'people',
  },
  {
    id: 'vcf',
    name: 'VCF Format',
    extensions: ['.vcf', '.vcf.gz'],
    description: 'Variant Call Format files',
    icon: 'code',
  },
];

export default function UploadScreen() {
  const router = useRouter();
  const { hasGenomeData, genomeData } = useAnalysisStore();
  const { state, processFile, reset } = useGenomeProcessing();

  const handleFilePick = async () => {
    const startTime = Date.now();

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'application/x-gzip', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];

      // Send notification that analysis is starting
      await notifyAnalysisStarted(0); // We don't know the count yet

      // Process the file using our genome processing hook
      const processingResult = await processFile(file.uri, file.name);

      if (processingResult.analysis) {
        const duration = Date.now() - startTime;
        const findingsCount = processingResult.analysis.summary.actionableFindings;

        // Send notification that analysis is complete
        await notifyAnalysisComplete(findingsCount, duration);

        Alert.alert(
          'Processing Complete',
          `Successfully analyzed ${processingResult.genome?.totalVariants.toLocaleString()} variants.\n\nFound ${findingsCount} actionable findings.`,
          [
            {
              text: 'View Analysis',
              onPress: () => router.push('/analysis'),
            },
            { text: 'OK' },
          ]
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file';

      // Send error notification
      await notifyAnalysisError(errorMessage);

      Alert.alert('Processing Failed', errorMessage);
    }
  };

  const handleRetry = () => {
    reset();
    handleFilePick();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Current Status */}
      {hasGenomeData && !state.isProcessing && (
        <View style={styles.statusCard}>
          <Ionicons name="checkmark-circle" size={24} color="#059669" />
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>DNA Data Loaded</Text>
            <Text style={styles.statusDescription}>
              {genomeData?.filename} ({genomeData?.variantCount?.toLocaleString()} variants)
            </Text>
          </View>
        </View>
      )}

      {/* Error State */}
      {state.error && (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle" size={24} color="#dc2626" />
          <View style={styles.errorText}>
            <Text style={styles.errorTitle}>Processing Failed</Text>
            <Text style={styles.errorDescription}>{state.error}</Text>
          </View>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Upload Area */}
      <TouchableOpacity
        style={[styles.uploadArea, state.isProcessing && styles.uploadAreaActive]}
        onPress={handleFilePick}
        disabled={state.isProcessing}
      >
        {state.isProcessing ? (
          <View style={styles.processingContent}>
            <View style={styles.processingIconContainer}>
              <Ionicons
                name={state.stage === 'parsing' ? 'document-text' : 'analytics'}
                size={40}
                color="#2563eb"
              />
            </View>
            <Text style={styles.processingTitle}>
              {state.stage === 'parsing' ? 'Parsing Genome' : 'Analyzing Variants'}
            </Text>
            <Text style={styles.processingMessage}>{state.message}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${state.progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{state.progress}%</Text>
          </View>
        ) : (
          <View style={styles.uploadContent}>
            <View style={styles.uploadIconContainer}>
              <Ionicons name="cloud-upload" size={48} color="#2563eb" />
            </View>
            <Text style={styles.uploadTitle}>Upload Your DNA Data</Text>
            <Text style={styles.uploadDescription}>
              Tap to select a file from your device
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Processing Stages */}
      {state.isProcessing && (
        <View style={styles.stagesContainer}>
          <Text style={styles.stagesTitle}>Processing Stages</Text>
          <View style={styles.stagesList}>
            <StageItem
              title="Parse File"
              description="Reading and parsing variant data"
              active={state.stage === 'parsing'}
              complete={state.stage === 'analyzing' || state.stage === 'complete'}
            />
            <StageItem
              title="Clinical Analysis"
              description="Matching against ClinVar database"
              active={state.stage === 'analyzing' && state.progress < 70}
              complete={state.progress >= 70 || state.stage === 'complete'}
            />
            <StageItem
              title="Pharmacogenomics"
              description="Checking drug interactions"
              active={state.stage === 'analyzing' && state.progress >= 70 && state.progress < 85}
              complete={state.progress >= 85 || state.stage === 'complete'}
            />
            <StageItem
              title="Traits"
              description="Finding trait associations"
              active={state.stage === 'analyzing' && state.progress >= 85}
              complete={state.stage === 'complete'}
            />
          </View>
        </View>
      )}

      {/* Supported Formats */}
      {!state.isProcessing && (
        <>
          <Text style={styles.sectionTitle}>Supported Formats</Text>
          <View style={styles.formatsGrid}>
            {supportedFormats.map((format) => (
              <View key={format.id} style={styles.formatCard}>
                <Ionicons name={format.icon} size={24} color="#2563eb" />
                <View style={styles.formatText}>
                  <Text style={styles.formatName}>{format.name}</Text>
                  <Text style={styles.formatDescription}>{format.description}</Text>
                  <Text style={styles.formatExtensions}>
                    {format.extensions.join(', ')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Privacy Notice */}
      <View style={styles.privacyNotice}>
        <Ionicons name="lock-closed" size={20} color="#059669" />
        <Text style={styles.privacyText}>
          Your genetic data is processed entirely on your device. Nothing is uploaded to
          external servers.
        </Text>
      </View>
    </ScrollView>
  );
}

function StageItem({
  title,
  description,
  active,
  complete,
}: {
  title: string;
  description: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <View style={[styles.stageItem, active && styles.stageItemActive]}>
      <View
        style={[
          styles.stageIcon,
          active && styles.stageIconActive,
          complete && styles.stageIconComplete,
        ]}
      >
        {complete ? (
          <Ionicons name="checkmark" size={16} color="#fff" />
        ) : active ? (
          <View style={styles.stageIconDot} />
        ) : (
          <View style={styles.stageIconEmpty} />
        )}
      </View>
      <View style={styles.stageText}>
        <Text style={[styles.stageTitle, (active || complete) && styles.stageTitleActive]}>
          {title}
        </Text>
        <Text style={styles.stageDescription}>{description}</Text>
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
    padding: 16,
    paddingBottom: 32,
  },
  statusCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065f46',
  },
  statusDescription: {
    fontSize: 14,
    color: '#047857',
    marginTop: 2,
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991b1b',
  },
  errorDescription: {
    fontSize: 14,
    color: '#dc2626',
    marginTop: 2,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  uploadArea: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    padding: 32,
    alignItems: 'center',
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
  uploadAreaActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  uploadContent: {
    alignItems: 'center',
  },
  uploadIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  uploadDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  processingContent: {
    alignItems: 'center',
    width: '100%',
  },
  processingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  processingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  processingMessage: {
    fontSize: 14,
    color: '#3b82f6',
    marginBottom: 16,
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#dbeafe',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  stagesContainer: {
    marginBottom: 24,
  },
  stagesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  stagesList: {
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
  stageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  stageItemActive: {
    backgroundColor: '#eff6ff',
  },
  stageIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageIconActive: {
    backgroundColor: '#2563eb',
  },
  stageIconComplete: {
    backgroundColor: '#059669',
  },
  stageIconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  stageIconEmpty: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9ca3af',
  },
  stageText: {
    flex: 1,
  },
  stageTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  stageTitleActive: {
    color: '#111827',
  },
  stageDescription: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  formatsGrid: {
    gap: 12,
    marginBottom: 24,
  },
  formatCard: {
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
  formatText: {
    flex: 1,
  },
  formatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  formatDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  formatExtensions: {
    fontSize: 12,
    color: '#9ca3af',
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
