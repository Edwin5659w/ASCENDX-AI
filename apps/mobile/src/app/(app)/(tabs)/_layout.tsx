import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Pressable, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const { colors, elevate } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Registrar un nuevo movimiento"
        onPress={() => router.push('/new-movement')}
        style={({ pressed }) => [
          {
            width: 58,
            height: 58,
            borderRadius: 29,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pressed ? colors.primaryPressed : colors.primary,
            borderWidth: 5,
            borderColor: colors.surface,
            transform: [{ translateY: -18 }],
          },
          elevate('high'),
          { shadowColor: colors.primary },
        ]}
      >
        <Icon name="add" size={28} color="onPrimary" />
      </Pressable>
    </View>
  );
}

/** Ícono de pestaña con una «píldora» de fondo cuando está activa. */
function TabIcon({ icon, color, focused, soft }: { icon: IconName; color: ColorValue; focused: boolean; soft: string }) {
  return (
    <View style={{ width: 54, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? soft : 'transparent' }}>
      <Icon name={icon} tint={color} size={22} />
    </View>
  );
}

export default function TabsLayout() {
  const { colors, fonts, elevate } = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 10);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          height: 66 + bottom,
          paddingTop: 10,
          paddingBottom: bottom,
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          position: 'absolute',
          ...elevate('high'),
        },
        tabBarItemStyle: { paddingHorizontal: 0 },
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 10.5, letterSpacing: -0.1, marginTop: 4 },
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
              // El mentor conserva su color de identidad (violeta) al estar activo.
              ...(tab.name === 'assistant' ? { tabBarActiveTintColor: colors.violetText } : {}),
              tabBarIcon: ({ color, focused }) => (
                <TabIcon icon={tab.icon} color={color} focused={focused} soft={tab.name === 'assistant' ? colors.violetSoft : colors.primarySoft} />
              ),
            }}
          />
        ),
      )}
    </Tabs>
  );
}
