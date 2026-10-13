import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Pressable, View } from 'react-native';
import { Icon, type IconName } from '@/components/ui';
import { useTheme } from '@/theme/useTheme';

/**
 * Navegación inferior del Documento Maestro v2 (sección 15):
 * Inicio · Movimientos · (+) · Metas · Asistente.
 * El botón central abre «Nuevo movimiento»; simulador y deudas se abren desde Inicio y Metas.
 */
const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Inicio', icon: 'home' },
  { name: 'movements', title: 'Movimientos', icon: 'movements' },
  { name: 'add', title: 'Nuevo', icon: 'add' },
  { name: 'goals', title: 'Metas', icon: 'goals' },
  { name: 'assistant', title: 'Asistente', icon: 'assistant' },
];

function AddButton() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Registrar un nuevo movimiento"
        onPress={() => router.push('/new-movement')}
        style={({ pressed }) => ({
          width: 52,
          height: 52,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? colors.primaryPressed : colors.primary,
          transform: [{ translateY: -6 }],
        })}
      >
        <Icon name="add" size={28} color="onPrimary" />
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  const { colors, fonts } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 68, paddingTop: 6 },
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {TABS.map((tab) =>
        tab.name === 'add' ? (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{ title: tab.title, tabBarButton: () => <AddButton /> }}
          />
        ) : (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarIcon: ({ color }) => <Icon name={tab.icon} tint={color} size={24} />,
            }}
          />
        ),
      )}
    </Tabs>
  );
}
