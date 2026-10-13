import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, LogBox, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BrandMark } from '@/components/brand/BrandMark';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { useTheme } from '@/theme/useTheme';

// Aviso conocido de react-native-svg solo en la vista previa web (atributo "collapsable"); no afecta Android.
if (Platform.OS === 'web') LogBox.ignoreLogs(['Received `false` for a non-boolean attribute']);

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

  // Mientras se cargan las fuentes y se recupera la sesión guardada no se
  // muestra ninguna ruta, para no parpadear entre "sin sesión" y "con sesión".
  if (status === 'loading' || (!fontsLoaded && !fontError)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, backgroundColor: colors.background }}>
        <BrandMark size={56} />
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const signedIn = status === 'signedIn';

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
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
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
