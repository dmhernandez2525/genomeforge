/**
 * Data Export & Import Service
 *
 * Provides functionality to export and import all user data
 * for backup and portability purposes.
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as Crypto from 'expo-crypto';

export type ExportFormat = 'json' | 'encrypted';

export interface ExportOptions {
  format: ExportFormat;
  includeGenomeData: boolean;
  includeAnalysis: boolean;
  includeReports: boolean;
  includeChatHistory: boolean;
  includeFamilyData: boolean;
  includeSettings: boolean;
  password?: string; // For encrypted exports
}

export interface ExportManifest {
  version: string;
  exportedAt: string;
  format: ExportFormat;
  appVersion: string;
  checksum: string;
  contents: {
    hasGenomeData: boolean;
    hasAnalysis: boolean;
    hasReports: boolean;
    hasChatHistory: boolean;
    hasFamilyData: boolean;
    hasSettings: boolean;
  };
}

export interface ExportedData {
  manifest: ExportManifest;
  genomeData?: {
    filename: string;
    source: string;
    totalVariants: number;
    variants: { rsid: string; chromosome: string; position: number; genotype: string }[];
  };
  analysisResult?: {
    summary: {
      totalVariantsAnalyzed: number;
      clinicalFindings: number;
      drugResponses: number;
      traitAssociations: number;
      actionableFindings: number;
    };
    clinicalFindings: unknown[];
    drugResponses: unknown[];
    traitAssociations: unknown[];
  };
  reports?: {
    id: string;
    type: string;
    title: string;
    generatedAt: string;
    sections: unknown[];
  }[];
  chatSessions?: {
    id: string;
    title: string;
    messages: unknown[];
    createdAt: string;
    updatedAt: string;
  }[];
  familyMembers?: {
    id: string;
    name: string;
    relationship: string;
    hasGenomeData: boolean;
  }[];
  settings?: {
    biometricEnabled: boolean;
    provider: string;
    model: string;
    preferences: Record<string, unknown>;
  };
}

export interface ImportResult {
  success: boolean;
  error?: string;
  manifest?: ExportManifest;
  imported?: {
    genomeData: boolean;
    analysis: boolean;
    reports: number;
    chatSessions: number;
    familyMembers: number;
    settings: boolean;
  };
}

const APP_VERSION = '1.0.0';
const EXPORT_VERSION = '1.0';

/**
 * Generate a SHA-256 checksum for data
 */
async function generateChecksum(data: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, data);
}

/**
 * Simple XOR encryption for basic protection (not production-grade)
 * In a real app, use proper encryption like AES-256
 */
function xorEncrypt(data: string, password: string): string {
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(
      data.charCodeAt(i) ^ password.charCodeAt(i % password.length)
    );
  }
  return Buffer.from(result, 'binary').toString('base64');
}

function xorDecrypt(encryptedData: string, password: string): string {
  const data = Buffer.from(encryptedData, 'base64').toString('binary');
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(
      data.charCodeAt(i) ^ password.charCodeAt(i % password.length)
    );
  }
  return result;
}

/**
 * Export user data to a file
 */
export async function exportData(
  data: Omit<ExportedData, 'manifest'>,
  options: ExportOptions
): Promise<string | null> {
  try {
    // Build manifest
    const manifest: ExportManifest = {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      format: options.format,
      appVersion: APP_VERSION,
      checksum: '', // Will be computed
      contents: {
        hasGenomeData: options.includeGenomeData && !!data.genomeData,
        hasAnalysis: options.includeAnalysis && !!data.analysisResult,
        hasReports: options.includeReports && !!data.reports?.length,
        hasChatHistory: options.includeChatHistory && !!data.chatSessions?.length,
        hasFamilyData: options.includeFamilyData && !!data.familyMembers?.length,
        hasSettings: options.includeSettings && !!data.settings,
      },
    };

    // Build export data based on options
    const exportData: ExportedData = {
      manifest,
      ...(options.includeGenomeData && data.genomeData && { genomeData: data.genomeData }),
      ...(options.includeAnalysis && data.analysisResult && { analysisResult: data.analysisResult }),
      ...(options.includeReports && data.reports && { reports: data.reports }),
      ...(options.includeChatHistory && data.chatSessions && { chatSessions: data.chatSessions }),
      ...(options.includeFamilyData && data.familyMembers && { familyMembers: data.familyMembers }),
      ...(options.includeSettings && data.settings && { settings: data.settings }),
    };

    // Generate checksum
    const dataWithoutChecksum = JSON.stringify({ ...exportData, manifest: { ...manifest, checksum: '' } });
    manifest.checksum = await generateChecksum(dataWithoutChecksum);
    exportData.manifest = manifest;

    // Serialize
    let fileContent = JSON.stringify(exportData, null, 2);

    // Encrypt if requested
    if (options.format === 'encrypted' && options.password) {
      fileContent = xorEncrypt(fileContent, options.password);
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = options.format === 'encrypted' ? 'gfenc' : 'json';
    const filename = `genomeforge_backup_${timestamp}.${extension}`;
    const filePath = `${FileSystem.documentDirectory}${filename}`;

    // Write file
    await FileSystem.writeAsStringAsync(filePath, fileContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Share file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: options.format === 'encrypted' ? 'application/octet-stream' : 'application/json',
        dialogTitle: 'Export GenomeForge Data',
        UTI: options.format === 'encrypted' ? 'public.data' : 'public.json',
      });
    }

    return filePath;
  } catch (error) {
    console.error('Export failed:', error);
    return null;
  }
}

