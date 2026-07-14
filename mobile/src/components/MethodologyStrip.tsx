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
      flexDirection: 'row' as const,
      marginBottom: 16,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(139, 92, 246, 0.25)',
      backgroundColor: 'rgba(139, 92, 246, 0.08)',
    },
    icon: { marginRight: 10, marginTop: 2 },
    copy: { flex: 1 },
    label: {
      color: theme.colors.primaryLight,
      fontSize: 10,
      fontWeight: '700' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
    },
    tagline: { color: theme.colors.text, fontSize: 14, fontWeight: '600' as const, marginTop: 4 },
    help: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 6 },
    toggle: {
      color: theme.colors.primaryLight,
      fontSize: 12,
      fontWeight: '600' as const,
      marginTop: 8,
    },
  };
}

/** Una línea visible; el detalle se abre solo si el usuario lo pide. */
export function MethodologyStrip({ module }: { module: MethodologyModule }) {
  const m = METHODOLOGIES[module];
  const [open, setOpen] = useState(false);
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable style={styles.wrap} onPress={() => setOpen((v) => !v)}>
      <FontAwesome name="lightbulb-o" size={16} color={theme.colors.primaryLight} style={styles.icon} />
      <View style={styles.copy}>
        <Text style={styles.label}>Metodología {m.name}</Text>
        <Text style={styles.tagline}>{m.tagline}</Text>
        {open ? <Text style={styles.help}>{m.howWeHelp}</Text> : null}
        <Text style={styles.toggle}>{open ? 'Ocultar método' : 'Ver método'}</Text>
      </View>
    </Pressable>
  );
}
