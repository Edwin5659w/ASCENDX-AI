import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { ToastProvider } from '@/src/context/ToastContext';
import { AppThemeProvider, useAppTheme } from '@/src/context/AppThemeContext';
import { LocaleProvider } from '@/src/context/LocaleContext';
import { BrandSplash } from '@/src/components/brand/BrandSplash';
import { useNotificationNavigation } from '@/src/hooks/useNotificationNavigation';
import '@/src/lib/notifications';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function ThemedRoot({
  splashDone,
  onSplashFinish,
  loaded,
}: {
  splashDone: boolean;
  onSplashFinish: () => void;
  loaded: boolean;
}) {
  const { theme, mode } = useAppTheme();
  const navTheme = useMemo(
    () => {
      const base = mode === 'dark' ? DarkTheme : DefaultTheme;
      return {
        ...base,
        dark: mode === 'dark',
        colors: {
          ...base.colors,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.border,
          primary: theme.colors.primary,
        },
      };
    },
    [theme, mode],
  );

  if (!loaded) return null;

  return (
    <>
      {!splashDone ? <BrandSplash onFinish={onSplashFinish} /> : null}
      <ThemeProvider value={navTheme}>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <RootNavigator />
      </ThemeProvider>
    </>
  );
}

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

  return (
    <AuthProvider>
      <LocaleProvider>
        <AppThemeProvider>
          <ToastProvider>
            <ThemedRoot splashDone={splashDone} onSplashFinish={onSplashFinish} loaded={loaded} />
          </ToastProvider>
        </AppThemeProvider>
      </LocaleProvider>
    </AuthProvider>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { theme } = useAppTheme();
  const segments = useSegments();
  const router = useRouter();

  const canNavigateFromPush =
    !isLoading && isAuthenticated && user?.onboardingDone !== false;

  useNotificationNavigation(canNavigateFromPush);

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
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
