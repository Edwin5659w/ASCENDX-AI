import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card } from '@/src/components/ui/Card';
import type { PlanUsage } from '@/src/types/api';
import { theme } from '@/constants/theme';

interface UpgradeBannerProps {
  planUsage?: PlanUsage | null;
}

export function UpgradeBanner({ planUsage }: UpgradeBannerProps) {
  const router = useRouter();
  if (!planUsage || planUsage.plan === 'PRO') return null;

  const { aiChatToday } = planUsage.usage;
  const { aiChatPerDay } = planUsage.limits;
  const pct = Math.round((aiChatToday / aiChatPerDay) * 100);
  const remaining = aiChatPerDay - aiChatToday;
  if (pct < 40 && remaining > 2) return null;

  return (
    <Card style={styles.card}>
      <FontAwesome name="magic" size={20} color={theme.colors.primaryLight} style={styles.icon} />
      <View style={styles.body}>
        <Text style={styles.title}>
          {pct >= 100
            ? 'Límite IA alcanzado — mentor pausado'
            : remaining <= 2
              ? `Solo ${remaining} mensaje${remaining !== 1 ? 's' : ''} IA hoy`
              : `${aiChatToday}/${aiChatPerDay} mensajes IA hoy`}
        </Text>
        <Text style={styles.hint}>Pro: 100 msg/día, resumen semanal y más objetivos.</Text>
      </View>
      <Pressable style={styles.btn} onPress={() => router.push('/(tabs)/profile' as never)}>
        <FontAwesome name="star" size={12} color="#fff" />
        <Text style={styles.btnText}>{pct >= 100 ? 'Desbloquear' : 'Pro'}</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderColor: 'rgba(139, 92, 246, 0.35)',
    borderWidth: 1,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: { marginTop: 2 },
  body: { flex: 1 },
  title: { color: theme.colors.primaryLight, fontWeight: '600', fontSize: 13 },
  hint: { color: theme.colors.textMuted, fontSize: 11, marginTop: 2 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
  },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
