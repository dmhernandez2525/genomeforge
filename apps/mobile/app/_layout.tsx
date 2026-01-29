import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/store/auth';
import { useNotificationStore } from '@/store/notifications';
import { LockScreen } from '@/components/LockScreen';
import { addNotificationResponseListener, getLastNotificationResponse } from '@/services/notifications';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isAuthenticated, isLoading, biometricEnabled, initialize, checkSession } = useAuthStore();
  const { initialize: initializeNotifications, addToHistory } = useNotificationStore();

  // Initialize auth and notifications on mount
  useEffect(() => {
    const init = async () => {
      await initialize();
      await initializeNotifications();

      // Handle notification that launched the app
      const response = await getLastNotificationResponse();
      if (response) {
        const { title, body, data } = response.notification.request.content;
        addToHistory({
          type: (data?.type as string) || 'general',
          title: title || 'Notification',
          body: body || '',
          data: data as Record<string, unknown>,
        });
      }

      await SplashScreen.hideAsync();
    };
    init();
  }, [initialize, initializeNotifications, addToHistory]);

  // Handle notification responses
  useEffect(() => {
    const subscription = addNotificationResponseListener((response) => {
      const { title, body, data } = response.notification.request.content;
      addToHistory({
        type: (data?.type as string) || 'general',
        title: title || 'Notification',
        body: body || '',
        data: data as Record<string, unknown>,
      });
    });

    return () => subscription.remove();
  }, [addToHistory]);

  // Handle app state changes for re-authentication
  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && biometricEnabled) {
        // Check if session has expired when app becomes active
        checkSession();
      }
    },
    [biometricEnabled, checkSession]
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [handleAppStateChange]);

  // Show nothing while loading (splash screen is still visible)
  if (isLoading) {
    return null;
  }

  // Show lock screen if biometric is enabled and user is not authenticated
  if (biometricEnabled && !isAuthenticated) {
    return (
      <>
        <StatusBar style="dark" />
        <LockScreen />
      </>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2563eb',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="chat"
          options={{
            title: 'AI Assistant',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="variant/[rsid]"
          options={{
            title: 'Variant Details',
          }}
        />
        <Stack.Screen
          name="report/[id]"
          options={{
            title: 'Report',
          }}
        />
        <Stack.Screen
          name="family"
          options={{
            title: 'Family',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="export"
          options={{
            title: 'Export & Import',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="search"
          options={{
            title: 'Search Variants',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="notifications"
          options={{
            title: 'Notifications',
            presentation: 'modal',
          }}
        />
      </Stack>
    </>
  );
}
