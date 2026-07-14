import { ActivityIndicator, View } from 'react-native';
import type { AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/src/context/AppThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

function createStyles(_theme: AppTheme) {
  return {
    wrap: { paddingVertical: 16, alignItems: 'center' as const },
  };
}

export function LoadMoreFooter({ loading }: { loading: boolean }) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  if (!loading) return null;
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={theme.colors.primary} />
    </View>
  );
}
