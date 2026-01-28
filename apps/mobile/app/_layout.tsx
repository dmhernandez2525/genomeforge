import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen once the app is ready
    SplashScreen.hideAsync();
  }, []);

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
      </Stack>
    </>
  );
}
