import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { LogBox, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { IntroAnimation } from '@/components/brand/IntroAnimation';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { wakeServer } from '@/lib/api';
import { ThemePreferenceProvider } from '@/theme/ThemePreference';
import { useTheme } from '@/theme/useTheme';

// Aviso conocido de react-native-svg solo en la vista previa web (atributo "collapsable"); no afecta Android.
if (Platform.OS === 'web') LogBox.ignoreLogs([/non-boolean attribute/, /Received `%s` for a non-boolean/]);

// La pantalla de inicio nativa (fondo #0B1020 con el símbolo) se mantiene hasta
// que la animación de inicio está lista para dibujarse encima.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

// Despierta el servidor en la nube desde el primer instante.
wakeServer();

function RootNavigator() {
  const { status } = useAuth();
  const { colors, isDark } = useTheme();
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const [showIntro, setShowIntro] = useState(true);
  const finishIntro = useCallback(() => setShowIntro(false), []);

  // La animación de inicio ya cubre la pantalla: se oculta la pantalla nativa.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  // Mientras se cargan las fuentes y se recupera la sesión guardada no se
  // muestra ninguna ruta, para no parpadear entre "sin sesión" y "con sesión".
  const appReady = status !== 'loading' && (fontsLoaded || Boolean(fontError));
  const signedIn = status === 'signedIn';

  return (
    <View style={{ flex: 1, backgroundColor: showIntro ? '#0B1020' : colors.background }}>
      <StatusBar style={showIntro || isDark ? 'light' : 'dark'} />
      {appReady ? (
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="welcome" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="reset-password" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
      </Stack>
      ) : null}
      {showIntro ? <IntroAnimation ready={appReady} onFinish={finishIntro} /> : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemePreferenceProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ThemePreferenceProvider>
    </SafeAreaProvider>
  );
}
