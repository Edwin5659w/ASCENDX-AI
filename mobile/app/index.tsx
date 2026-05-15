import { Redirect } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const href =
    !isAuthenticated ? '/(auth)/login' : user?.onboardingDone === false ? '/(onboarding)' : '/(tabs)';

  return <Redirect href={href as any} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
});
