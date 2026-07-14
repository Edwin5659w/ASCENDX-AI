import { Text, View } from 'react-native';
import type { AppTheme } from '@/constants/theme';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

function createStyles(theme: AppTheme) {
  return {
    wrap: { width: '100%' as const, marginTop: 24, marginBottom: 4 },
    title: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '700' as const,
      letterSpacing: 0.8,
      textTransform: 'uppercase' as const,
    },
    hint: { color: theme.colors.textMuted, fontSize: 12, marginTop: 4, lineHeight: 16 },
  };
}

export function ProfileSection({ title, hint }: { title: string; hint?: string }) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}
