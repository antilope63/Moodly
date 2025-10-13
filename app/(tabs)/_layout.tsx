import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/providers/auth-provider';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { role } = useAuth();
  const isManagerViewEnabled = role === 'manager' || role === 'hr';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          height: 64,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Log',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="square.and.pencil" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historique',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="clock.fill" color={color} />,
        }}
      />
      {isManagerViewEnabled ? (
        <Tabs.Screen
          name="manager"
          options={{
            title: 'Manager',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.3.fill" color={color} />,
          }}
        />
      ) : null}
    </Tabs>
  );
}
