import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAnalysisStore } from '@/store/analysis';
import { useReportsStore } from '@/store/reports';
import { useChatStore } from '@/store/chat';
import { useFamilyStore } from '@/store/family';
import { useAuthStore } from '@/store/auth';
import {
  exportData,
  importData,
  estimateExportSize,
  listExportFiles,
  deleteExportFile,
  type ExportFormat,
  type ExportOptions,
} from '@/services/dataExport';

interface DataCategory {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  count?: number;
  enabled: boolean;
  hasData: boolean;
}

export default function ExportScreen() {
  const { hasGenomeData, genomeData, analysisResult } = useAnalysisStore();
  const { reports } = useReportsStore();
  const { sessions } = useChatStore();
  const { members } = useFamilyStore();
  const { biometricEnabled } = useAuthStore();

  const [format, setFormat] = useState<ExportFormat>('json');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [existingExports, setExistingExports] = useState<
    { name: string; path: string; size: number; createdAt: Date }[]
  >([]);

  const [categories, setCategories] = useState<DataCategory[]>([
    {
      id: 'genomeData',
      label: 'Genome Data',
      description: 'Your uploaded DNA data',
      icon: 'fitness',
      enabled: true,
      hasData: false,
    },
    {
      id: 'analysis',
      label: 'Analysis Results',
      description: 'Clinical findings, drug responses, traits',
      icon: 'analytics',
      enabled: true,
      hasData: false,
    },
    {
      id: 'reports',
      label: 'Reports',
      description: 'Generated genetic reports',
      icon: 'document-text',
      count: 0,
      enabled: true,
      hasData: false,
    },
    {
      id: 'chatHistory',
      label: 'Chat History',
      description: 'AI assistant conversations',
      icon: 'chatbubbles',
      count: 0,
      enabled: true,
      hasData: false,
    },
    {
      id: 'familyData',
      label: 'Family Data',
      description: 'Family member information',
      icon: 'people',
      count: 0,
      enabled: true,
      hasData: false,
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'App preferences and configuration',
      icon: 'settings',
      enabled: true,
      hasData: true,
    },
  ]);

  useEffect(() => {
    // Update categories with actual data counts
    setCategories((prev) =>
      prev.map((cat) => {
        switch (cat.id) {
          case 'genomeData':
            return { ...cat, hasData: hasGenomeData };
          case 'analysis':
            return { ...cat, hasData: !!analysisResult };
          case 'reports':
            return { ...cat, count: reports.length, hasData: reports.length > 0 };
          case 'chatHistory':
            return { ...cat, count: sessions.length, hasData: sessions.length > 0 };
          case 'familyData':
            return { ...cat, count: members.length, hasData: members.length > 0 };
          default:
            return cat;
        }
      })
    );

    // Load existing exports
    loadExistingExports();
  }, [hasGenomeData, analysisResult, reports.length, sessions.length, members.length]);

  const loadExistingExports = async () => {
    const exports = await listExportFiles();
    setExistingExports(exports);
  };

  const toggleCategory = (id: string) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, enabled: !cat.enabled } : cat))
    );
  };

  const handleExport = async () => {
    if (format === 'encrypted') {
      if (!password) {
        Alert.alert('Password Required', 'Please enter a password for encrypted export');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Password Mismatch', 'Passwords do not match');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Weak Password', 'Password must be at least 6 characters');
        return;
      }
    }

    setIsExporting(true);

    try {
      const exportOptions: ExportOptions = {
        format,
        includeGenomeData: categories.find((c) => c.id === 'genomeData')?.enabled ?? false,
        includeAnalysis: categories.find((c) => c.id === 'analysis')?.enabled ?? false,
        includeReports: categories.find((c) => c.id === 'reports')?.enabled ?? false,
        includeChatHistory: categories.find((c) => c.id === 'chatHistory')?.enabled ?? false,
        includeFamilyData: categories.find((c) => c.id === 'familyData')?.enabled ?? false,
        includeSettings: categories.find((c) => c.id === 'settings')?.enabled ?? false,
        password: format === 'encrypted' ? password : undefined,
      };

      // Prepare data
      const variants: { rsid: string; chromosome: string; position: number; genotype: string }[] = [];
      if (genomeData?.variants) {
        for (const [rsid, v] of genomeData.variants.entries()) {
          variants.push({
            rsid,
            chromosome: v.chromosome,
            position: v.position,
            genotype: v.genotype,
          });
        }
      }

      const data = {
        genomeData: genomeData
          ? {
              filename: genomeData.filename,
              source: genomeData.source,
              totalVariants: genomeData.totalVariants,
              variants,
            }
          : undefined,
        analysisResult: analysisResult
          ? {
              summary: analysisResult.summary,
              clinicalFindings: analysisResult.clinicalFindings,
              drugResponses: analysisResult.drugResponses,
              traitAssociations: analysisResult.traitAssociations,
            }
          : undefined,
        reports: reports.map((r) => ({
          id: r.id,
          type: r.type,
          title: r.title,
          generatedAt: r.generatedAt,
          sections: r.sections,
        })),
        chatSessions: sessions.map((s) => ({
          id: s.id,
          title: s.title,
          messages: s.messages,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        })),
        familyMembers: members.map((m) => ({
          id: m.id,
          name: m.name,
          relationship: m.relationship,
          hasGenomeData: m.hasGenomeData,
        })),
        settings: {
          biometricEnabled,
          provider: 'openai',
          model: 'gpt-4-turbo-preview',
          preferences: {},
        },
      };

      const filePath = await exportData(data, exportOptions);

      if (filePath) {
        Alert.alert('Export Successful', 'Your data has been exported successfully.');
        loadExistingExports();
      } else {
        Alert.alert('Export Failed', 'Failed to export data. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);

    try {
      // Ask for password if needed
      Alert.prompt(
        'Import Data',
        'If the backup is encrypted, enter the password. Leave blank for unencrypted backups.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setIsImporting(false) },
          {
            text: 'Import',
            onPress: async (inputPassword) => {
              const result = await importData(inputPassword || undefined);

              if (result.success) {
                const summary = [
                  result.imported?.genomeData && 'Genome Data',
                  result.imported?.analysis && 'Analysis Results',
                  result.imported?.reports && `${result.imported.reports} Reports`,
                  result.imported?.chatSessions && `${result.imported.chatSessions} Chat Sessions`,
                  result.imported?.familyMembers && `${result.imported.familyMembers} Family Members`,
                  result.imported?.settings && 'Settings',
                ]
                  .filter(Boolean)
                  .join('\n- ');

                Alert.alert(
                  'Import Preview',
                  `The following data can be imported:\n\n- ${summary}\n\nNote: Actual data import to stores would be implemented here.`
                );
              } else {
                Alert.alert('Import Failed', result.error || 'Unknown error');
              }

              setIsImporting(false);
            },
          },
        ],
        'secure-text'
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Import failed');
      setIsImporting(false);
    }
  };

  const handleDeleteExport = (path: string, name: string) => {
    Alert.alert('Delete Export', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteExportFile(path);
          loadExistingExports();
        },
      },
    ]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Export & Import',
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Export Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Data</Text>
          <Text style={styles.sectionDescription}>
            Create a backup of your genetic data and app settings.
          </Text>

          {/* Data Categories */}
          <View style={styles.categoriesCard}>
            {categories.map((category) => (
              <View key={category.id} style={styles.categoryRow}>
                <View style={styles.categoryIcon}>
                  <Ionicons
                    name={category.icon}
                    size={20}
                    color={category.hasData ? '#2563eb' : '#9ca3af'}
                  />
                </View>
                <View style={styles.categoryInfo}>
                  <Text
                    style={[styles.categoryLabel, !category.hasData && styles.categoryLabelDisabled]}
                  >
                    {category.label}
                    {category.count !== undefined && ` (${category.count})`}
                  </Text>
                  <Text style={styles.categoryDescription}>{category.description}</Text>
                </View>
                <Switch
                  value={category.enabled && category.hasData}
                  onValueChange={() => toggleCategory(category.id)}
                  disabled={!category.hasData}
                  trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                  thumbColor={category.enabled && category.hasData ? '#2563eb' : '#f3f4f6'}
                />
              </View>
            ))}
          </View>

          {/* Format Selection */}
          <Text style={styles.fieldLabel}>Export Format</Text>
          <View style={styles.formatOptions}>
            <TouchableOpacity
              style={[styles.formatOption, format === 'json' && styles.formatOptionSelected]}
              onPress={() => setFormat('json')}
            >
              <Ionicons
                name="document-text"
                size={24}
                color={format === 'json' ? '#2563eb' : '#6b7280'}
              />
              <Text style={[styles.formatLabel, format === 'json' && styles.formatLabelSelected]}>
                JSON
              </Text>
              <Text style={styles.formatDescription}>Standard format, readable</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formatOption, format === 'encrypted' && styles.formatOptionSelected]}
              onPress={() => setFormat('encrypted')}
            >
              <Ionicons
                name="lock-closed"
                size={24}
                color={format === 'encrypted' ? '#2563eb' : '#6b7280'}
              />
              <Text
                style={[styles.formatLabel, format === 'encrypted' && styles.formatLabelSelected]}
              >
                Encrypted
              </Text>
              <Text style={styles.formatDescription}>Password protected</Text>
            </TouchableOpacity>
          </View>

          {/* Password Fields (for encrypted format) */}
          {format === 'encrypted' && (
            <View style={styles.passwordSection}>
              <View style={styles.passwordField}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.passwordInput}>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter password"
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color="#6b7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.passwordField}>
                <Text style={styles.fieldLabel}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm password"
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>
          )}

          {/* Export Button */}
          <TouchableOpacity
            style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
            onPress={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="download" size={20} color="#fff" />
                <Text style={styles.exportButtonText}>Export Data</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Import Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Import Data</Text>
          <Text style={styles.sectionDescription}>
            Restore data from a previous backup file.
          </Text>

          <TouchableOpacity
            style={[styles.importButton, isImporting && styles.importButtonDisabled]}
            onPress={handleImport}
            disabled={isImporting}
          >
            {isImporting ? (
              <ActivityIndicator color="#2563eb" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={20} color="#2563eb" />
                <Text style={styles.importButtonText}>Import from File</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Existing Exports */}
        {existingExports.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Exports</Text>
            <View style={styles.exportsCard}>
              {existingExports.map((exp) => (
                <View key={exp.path} style={styles.exportRow}>
                  <Ionicons name="document" size={20} color="#6b7280" />
                  <View style={styles.exportInfo}>
                    <Text style={styles.exportName} numberOfLines={1}>
                      {exp.name}
                    </Text>
                    <Text style={styles.exportMeta}>
                      {formatFileSize(exp.size)} • {formatDate(exp.createdAt)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteExport(exp.path, exp.name)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Ionicons name="shield-checkmark" size={20} color="#059669" />
          <Text style={styles.privacyText}>
            Exported files are saved locally. Encrypted exports provide additional protection
            for sensitive genetic data.
          </Text>
        </View>
      </ScrollView>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  categoriesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
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
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  categoryLabelDisabled: {
    color: '#9ca3af',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formatOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  formatOption: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  formatOptionSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  formatLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
  },
  formatLabelSelected: {
    color: '#2563eb',
  },
  formatDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  passwordSection: {
    gap: 12,
    marginBottom: 16,
  },
  passwordField: {
    gap: 8,
  },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
  },
  exportButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
  },
  importButtonDisabled: {
    borderColor: '#93c5fd',
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  exportsCard: {
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
  exportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  exportInfo: {
    flex: 1,
  },
  exportName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  exportMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
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