/**
 * Import user data from a file
 */
export async function importData(password?: string): Promise<ImportResult> {
  try {
    // Pick file
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', '*/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) {
      return { success: false, error: 'No file selected' };
    }

    const file = result.assets[0];

    // Read file
    let content = await FileSystem.readAsStringAsync(file.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Check if encrypted
    const isEncrypted = file.name?.endsWith('.gfenc') || !content.startsWith('{');

    if (isEncrypted) {
      if (!password) {
        return { success: false, error: 'This file is encrypted. Please provide a password.' };
      }
      try {
        content = xorDecrypt(content, password);
      } catch {
        return { success: false, error: 'Failed to decrypt file. Wrong password?' };
      }
    }

    // Parse JSON
    let data: ExportedData;
    try {
      data = JSON.parse(content);
    } catch {
      return { success: false, error: 'Invalid file format' };
    }

    // Validate manifest
    if (!data.manifest || data.manifest.version !== EXPORT_VERSION) {
      return { success: false, error: 'Incompatible export version' };
    }

    // Verify checksum
    const storedChecksum = data.manifest.checksum;
    const dataWithoutChecksum = JSON.stringify({
      ...data,
      manifest: { ...data.manifest, checksum: '' },
    });
    const computedChecksum = await generateChecksum(dataWithoutChecksum);

    if (storedChecksum !== computedChecksum) {
      return { success: false, error: 'Data integrity check failed. File may be corrupted.' };
    }

    // Return parsed data for the caller to handle actual import
    return {
      success: true,
      manifest: data.manifest,
      imported: {
        genomeData: !!data.genomeData,
        analysis: !!data.analysisResult,
        reports: data.reports?.length || 0,
        chatSessions: data.chatSessions?.length || 0,
        familyMembers: data.familyMembers?.length || 0,
        settings: !!data.settings,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Import failed',
    };
  }
}

/**
 * Get estimated export file size
 */
export function estimateExportSize(data: Omit<ExportedData, 'manifest'>): string {
  let size = 0;

  if (data.genomeData) {
    // Rough estimate: ~50 bytes per variant
    size += (data.genomeData.variants?.length || 0) * 50;
  }

  if (data.analysisResult) {
    size += JSON.stringify(data.analysisResult).length;
  }

  if (data.reports) {
    size += JSON.stringify(data.reports).length;
  }

  if (data.chatSessions) {
    size += JSON.stringify(data.chatSessions).length;
  }

  if (data.familyMembers) {
    size += JSON.stringify(data.familyMembers).length;
  }

  if (data.settings) {
    size += JSON.stringify(data.settings).length;
  }

  // Format size
  if (size < 1024) {
    return `${size} B`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  } else {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
}

/**
 * Delete exported file
 */
export async function deleteExportFile(filePath: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(filePath);
    if (info.exists) {
      await FileSystem.deleteAsync(filePath);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * List existing export files
 */
export async function listExportFiles(): Promise<
  { name: string; path: string; size: number; createdAt: Date }[]
> {
  try {
    const dir = FileSystem.documentDirectory;
    if (!dir) return [];

    const files = await FileSystem.readDirectoryAsync(dir);
    const exports: { name: string; path: string; size: number; createdAt: Date }[] = [];

    for (const file of files) {
      if (file.startsWith('genomeforge_backup_')) {
        const path = `${dir}${file}`;
        const info = await FileSystem.getInfoAsync(path);
        if (info.exists && !info.isDirectory) {
          exports.push({
            name: file,
            path,
            size: info.size || 0,
            createdAt: new Date(info.modificationTime ? info.modificationTime * 1000 : Date.now()),
          });
        }
      }
    }

    return exports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch {
    return [];
  }
}
