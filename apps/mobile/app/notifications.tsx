/**
 * Notifications Screen
 *
 * Manage notification settings and view notification history.
 */

import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore, type NotificationHistoryItem } from '@/store/notifications';

type TabType = 'settings' | 'history';

export default function NotificationsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('settings');
  const {
    settings,
    permissionGranted,
    permissionCanAskAgain,
    history,
    unreadCount,
    requestPermission,
    updateSettings,
    markAsRead,
    markAllAsRead,
    clearHistory,
    removeFromHistory,
  } = useNotificationStore();

  const handleRequestPermission = async () => {
    if (!permissionCanAskAgain) {
      Alert.alert(
        'Permission Required',
        'Please enable notifications in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    const granted = await requestPermission();
    if (!granted) {
      Alert.alert(
        'Permission Denied',
        'You can enable notifications later in Settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all notification history?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearHistory },
      ]
    );
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    if (type.startsWith('analysis_')) return 'analytics';
    if (type.startsWith('report_')) return 'document-text';
    if (type.startsWith('database_')) return 'server';
    return 'notifications';
  };

  const getNotificationColor = (type: string): string => {
    if (type.includes('error')) return '#dc2626';
    if (type.startsWith('analysis_')) return '#2563eb';
    if (type.startsWith('report_')) return '#059669';
    if (type.startsWith('database_')) return '#7c3aed';
    return '#6b7280';
  };

  const renderSettingsTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Permission Status */}
      {!permissionGranted && (
        <TouchableOpacity style={styles.permissionBanner} onPress={handleRequestPermission}>
          <View style={styles.permissionIcon}>
            <Ionicons name="notifications-off" size={24} color="#dc2626" />
          </View>
          <View style={styles.permissionText}>
            <Text style={styles.permissionTitle}>Notifications Disabled</Text>
            <Text style={styles.permissionDescription}>
              Tap to enable notifications for analysis updates and more.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6b7280" />
        </TouchableOpacity>
      )}

      {/* Master Toggle */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications" size={24} color="#2563eb" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Enable Notifications</Text>
              <Text style={styles.settingDescription}>
                Master switch for all notifications
              </Text>
            </View>
          </View>
          <Switch
            value={settings.enabled}
            onValueChange={(value) => updateSettings({ enabled: value })}
            trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
            thumbColor={settings.enabled ? '#2563eb' : '#f4f4f5'}
          />
        </View>
      </View>

      {/* Notification Types */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Types</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="analytics" size={24} color="#2563eb" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Analysis Updates</Text>
              <Text style={styles.settingDescription}>
                Progress and completion of genome analysis
              </Text>
            </View>
          </View>
          <Switch
            value={settings.analysisUpdates}
            onValueChange={(value) => updateSettings({ analysisUpdates: value })}
            trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
            thumbColor={settings.analysisUpdates ? '#2563eb' : '#f4f4f5'}
            disabled={!settings.enabled}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="document-text" size={24} color="#059669" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Report Generation</Text>
              <Text style={styles.settingDescription}>
                When genetic reports are ready
              </Text>
            </View>
          </View>
          <Switch
            value={settings.reportGeneration}
            onValueChange={(value) => updateSettings({ reportGeneration: value })}
            trackColor={{ false: '#d1d5db', true: '#86efac' }}
            thumbColor={settings.reportGeneration ? '#059669' : '#f4f4f5'}
            disabled={!settings.enabled}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="server" size={24} color="#7c3aed" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Database Updates</Text>
              <Text style={styles.settingDescription}>
                Reference database sync status
              </Text>
            </View>
          </View>
          <Switch
            value={settings.databaseUpdates}
            onValueChange={(value) => updateSettings({ databaseUpdates: value })}
            trackColor={{ false: '#d1d5db', true: '#c4b5fd' }}
            thumbColor={settings.databaseUpdates ? '#7c3aed' : '#f4f4f5'}
            disabled={!settings.enabled}
          />
        </View>
      </View>

      {/* Sound & Vibration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alerts</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="volume-high" size={24} color="#6b7280" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Sound</Text>
              <Text style={styles.settingDescription}>
                Play sound for notifications
              </Text>
            </View>
          </View>
          <Switch
            value={settings.soundEnabled}
            onValueChange={(value) => updateSettings({ soundEnabled: value })}
            trackColor={{ false: '#d1d5db', true: '#9ca3af' }}
            thumbColor={settings.soundEnabled ? '#6b7280' : '#f4f4f5'}
            disabled={!settings.enabled}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="phone-portrait" size={24} color="#6b7280" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Vibration</Text>
              <Text style={styles.settingDescription}>
                Vibrate for notifications
              </Text>
            </View>
          </View>
          <Switch
            value={settings.vibrationEnabled}
            onValueChange={(value) => updateSettings({ vibrationEnabled: value })}
            trackColor={{ false: '#d1d5db', true: '#9ca3af' }}
            thumbColor={settings.vibrationEnabled ? '#6b7280' : '#f4f4f5'}
            disabled={!settings.enabled}
          />
        </View>
      </View>
    </ScrollView>
  );

  const renderHistoryTab = () => (
    <View style={styles.tabContent}>
      {/* History Header */}
      {history.length > 0 && (
        <View style={styles.historyHeader}>
          <Text style={styles.historyCount}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All read'}
          </Text>
          <View style={styles.historyActions}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.historyAction}
                onPress={markAllAsRead}
              >
                <Text style={styles.historyActionText}>Mark all read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.historyAction}
              onPress={handleClearHistory}
            >
              <Text style={[styles.historyActionText, styles.historyActionDanger]}>
                Clear
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Notification List */}
      <ScrollView style={styles.historyList}>
        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyDescription}>
              Your notification history will appear here.
            </Text>
          </View>
        ) : (
          history.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onPress={() => markAsRead(notification.id)}
              onDelete={() => removeFromHistory(notification.id)}
              formatDate={formatDate}
              getIcon={getNotificationIcon}
              getColor={getNotificationColor}
            />
          ))
        )}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Ionicons
            name="settings"
            size={20}
            color={activeTab === 'settings' ? '#2563eb' : '#6b7280'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'settings' && styles.tabTextActive,
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <View style={styles.tabWithBadge}>
            <Ionicons
              name="time"
              size={20}
              color={activeTab === 'history' ? '#2563eb' : '#6b7280'}
            />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.tabText,
              activeTab === 'history' && styles.tabTextActive,
            ]}
          >
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'settings' ? renderSettingsTab() : renderHistoryTab()}
    </View>
  );
}

