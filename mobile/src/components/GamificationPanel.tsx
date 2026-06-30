import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card } from '@/src/components/ui/Card';
import { resolveBadges, xpProgress } from '@/src/lib/gamification';
import type { User, UserStats } from '@/src/types/api';
import { theme } from '@/constants/theme';

interface GamificationPanelProps {
  user: User | null;
  stats: UserStats | null;
  compact?: boolean;
}

export function GamificationPanel({ user, stats, compact = false }: GamificationPanelProps) {
  const router = useRouter();
  if (!user) return null;

  const { pct, toNext } = xpProgress(user.xp);
  const level = user.level;
  const badges = resolveBadges(user, stats);
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FontAwesome name="star" size={20} color={theme.colors.primaryLight} />
          <View style={styles.headerText}>
            <Text style={styles.title}>Tu progreso</Text>
            <Text style={styles.subtitle}>
              Nivel {level} · {unlockedCount}/{badges.length} logros
            </Text>
          </View>
        </View>
        <View style={styles.xpBlock}>
          <Text style={styles.xpValue}>{user.xp}</Text>
          <Text style={styles.xpLabel}>XP total</Text>
        </View>
      </View>

      <Pressable onPress={() => router.push('/(tabs)/achievements' as never)}>
        <Text style={styles.viewAll}>Ver todos los logros →</Text>
      </Pressable>

      <View style={styles.progressLabels}>
        <Text style={styles.progressHint}>Progreso al nivel {level + 1}</Text>
        <Text style={styles.progressHint}>{toNext} XP para subir</Text>
      </View>
      <View style={[styles.xpTrack, compact && styles.xpTrackCompact]}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.brandMagenta]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.xpFill, { width: `${pct}%` }]}
        />
      </View>

      {!compact ? (
        <>
      <Text style={styles.badgesTitle}>LOGROS</Text>
      <View style={styles.badgeGrid}>
        {badges.map((b) => (
          <View
            key={b.slug}
            style={[styles.badgeCard, !b.unlocked && styles.badgeCardLocked]}>
            <FontAwesome
              name={b.unlocked ? 'trophy' : 'lock'}
              size={16}
              color={b.unlocked ? theme.colors.warning : theme.colors.textMuted}
            />
            <Text style={[styles.badgeTitle, !b.unlocked && styles.badgeTitleLocked]}>
              {b.title}
            </Text>
            <Text style={styles.badgeSubtitle}>{b.subtitle}</Text>
            {b.unlocked && b.unlockedAt ? (
              <Text style={styles.badgeDate}>
                {new Date(b.unlockedAt).toLocaleDateString('es', {
                  day: 'numeric',
                  month: 'short',
                })}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
    gap: 12,
  },
  headerLeft: { flexDirection: 'row', gap: 10, flex: 1 },
  headerText: { flex: 1 },
  title: { color: theme.colors.text, fontSize: 17, fontWeight: '600' },
  subtitle: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  xpBlock: { alignItems: 'flex-end' },
  xpValue: { color: theme.colors.primaryLight, fontSize: 24, fontWeight: '700' },
  xpLabel: { color: theme.colors.textMuted, fontSize: 11 },
  viewAll: {
    color: theme.colors.primaryLight,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressHint: { color: theme.colors.textMuted, fontSize: 11 },
  xpTrack: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
  },
  xpTrackCompact: { marginBottom: 0 },
  xpFill: { height: '100%', borderRadius: 5 },
  badgesTitle: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeCard: {
    width: '47%',
    flexGrow: 1,
    minWidth: 140,
    padding: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    gap: 4,
  },
  badgeCardLocked: {
    borderColor: theme.colors.border,
    backgroundColor: 'rgba(0,0,0,0.2)',
    opacity: 0.75,
  },
  badgeTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '600', marginTop: 4 },
  badgeTitleLocked: { color: theme.colors.textMuted },
  badgeSubtitle: { color: theme.colors.textMuted, fontSize: 11, lineHeight: 15 },
  badgeDate: { color: theme.colors.textMuted, fontSize: 10, marginTop: 4 },
});
