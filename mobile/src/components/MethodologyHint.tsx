import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { METHODOLOGIES, type MethodologyModule } from '../../../shared/methodologies';
import type { AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/src/context/AppThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

function createStyles(theme: AppTheme) {
  return {
    wrap: {
      marginHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.primary + '33',
      backgroundColor: theme.colors.primary + '14',
      overflow: 'hidden' as const,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 10,
      padding: 12,
    },
    title: { flex: 1, fontSize: 13, color: theme.colors.textMuted },
    name: { color: theme.colors.primaryLight, fontWeight: '700' as const },
    tagline: { color: theme.colors.textMuted },
    body: {
      paddingHorizontal: 12,
      paddingBottom: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    help: { color: theme.colors.textMuted, fontSize: 13, marginTop: 8, marginBottom: 8, lineHeight: 20 },
    step: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 4 },
  };
}

export function MethodologyHint({ module }: { module: MethodologyModule }) {
  const [open, setOpen] = useState(false);
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const m = METHODOLOGIES[module];

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.header} onPress={() => setOpen((v) => !v)}>
        <FontAwesome name="lightbulb-o" size={16} color={theme.colors.primaryLight} />
        <Text style={styles.title}>
          <Text style={styles.name}>{m.name}</Text>
          <Text style={styles.tagline}> — {m.tagline}</Text>
        </Text>
        <FontAwesome name={open ? 'chevron-up' : 'chevron-down'} size={14} color={theme.colors.textMuted} />
      </Pressable>
      {open && (
        <View style={styles.body}>
          <Text style={styles.help}>{m.howWeHelp}</Text>
          {m.steps.map((s, i) => (
            <Text key={s} style={styles.step}>
              {i + 1}. {s}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
