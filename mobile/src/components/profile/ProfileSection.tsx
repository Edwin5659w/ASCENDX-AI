import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';

export function ProfileSection({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', marginTop: 24, marginBottom: 4 },
  title: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  hint: { color: theme.colors.textMuted, fontSize: 12, marginTop: 4, lineHeight: 16 },
});
