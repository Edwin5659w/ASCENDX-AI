import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card } from '@/src/components/ui/Card';
import { userApi } from '@/src/api/services';
import type { WeeklyRecapResult } from '@/src/types/api';
import { theme } from '@/constants/theme';

export function WeeklyRecap() {
  const router = useRouter();
  const [recap, setRecap] = useState<WeeklyRecapResult | null>(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    userApi
      .weeklyRecap()
      .then(setRecap)
      .catch((e) => {
        if (e instanceof Error && e.message.includes('Pro')) setLocked(true);
      });
  }, []);

  if (locked) {
    return (
      <Card style={styles.lockedCard}>
        <View style={styles.lockedRow}>
          <View style={styles.lockIcon}>
            <FontAwesome name="lock" size={18} color={theme.colors.warning} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.lockedTitle}>Resumen semanal</Text>
            <Text style={styles.lockedHint}>Disponible en plan Pro</Text>
          </View>
          <Pressable
            style={styles.proBtn}
            onPress={() => router.push('/(tabs)/profile' as never)}>
            <FontAwesome name="star" size={12} color="#fff" />
            <Text style={styles.proBtnText}>Pro</Text>
          </Pressable>
        </View>
      </Card>
    );
  }

  if (!recap) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <FontAwesome name="bar-chart" size={18} color={theme.colors.success} />
        <Text style={styles.title}>Tu semana</Text>
        <Text style={styles.score}>{recap.score}/100</Text>
      </View>
      <Text style={styles.headline}>{recap.headline}</Text>
      {recap.highlights.map((h) => (
        <Text key={h} style={styles.bullet}>
          • {h}
        </Text>
      ))}
      <Text style={styles.encouragement}>{recap.encouragement}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    borderWidth: 1,
  },
  lockedCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    borderWidth: 1,
  },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lockIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  lockedTitle: { color: theme.colors.text, fontWeight: '600', fontSize: 14 },
  lockedHint: { color: theme.colors.textMuted, fontSize: 12 },
  proBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
  },
  proBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  title: { color: theme.colors.text, fontSize: 16, fontWeight: '600', flex: 1 },
  score: { color: theme.colors.success, fontWeight: '700', fontSize: 14 },
  headline: { color: theme.colors.text, fontWeight: '600', marginBottom: 6 },
  bullet: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 20 },
  encouragement: { color: theme.colors.textMuted, fontSize: 12, marginTop: 8 },
});
