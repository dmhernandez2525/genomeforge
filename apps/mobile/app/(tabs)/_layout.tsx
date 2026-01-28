import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, color, size }: { name: IconName; color: string; size: number }) {
  return <Ionicons name={name} size={size} color={color} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 88 : 64,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#2563eb',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <TabIcon name="home" color={color} size={size} />,
          headerTitle: 'GenomeForge',
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: 'Upload',
          tabBarIcon: ({ color, size }) => <TabIcon name="cloud-upload" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="analysis"
        options={{
          title: 'Analysis',
          tabBarIcon: ({ color, size }) => <TabIcon name="analytics" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, size }) => <TabIcon name="document-text" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <TabIcon name="settings" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
