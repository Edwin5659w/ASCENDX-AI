import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card } from '@/src/components/ui/Card';
import type { AIContextLevel } from '../../../shared/ai-prompts';
import { theme } from '@/constants/theme';

interface AIMentorCardProps {
  contextLevel: AIContextLevel;
  suggestedPrompts: string[];
  aiUsed?: number;
  aiLimit?: number;
}

export function AIMentorCard({ contextLevel, suggestedPrompts, aiUsed = 0, aiLimit = 5 }: AIMentorCardProps) {
  const router = useRouter();
  const remaining = Math.max(0, aiLimit - aiUsed);
  const prompt = suggestedPrompts[0] ?? 'Planifica mi día con mis tareas actuales';

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <FontAwesome name="comments" size={18} color={theme.colors.accent} />
        <Text style={styles.badge}>Mentor IA</Text>
        <Text style={styles.remaining}>{remaining} msg hoy</Text>
      </View>
      <Text style={styles.title}>
        {contextLevel === 'ready'
          ? 'Tu IA conoce tus datos'
          : contextLevel === 'partial'
            ? 'Completa perfil → IA más precisa'
            : 'Primer plan con mentor IA'}
      </Text>
      <Text style={styles.desc}>
        Pregunta algo concreto y obtén el siguiente paso en minutos.
      </Text>
      <Pressable
        style={styles.cta}
        onPress={() => router.push({ pathname: '/(tabs)/chat', params: { prefill: prompt } })}>
        <FontAwesome name="comment" size={14} color="#fff" />
        <Text style={styles.ctaText}>Hablar con el mentor</Text>
      </Pressable>
      <View style={styles.chips}>
        {suggestedPrompts.slice(0, 2).map((p) => (
          <Pressable
            key={p}
            style={styles.chip}
            onPress={() => router.push({ pathname: '/(tabs)/chat', params: { prefill: p } })}>
            <Text style={styles.chipText} numberOfLines={2}>
              {p}
            </Text>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    borderWidth: 1,
    backgroundColor: 'rgba(34, 211, 238, 0.06)',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  badge: { color: theme.colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  remaining: { marginLeft: 'auto', color: theme.colors.textMuted, fontSize: 11 },
  title: { color: theme.colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  desc: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 12 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  chips: { gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.35)',
  },
  chipText: { color: theme.colors.primaryLight, fontSize: 12 },
});