interface NotificationCardProps {
  notification: NotificationHistoryItem;
  onPress: () => void;
  onDelete: () => void;
  formatDate: (date: string) => string;
  getIcon: (type: string) => keyof typeof Ionicons.glyphMap;
  getColor: (type: string) => string;
}

function NotificationCard({
  notification,
  onPress,
  onDelete,
  formatDate,
  getIcon,
  getColor,
}: NotificationCardProps) {
  const handleDelete = () => {
    Alert.alert(
      'Delete Notification',
      'Remove this notification from history?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.notificationCard, !notification.read && styles.notificationCardUnread]}
      onPress={onPress}
      onLongPress={handleDelete}
    >
      <View
        style={[
          styles.notificationIcon,
          { backgroundColor: getColor(notification.type) + '20' },
        ]}
      >
        <Ionicons
          name={getIcon(notification.type)}
          size={24}
          color={getColor(notification.type)}
        />
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.notificationTime}>
            {formatDate(notification.receivedAt)}
          </Text>
        </View>
        <Text style={styles.notificationBody} numberOfLines={2}>
          {notification.body}
        </Text>
      </View>
      {!notification.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2563eb',
  },
  tabWithBadge: {
    position: 'relative',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#2563eb',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
  },
  permissionBanner: {
    backgroundColor: '#fef2f2',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    gap: 12,
  },
  permissionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionText: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 2,
  },
  permissionDescription: {
    fontSize: 12,
    color: '#b91c1c',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  settingRow: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  settingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  historyCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  historyActions: {
    flexDirection: 'row',
    gap: 16,
  },
  historyAction: {
    padding: 4,
  },
  historyActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563eb',
  },
  historyActionDanger: {
    color: '#dc2626',
  },
  historyList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  notificationCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 12,
  },
  notificationCardUnread: {
    backgroundColor: '#eff6ff',
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  notificationBody: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563eb',
    marginTop: 4,
  },
});
