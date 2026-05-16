import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { BrandSplash } from '@/src/components/brand/BrandSplash';
import { theme } from '@/constants/theme';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

const ascendxDark = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.text,
    border: theme.colors.border,
    primary: theme.colors.primary,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && splashDone) {
      SplashScreen.hideAsync();
    }
  }, [loaded, splashDone]);

  const onSplashFinish = useCallback(() => setSplashDone(true), []);

  if (!loaded) return null;

  return (
    <>
      {!splashDone ? <BrandSplash onFinish={onSplashFinish} /> : null}
      <AuthProvider>
        <ThemeProvider value={ascendxDark}>
          <StatusBar style="light" />
          <RootNavigator />
        </ThemeProvider>
      </AuthProvider>
    </>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const seg0 = segments[0] as string;
    const inAuth = seg0 === '(auth)';
    const inOnboarding = seg0 === '(onboarding)';

    if (!isAuthenticated) {
      if (!inAuth) {
        router.replace('/(auth)/login');
      }
      return;
    }

    if (user?.onboardingDone === false) {
      if (!inOnboarding) {
        router.replace('/(onboarding)' as any);
      }
      return;
    }

    if (inAuth || inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, router, user?.onboardingDone]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
