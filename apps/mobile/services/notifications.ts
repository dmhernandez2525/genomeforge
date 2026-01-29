/**
 * Notification Service
 *
 * Handles local notifications for analysis updates, report generation,
 * and database sync status.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for notification settings
const NOTIFICATION_SETTINGS_KEY = 'genomeforge_notification_settings';

// Notification channel IDs (Android)
export const NotificationChannels = {
  ANALYSIS: 'analysis',
  REPORTS: 'reports',
  DATABASE: 'database',
  GENERAL: 'general',
} as const;

export type NotificationChannelId = (typeof NotificationChannels)[keyof typeof NotificationChannels];

export interface NotificationSettings {
  enabled: boolean;
  analysisUpdates: boolean;
  reportGeneration: boolean;
  databaseUpdates: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface NotificationPayload {
  type: 'analysis_started' | 'analysis_complete' | 'analysis_error' |
        'report_ready' | 'report_error' |
        'database_updated' | 'database_error' |
        'general';
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface ScheduledNotification {
  identifier: string;
  type: NotificationPayload['type'];
  scheduledAt: Date;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  analysisUpdates: true,
  reportGeneration: true,
  databaseUpdates: true,
  soundEnabled: true,
  vibrationEnabled: true,
};

// Track scheduled notifications
const scheduledNotifications: ScheduledNotification[] = [];

/**
 * Configure notification handler behavior
 */
export function configureNotifications(): void {
  // Set notification handler for foreground notifications
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Set up Android notification channels
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Promise.all([
    Notifications.setNotificationChannelAsync(NotificationChannels.ANALYSIS, {
      name: 'Analysis Updates',
      description: 'Notifications about genome analysis progress and completion',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563eb',
    }),
    Notifications.setNotificationChannelAsync(NotificationChannels.REPORTS, {
      name: 'Report Generation',
      description: 'Notifications when reports are ready',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#059669',
    }),
    Notifications.setNotificationChannelAsync(NotificationChannels.DATABASE, {
      name: 'Database Updates',
      description: 'Notifications about database sync status',
      importance: Notifications.AndroidImportance.LOW,
      lightColor: '#7c3aed',
    }),
    Notifications.setNotificationChannelAsync(NotificationChannels.GENERAL, {
      name: 'General',
      description: 'General app notifications',
      importance: Notifications.AndroidImportance.DEFAULT,
    }),
  ]);
}

/**
 * Request notification permissions
 */
export async function requestPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

/**
 * Check if notifications are permitted
 */
export async function checkPermissions(): Promise<{
  granted: boolean;
  canAskAgain: boolean;
}> {
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  return {
    granted: status === 'granted',
    canAskAgain: canAskAgain ?? false,
  };
}

/**
 * Load notification settings from storage
 */
export async function loadSettings(): Promise<NotificationSettings> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    console.warn('Failed to load notification settings');
  }
  return DEFAULT_SETTINGS;
}

/**
 * Save notification settings to storage
 */
export async function saveSettings(settings: NotificationSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    console.error('Failed to save notification settings');
    throw new Error('Failed to save notification settings');
  }
}

/**
 * Get the appropriate channel for a notification type
 */
function getChannelForType(type: NotificationPayload['type']): NotificationChannelId {
  if (type.startsWith('analysis_')) return NotificationChannels.ANALYSIS;
  if (type.startsWith('report_')) return NotificationChannels.REPORTS;
  if (type.startsWith('database_')) return NotificationChannels.DATABASE;
  return NotificationChannels.GENERAL;
}

/**
 * Check if a notification type is enabled in settings
 */
function isNotificationTypeEnabled(
  type: NotificationPayload['type'],
  settings: NotificationSettings
): boolean {
  if (!settings.enabled) return false;

  if (type.startsWith('analysis_')) return settings.analysisUpdates;
  if (type.startsWith('report_')) return settings.reportGeneration;
  if (type.startsWith('database_')) return settings.databaseUpdates;

  return true;
}

/**
 * Send an immediate notification
 */
