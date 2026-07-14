import { Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card } from './ui/Card';
import type { AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/src/context/AppThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  color?: string;
}

function createStyles(theme: AppTheme) {
  return {
    card: {
      flex: 1,
      minWidth: '45%' as const,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: 8,
    },
    value: {
      color: theme.colors.text,
      fontSize: 22,
      fontWeight: '700' as const,
    },
    label: {
      color: theme.colors.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
  };
}

export function StatCard({ label, value, icon, color }: StatCardProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const iconColor = color ?? theme.colors.primary;

  return (
    <Card style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: iconColor + '22' }]}>
        <FontAwesome name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </Card>
  );
}
