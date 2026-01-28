import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAnalysisStore } from '@/store/analysis';

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
  const { setGenomeData, hasGenomeData } = useAnalysisStore();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'application/x-gzip', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      setSelectedFile(file.name);
      setUploading(true);
      setUploadProgress(0);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Read file content
      const content = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Store genome data (basic validation)
      if (content.length < 100) {
        throw new Error('File appears to be empty or too small');
      }

      // Set genome data in store
      setGenomeData({
        source: detectFileFormat(file.name),
        filename: file.name,
        variantCount: estimateVariantCount(content),
        uploadedAt: new Date().toISOString(),
      });

      // Small delay to show completion
      setTimeout(() => {
        setUploading(false);
        setSelectedFile(null);
        Alert.alert(
          'Success',
          'Your genetic data has been loaded successfully.',
          [
            {
              text: 'View Analysis',
              onPress: () => router.push('/analysis'),
            },
            { text: 'OK' },
          ]
        );
      }, 500);
    } catch (error) {
      setUploading(false);
      setSelectedFile(null);
      Alert.alert(
        'Upload Failed',
        error instanceof Error ? error.message : 'Failed to process file'
      );
    }
  };

  const detectFileFormat = (filename: string): string => {
    const lower = filename.toLowerCase();
    if (lower.includes('23andme')) return '23andMe';
    if (lower.includes('ancestry')) return 'AncestryDNA';
    if (lower.endsWith('.vcf') || lower.endsWith('.vcf.gz')) return 'VCF';
    return 'Unknown';
  };

  const estimateVariantCount = (content: string): number => {
    // Simple estimation based on line count (excluding headers)
    const lines = content.split('\n').filter((l) => l && !l.startsWith('#'));
    return lines.length;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Current Status */}
      {hasGenomeData && (
        <View style={styles.statusCard}>
          <Ionicons name="checkmark-circle" size={24} color="#059669" />
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>DNA Data Loaded</Text>
            <Text style={styles.statusDescription}>
              You can upload new data to replace the existing file.
            </Text>
          </View>
        </View>
      )}

      {/* Upload Area */}
      <TouchableOpacity
        style={[styles.uploadArea, uploading && styles.uploadAreaActive]}
        onPress={handleFilePick}
        disabled={uploading}
      >
        {uploading ? (
          <View style={styles.uploadingContent}>
            <Ionicons name="cloud-upload" size={48} color="#2563eb" />
            <Text style={styles.uploadingTitle}>Processing {selectedFile}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{uploadProgress}%</Text>
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

      {/* Supported Formats */}
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
  uploadingContent: {
    alignItems: 'center',
    width: '100%',
  },
  uploadingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2563eb',
    marginTop: 16,
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
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
