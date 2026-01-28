import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/store/auth';
import { LockScreen } from '@/components/LockScreen';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isAuthenticated, isLoading, biometricEnabled, initialize, checkSession } = useAuthStore();

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      await initialize();
      await SplashScreen.hideAsync();
    };
    initAuth();
  }, [initialize]);

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
      </Stack>
    </>
  );
}
