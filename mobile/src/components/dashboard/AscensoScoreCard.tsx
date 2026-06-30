import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../ui/Card';
import { theme } from '@/constants/theme';

interface AscensoScoreCardProps {
  score: number;
  label: string;
  tips?: string[];
}

function scoreColors(score: number): [string, string] {
  if (score >= 75) return ['#10b981', '#2dd4bf'];
  if (score >= 50) return ['#8b5cf6', '#22d3ee'];
  return ['#f59e0b', '#f97316'];
}

export function AscensoScoreCard({ score, label, tips = [] }: AscensoScoreCardProps) {
  const [c1, c2] = scoreColors(score);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={styles.kicker}>Ascenso Score™</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
        <LinearGradient colors={[c1, c2]} style={styles.badge}>
          <Text style={styles.score}>{score}</Text>
        </LinearGradient>
      </View>
      <View style={styles.track}>
        <LinearGradient
          colors={[c1, c2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${score}%` }]}
        />
      </View>
      {tips.length > 0 ? (
        tips.map((t) => (
          <Text key={t} style={styles.tip}>
            → {t}
          </Text>
        ))
      ) : (
        <Text style={styles.ok}>¡Día excelente! Sigue así.</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: theme.spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  copy: { flex: 1, paddingRight: 12 },
  kicker: { color: theme.colors.primaryLight, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  label: { color: theme.colors.text, fontSize: 17, fontWeight: '700', marginTop: 2 },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: { color: '#fff', fontSize: 24, fontWeight: '900' },
  track: { height: 8, backgroundColor: theme.colors.surfaceLight, borderRadius: 999, overflow: 'hidden', marginBottom: 10 },
  fill: { height: '100%', borderRadius: 999 },
  tip: { color: theme.colors.textMuted, fontSize: 12, marginTop: 4 },
  ok: { color: theme.colors.success, fontSize: 12 },
});
