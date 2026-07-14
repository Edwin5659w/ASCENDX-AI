import type { ComponentProps } from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/src/context/AppThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

type IconName = ComponentProps<typeof FontAwesome>['name'];

interface EmptyStateProps {
  icon: IconName;
  title: string;
  description?: string;
}

function createStyles(theme: AppTheme) {
  return {
    wrap: {
      alignItems: 'center' as const,
      paddingVertical: 48,
      paddingHorizontal: theme.spacing.lg,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: 16,
    },
    title: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '600' as const,
      textAlign: 'center' as const,
      marginBottom: 6,
    },
    description: {
      color: theme.colors.textMuted,
      fontSize: 14,
      textAlign: 'center' as const,
      lineHeight: 20,
    },
  };
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['rgba(138,43,226,0.12)', 'rgba(0,229,255,0.08)']}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={styles.iconWrap}>
        <FontAwesome name={icon} size={28} color={theme.colors.primary} />
      </LinearGradient>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}
