import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { ComponentProps } from 'react';
import { Tabs } from 'expo-router';
import { theme } from '@/constants/theme';
import { BrandLogo } from '@/src/components/brand/BrandLogo';

function TabIcon({ name, color }: { name: ComponentProps<typeof FontAwesome>['name']; color: string }) {
  return <FontAwesome size={22} name={name} color={color} style={{ marginBottom: -2 }} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: theme.colors.accent,
        headerLeft: () => <BrandLogo size="xs" style={{ marginLeft: 12 }} />,
        tabBarInactiveTintColor: theme.colors.textMuted,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tareas',
          tabBarIcon: ({ color }) => <TabIcon name="check-square-o" color={color} />,
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Hábitos',
          tabBarIcon: ({ color }) => <TabIcon name="fire" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Mentor IA',
          tabBarIcon: ({ color }) => <TabIcon name="comments" color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Más',
          tabBarIcon: ({ color }) => <TabIcon name="th-large" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          title: 'Perfil',
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          href: null,
          title: 'Objetivos',
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          href: null,
          title: 'Finanzas',
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          href: null,
          title: 'Logros',
        }}
      />
    </Tabs>
  );
}
