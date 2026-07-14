import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { METHODOLOGIES, type MethodologyModule } from '../../../shared/methodologies';
import { theme } from '@/constants/theme';

/** Una línea visible; el detalle se abre solo si el usuario lo pide. */
export function MethodologyStrip({ module }: { module: MethodologyModule }) {
  const m = METHODOLOGIES[module];
  const [open, setOpen] = useState(false);

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

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
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
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tagline: { color: theme.colors.text, fontSize: 14, fontWeight: '600', marginTop: 4 },
  help: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 6 },
  toggle: {
    color: theme.colors.primaryLight,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
});
