import { Tabs } from 'expo-router/js-tabs';
import { Icon, type IconName } from '@/components/ui';
import { useTheme } from '@/theme/useTheme';

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Inicio', icon: 'home' },
  { name: 'movements', title: 'Registros', icon: 'movements' },
  { name: 'goals', title: 'Metas', icon: 'goals' },
  { name: 'simulator', title: 'Simulador', icon: 'simulator' },
  { name: 'profile', title: 'Perfil', icon: 'profile' },
];

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontWeight: '600' },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => <Icon name={tab.icon} tint={color} size={24} />,
          }}
        />
      ))}
    </Tabs>
  );
}
