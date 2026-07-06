import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar, Platform, View, Text } from 'react-native';
import { Home, Clock, Settings } from 'lucide-react-native';
import { requestNotificationPermissions } from '../../services/notificationService';
import '../../global.css';

export default function TabLayout() {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      requestNotificationPermissions();
    }
  }, []);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#141414',
            borderTopColor: 'rgba(255,255,255,0.08)',
            borderTopWidth: 1,
            height: 64,
            paddingBottom: 10,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
            marginTop: 2,
          },
          tabBarActiveTintColor: '#FFC107',
          tabBarInactiveTintColor: '#666666',
          tabBarShowLabel: true,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Home color={color} size={22} strokeWidth={focused ? 2.5 : 1.8} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color, focused }) => (
              <Clock color={color} size={22} strokeWidth={focused ? 2.5 : 1.8} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, focused }) => (
              <Settings color={color} size={22} strokeWidth={focused ? 2.5 : 1.8} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
