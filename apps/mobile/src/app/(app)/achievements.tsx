import { View } from 'react-native';
import { AppText, Card, ErrorView, Header, Icon, LoadingView, OfflineBanner, ProgressBar, Screen, type IconName } from '@/components/ui';
import { getHabits, type Achievement } from '@/features/habits/api';
import { useQuery } from '@/lib/query';
import { useTheme } from '@/theme/useTheme';

const ICONS: Record<string, IconName> = { flag: 'check', flame: 'flame', goals: 'goals', savings: 'savings', trophy: 'trophy', shield: 'shield', chart: 'chart', check: 'check' };

/** RF-32: racha semanal e insignias. Premian registrar, ahorrar y cumplir; nunca endeudarse ni gastar. */
export default function AchievementsScreen() {
  const { colors, radius, spacing } = useTheme();
  const { data, error, loading, refetch, fromCache, updatedAt } = useQuery('habits', getHabits);

  const earned = data?.achievements.filter((a) => a.earned) ?? [];
  const pending = data?.achievements.filter((a) => !a.earned) ?? [];

  return (
    <Screen scroll edges={['top', 'bottom']} animateIn={false}>
      <Header title="Logros" />
      {fromCache ? <OfflineBanner updatedAt={updatedAt} /> : null}
      {loading ? <LoadingView /> : null}
      {error && !data ? <ErrorView error={error} onRetry={refetch} /> : null}

      {data ? (
        <>
          <Card elevated>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
              <View style={{ width: 64, height: 64, borderRadius: radius.lg, backgroundColor: colors.warningSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="flame" color="warning" size={34} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="display">{data.streak.current}</AppText>
                <AppText color="textMuted">{data.streak.current === 1 ? 'semana seguida registrando' : 'semanas seguidas registrando'}</AppText>
              </View>
            </View>
            <AppText variant="caption" color="textMuted">
              {data.streak.activeThisWeek
                ? 'Esta semana ya cuenta. ¡Sigue así!'
                : data.streak.current
                  ? 'Registra al menos un movimiento esta semana para no perder la racha.'
                  : 'Registra un movimiento esta semana para empezar tu racha.'}
              {data.streak.best > data.streak.current ? ` Tu mejor racha: ${data.streak.best} semanas.` : ''}
            </AppText>
          </Card>

          <AppText variant="overline" color="textMuted">
            Ganados · {earned.length} de {data.achievements.length}
          </AppText>
          {earned.length === 0 ? (
            <AppText color="textMuted">Todavía no tienes logros. El primero llega con tu primer registro.</AppText>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
              {earned.map((a) => (
                <Badge key={a.code} achievement={a} />
              ))}
            </View>
          )}

          {pending.length ? (
            <>
              <AppText variant="overline" color="textMuted">
                Por lograr
              </AppText>
              {pending.map((a) => (
                <Card key={a.code}>
                  <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
                    <Icon name={ICONS[a.icon] ?? 'trophy'} color="textSubtle" />
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodyStrong">{a.title}</AppText>
                      <AppText variant="caption" color="textMuted">
                        {a.description}
                      </AppText>
                    </View>
                    <AppText variant="label" color="textMuted">
                      {String(a.current).replace('.', ',')}/{a.target}
                    </AppText>
                  </View>
                  <ProgressBar value={a.current / a.target} label={`Progreso de ${a.title}`} />
                </Card>
              ))}
            </>
          ) : null}

          <AppText variant="caption" color="textMuted">
            Los logros nunca premian endeudarte ni gastar más: solo registrar, ahorrar y cumplir tus metas.
          </AppText>
        </>
      ) : null}
    </Screen>
  );
}

function Badge({ achievement }: { achievement: Achievement }) {
  const { colors, radius, spacing } = useTheme();
  const date = achievement.earnedAt
    ? new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', timeZone: 'America/Bogota' }).format(new Date(achievement.earnedAt))
    : '';
  return (
    <View
      accessibilityLabel={`Logro ${achievement.title}: ${achievement.description}`}
      style={{ width: '47%', gap: spacing.xs, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary }}
    >
      <Icon name={ICONS[achievement.icon] ?? 'trophy'} color="primary" size={26} />
      <AppText variant="bodyStrong">{achievement.title}</AppText>
      <AppText variant="caption" color="textMuted">
        {achievement.description}
      </AppText>
      {date ? (
        <AppText variant="caption" color="primary">
          {date}
        </AppText>
      ) : null}
    </View>
  );
}
