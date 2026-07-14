import { Redirect } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { View } from 'react-native';
import { BrandLoader } from '@/src/components/brand/BrandLoader';
import type { AppTheme } from '@/constants/theme';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

function createStyles(theme: AppTheme) {
  return {
    center: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      backgroundColor: theme.colors.background,
    },
  };
}

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const styles = useThemedStyles(createStyles);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <BrandLoader />
      </View>
    );
  }

  const href =
    !isAuthenticated ? '/(auth)/login' : user?.onboardingDone === false ? '/(onboarding)' : '/(tabs)';

  return <Redirect href={href as any} />;
}
