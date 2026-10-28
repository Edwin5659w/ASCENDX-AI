import { Stack } from 'expo-router';
import { useTheme } from '@/theme/useTheme';

/** Pantallas con sesión: pestañas y pantallas que se abren encima de ellas. */
export default function AppLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="simulator" />
      <Stack.Screen name="debts" />
      <Stack.Screen name="debt-form" />
      <Stack.Screen name="debt/[id]" />
      <Stack.Screen name="goal-form" />
      <Stack.Screen name="goal/[id]" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="scenarios" />
      <Stack.Screen name="scan-receipt" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="financial-profile" />
      <Stack.Screen name="delete-account" />
      <Stack.Screen name="new-movement" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
