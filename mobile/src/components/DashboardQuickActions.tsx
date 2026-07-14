import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { QUICK_ACTIONS } from '../../../shared/dashboard-helpers';
import type { AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/src/context/AppThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

const ICONS: Record<string, React.ComponentProps<typeof FontAwesome>['name']> = {
  tasks: 'check-square-o',
  habits: 'fire',
  goals: 'bullseye',
  finance: 'money',
  chat: 'comments-o',
};

function createStyles(theme: AppTheme) {
  return {
    wrap: { marginBottom: theme.spacing.md },
    title: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '600' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
      marginHorizontal: theme.spacing.md,
      marginBottom: 8,
    },
    row: { paddingHorizontal: theme.spacing.md, gap: 10 },
    chip: {
      width: 108,
      padding: 12,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surfaceLight,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    chipLabel: { color: theme.colors.text, fontSize: 13, fontWeight: '600' as const, marginTop: 8 },
    chipHint: { color: theme.colors.textMuted, fontSize: 10, marginTop: 2 },
  };
}

export function DashboardQuickActions() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Acciones rápidas</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {QUICK_ACTIONS.map((action) => (
          <Pressable
            key={action.id}
            style={styles.chip}
            onPress={() => router.push(action.mobilePath as never)}>
            <FontAwesome name={ICONS[action.id]} size={20} color={theme.colors.primaryLight} />
            <Text style={styles.chipLabel}>{action.label}</Text>
            <Text style={styles.chipHint}>{action.hint}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
