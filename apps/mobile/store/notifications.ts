/**
 * Notification Store
 *
 * Zustand store for managing notification state and settings.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NotificationSettings } from '@/services/notifications';
import {
  loadSettings,
  saveSettings,
  requestPermissions,
  checkPermissions,
  configureNotifications,
  setupNotificationChannels,
  clearBadge,
} from '@/services/notifications';

export interface NotificationHistoryItem {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  receivedAt: string;
  read: boolean;
}

interface NotificationState {
  // State
  settings: NotificationSettings;
  permissionGranted: boolean;
  permissionCanAskAgain: boolean;
  isInitialized: boolean;
  history: NotificationHistoryItem[];
  unreadCount: number;

  // Actions
  initialize: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  updateSettings: (updates: Partial<NotificationSettings>) => Promise<void>;
  addToHistory: (notification: Omit<NotificationHistoryItem, 'id' | 'receivedAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearHistory: () => void;
  removeFromHistory: (id: string) => void;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  analysisUpdates: true,
  reportGeneration: true,
  databaseUpdates: true,
  soundEnabled: true,
  vibrationEnabled: true,
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      // Initial state
      settings: DEFAULT_SETTINGS,
      permissionGranted: false,
      permissionCanAskAgain: true,
      isInitialized: false,
      history: [],
      unreadCount: 0,

      // Initialize notification system
      initialize: async () => {
        try {
          // Configure notification handler
          configureNotifications();

          // Set up Android channels
          await setupNotificationChannels();

          // Check current permission status
          const { granted, canAskAgain } = await checkPermissions();

          // Load saved settings
          const settings = await loadSettings();

          set({
            permissionGranted: granted,
            permissionCanAskAgain: canAskAgain,
            settings,
            isInitialized: true,
          });
        } catch (error) {
          console.error('Failed to initialize notifications:', error);
          set({ isInitialized: true });
        }
      },

      // Request notification permission
      requestPermission: async () => {
        const granted = await requestPermissions();
        const { canAskAgain } = await checkPermissions();

        set({
          permissionGranted: granted,
          permissionCanAskAgain: canAskAgain,
        });

        return granted;
      },

      // Update notification settings
      updateSettings: async (updates) => {
        const currentSettings = get().settings;
        const newSettings = { ...currentSettings, ...updates };

        await saveSettings(newSettings);
        set({ settings: newSettings });
      },

      // Add notification to history
      addToHistory: (notification) => {
        const { history } = get();
        const newItem: NotificationHistoryItem = {
          ...notification,
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          receivedAt: new Date().toISOString(),
          read: false,
        };

        // Keep only last 100 notifications
        const updatedHistory = [newItem, ...history].slice(0, 100);
        const unreadCount = updatedHistory.filter((n) => !n.read).length;

        set({ history: updatedHistory, unreadCount });
      },

      // Mark a notification as read
      markAsRead: (id) => {
        const { history } = get();
        const updatedHistory = history.map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
        const unreadCount = updatedHistory.filter((n) => !n.read).length;

        set({ history: updatedHistory, unreadCount });

        // Update badge
        if (unreadCount === 0) {
          clearBadge();
        }
      },

      // Mark all notifications as read
      markAllAsRead: () => {
        const { history } = get();
        const updatedHistory = history.map((n) => ({ ...n, read: true }));

        set({ history: updatedHistory, unreadCount: 0 });
        clearBadge();
      },

      // Clear notification history
      clearHistory: () => {
        set({ history: [], unreadCount: 0 });
        clearBadge();
      },

      // Remove a notification from history
      removeFromHistory: (id) => {
        const { history } = get();
        const updatedHistory = history.filter((n) => n.id !== id);
        const unreadCount = updatedHistory.filter((n) => !n.read).length;

        set({ history: updatedHistory, unreadCount });
      },
    }),
    {
      name: 'genomeforge-notifications',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        settings: state.settings,
        history: state.history,
        unreadCount: state.unreadCount,
      }),
    }
  )
);
