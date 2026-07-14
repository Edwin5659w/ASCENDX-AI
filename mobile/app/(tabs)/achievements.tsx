import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';
import { userApi } from '@/src/api/services';
import { Card } from '@/src/components/ui/Card';
import { resolveBadges } from '@/src/lib/gamification';
import type { UserStats } from '@/src/types/api';
import type { AppTheme } from '@/constants/theme';
import { useAppTheme } from '@/src/context/AppThemeContext';
import { useThemedStyles } from '@/src/hooks/useThemedStyles';

function createStyles(theme: AppTheme) {
  return {
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: theme.spacing.md, paddingBottom: 40 },
    boot: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
      marginBottom: theme.spacing.lg,
      gap: 12,
    },
    title: { color: theme.colors.text, fontSize: 22, fontWeight: '700' as const },
    subtitle: { color: theme.colors.textMuted, fontSize: 13, marginTop: 4 },
    shareBtn: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      borderWidth: 1,
      borderColor: 'rgba(139, 92, 246, 0.35)',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: theme.radius.sm,
    },
    shareText: { color: theme.colors.primaryLight, fontSize: 12, fontWeight: '600' as const },
    section: {
      color: theme.colors.textMuted,
      fontSize: 11,
      fontWeight: '600' as const,
      letterSpacing: 1,
      marginBottom: theme.spacing.sm,
    },
    grid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 10,
      marginBottom: theme.spacing.lg,
    },
    badgeUnlocked: {
      width: '47%' as const,
      flexGrow: 1,
      minWidth: 140,
      borderColor: 'rgba(139, 92, 246, 0.35)',
      gap: 4,
    },
    badgeLocked: {
      width: '47%' as const,
      flexGrow: 1,
      minWidth: 140,
      opacity: 0.75,
      gap: 4,
    },
    badgeTitle: {
      color: theme.colors.text,
      fontWeight: '600' as const,
      fontSize: 14,
      marginTop: 4,
    },
    badgeTitleLocked: {
      color: theme.colors.textMuted,
      fontWeight: '600' as const,
      fontSize: 14,
      marginTop: 4,
    },
    badgeSub: { color: theme.colors.textMuted, fontSize: 11, lineHeight: 15 },
    badgeDate: { color: theme.colors.textMuted, fontSize: 10, marginTop: 4 },
    link: {
      color: theme.colors.primaryLight,
      fontSize: 13,
      textAlign: 'center' as const,
      marginTop: 8,
    },
  };
}

export default function AchievementsScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      userApi
        .stats()
        .then(setStats)
        .catch((e) => showToast(e instanceof Error ? e.message : 'Error', 'error'))
        .finally(() => setLoading(false));
    }, [showToast]),
  );

  const badges = stats ? resolveBadges(user!, stats) : [];
  const unlocked = badges.filter((b) => b.unlocked);
  const locked = badges.filter((b) => !b.unlocked);

  const shareProgress = async () => {
    const text = `¡Llevo ${unlocked.length}/${badges.length} logros en ASCENDX AI! Nivel ${user?.level} · ${user?.xp} XP.`;
    try {
      await Share.share({ message: text, title: 'ASCENDX AI' });
    } catch {
      /* cancelado */
    }
  };

  if (loading) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Logros</Text>
          <Text style={styles.subtitle}>
            {unlocked.length}/{badges.length} desbloqueados · Nivel {user?.level}
          </Text>
        </View>
        <Pressable style={styles.shareBtn} onPress={() => void shareProgress()}>
          <FontAwesome name="share-alt" size={16} color={theme.colors.primaryLight} />
          <Text style={styles.shareText}>Compartir</Text>
        </Pressable>
      </View>

      {unlocked.length > 0 && (
        <>
          <Text style={styles.section}>DESBLOQUEADOS</Text>
          <View style={styles.grid}>
            {unlocked.map((b) => (
              <Card key={b.slug} style={styles.badgeUnlocked}>
                <FontAwesome name="trophy" size={22} color={theme.colors.warning} />
                <Text style={styles.badgeTitle}>{b.title}</Text>
                <Text style={styles.badgeSub}>{b.subtitle}</Text>
                {b.unlockedAt ? (
                  <Text style={styles.badgeDate}>
                    {new Date(b.unlockedAt).toLocaleDateString('es', {
                      day: 'numeric',
                      month: 'long',
                    })}
                  </Text>
                ) : null}
              </Card>
            ))}
          </View>
        </>
      )}

      {locked.length > 0 && (
        <>
          <Text style={styles.section}>POR DESBLOQUEAR</Text>
          <View style={styles.grid}>
            {locked.map((b) => (
              <Card key={b.slug} style={styles.badgeLocked}>
                <FontAwesome name="lock" size={18} color={theme.colors.textMuted} />
                <Text style={styles.badgeTitleLocked}>{b.title}</Text>
                <Text style={styles.badgeSub}>{b.subtitle}</Text>
              </Card>
            ))}
          </View>
        </>
      )}

      <Pressable onPress={() => router.push('/(tabs)/profile' as never)}>
        <Text style={styles.link}>Ver código de referido en Perfil →</Text>
      </Pressable>
    </ScrollView>
  );
}