export async function sendNotification(payload: NotificationPayload): Promise<string | null> {
  const settings = await loadSettings();

  if (!isNotificationTypeEnabled(payload.type, settings)) {
    return null;
  }

  const channel = getChannelForType(payload.type);

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: payload.title,
      body: payload.body,
      data: { type: payload.type, ...payload.data },
      sound: settings.soundEnabled ? 'default' : undefined,
      vibrate: settings.vibrationEnabled ? [0, 250, 250, 250] : undefined,
    },
    trigger: null, // Immediate
    ...(Platform.OS === 'android' && { channelId: channel }),
  });

  return identifier;
}

/**
 * Schedule a notification for later
 */
export async function scheduleNotification(
  payload: NotificationPayload,
  delaySeconds: number
): Promise<string | null> {
  const settings = await loadSettings();

  if (!isNotificationTypeEnabled(payload.type, settings)) {
    return null;
  }

  const channel = getChannelForType(payload.type);

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: payload.title,
      body: payload.body,
      data: { type: payload.type, ...payload.data },
      sound: settings.soundEnabled ? 'default' : undefined,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delaySeconds,
    },
    ...(Platform.OS === 'android' && { channelId: channel }),
  });

  scheduledNotifications.push({
    identifier,
    type: payload.type,
    scheduledAt: new Date(Date.now() + delaySeconds * 1000),
  });

  return identifier;
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier);

  const index = scheduledNotifications.findIndex((n) => n.identifier === identifier);
  if (index !== -1) {
    scheduledNotifications.splice(index, 1);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  scheduledNotifications.length = 0;
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications(): Promise<ScheduledNotification[]> {
  return [...scheduledNotifications];
}

/**
 * Clear the app badge count
 */
export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

/**
 * Set the app badge count
 */
export async function setBadge(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

// Convenience functions for common notification types

/**
 * Notify when analysis starts
 */
export async function notifyAnalysisStarted(variantCount: number): Promise<string | null> {
  return sendNotification({
    type: 'analysis_started',
    title: 'Analysis Started',
    body: `Analyzing ${variantCount.toLocaleString()} genetic variants...`,
    data: { variantCount },
  });
}

/**
 * Notify when analysis completes
 */
export async function notifyAnalysisComplete(
  findingsCount: number,
  duration?: number
): Promise<string | null> {
  const durationText = duration ? ` in ${(duration / 1000).toFixed(1)}s` : '';
  return sendNotification({
    type: 'analysis_complete',
    title: 'Analysis Complete',
    body: `Found ${findingsCount} notable findings${durationText}. Tap to view results.`,
    data: { findingsCount, duration },
  });
}

/**
 * Notify when analysis fails
 */
export async function notifyAnalysisError(error: string): Promise<string | null> {
  return sendNotification({
    type: 'analysis_error',
    title: 'Analysis Error',
    body: error,
    data: { error },
  });
}

/**
 * Notify when a report is ready
 */
export async function notifyReportReady(
  reportType: string,
  reportId: string
): Promise<string | null> {
  return sendNotification({
    type: 'report_ready',
    title: 'Report Ready',
    body: `Your ${reportType} report is ready to view.`,
    data: { reportType, reportId },
  });
}

/**
 * Notify when report generation fails
 */
export async function notifyReportError(reportType: string, error: string): Promise<string | null> {
  return sendNotification({
    type: 'report_error',
    title: 'Report Generation Failed',
    body: `Could not generate ${reportType} report: ${error}`,
    data: { reportType, error },
  });
}

/**
 * Notify when database is updated
 */
export async function notifyDatabaseUpdated(
  databaseName: string,
  recordCount?: number
): Promise<string | null> {
  const countText = recordCount ? ` (${recordCount.toLocaleString()} records)` : '';
  return sendNotification({
    type: 'database_updated',
    title: 'Database Updated',
    body: `${databaseName} database has been updated${countText}.`,
    data: { databaseName, recordCount },
  });
}

/**
 * Notify when database update fails
 */
export async function notifyDatabaseError(databaseName: string, error: string): Promise<string | null> {
  return sendNotification({
    type: 'database_error',
    title: 'Database Error',
    body: `Failed to update ${databaseName}: ${error}`,
    data: { databaseName, error },
  });
}

/**
 * Add a notification response listener
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Add a notification received listener (foreground)
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Get the last notification response (for handling app launch from notification)
 */
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  return Notifications.getLastNotificationResponseAsync();
}
