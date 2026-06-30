import { StyleSheet, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { METHODOLOGIES, type MethodologyModule } from '../../../shared/methodologies';
import { theme } from '@/constants/theme';

export function MethodologyStrip({ module }: { module: MethodologyModule }) {
  const m = METHODOLOGIES[module];
  return (
    <View style={styles.wrap}>
      <FontAwesome name="lightbulb-o" size={16} color={theme.colors.primaryLight} style={styles.icon} />
      <View style={styles.copy}>
        <Text style={styles.label}>Metodología {m.name}</Text>
        <Text style={styles.tagline}>{m.tagline}</Text>
        <Text style={styles.help}>{m.howWeHelp}</Text>
      </View>
    </View>
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
  help: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 4 },
});
