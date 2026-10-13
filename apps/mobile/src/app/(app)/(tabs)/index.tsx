import { estimateSavingCapacity } from '@ascendx/finance-core';
import { Redirect, router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';
import { MentorMark } from '@/components/brand/MentorMark';
import { AppText, Card, Icon, ProgressRing, Screen, type IconName } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { firstName, formatCop } from '@/lib/format';
import { useTheme } from '@/theme/useTheme';

/**
 * Panel principal (sección 15.4). Orden de prioridad:
 * 1. Saludo y resumen de la situación.
 * 2. Meta prioritaria y su progreso.
 * 3. Capacidad de ahorro estimada y su explicación.
 * 4. Próxima acción recomendada.
 * 5–6. Evolución y movimientos recientes (solo cuando existan datos reales).
 * 7. Acceso visible al mentor de IA.
 *
 * Nunca se inventan cifras: si no hay datos, se muestra un estado vacío que
 * invita a dar el siguiente paso.
 */
export default function HomeScreen() {
  const { user, isNewAccount } = useAuth();
  const { colors, isDark, radius, spacing } = useTheme();

  if (isNewAccount) return <Redirect href="/onboarding" />;
  if (!user) return null;

  const profile = user.financialProfile;
  const hasProfile = profile?.estimatedIncome != null && profile.estimatedFixedExpenses != null;
  const capacity = estimateSavingCapacity({
    completedMonths: [],
    profile: hasProfile
      ? { estimatedIncome: profile.estimatedIncome ?? 0, estimatedFixedExpenses: profile.estimatedFixedExpenses ?? 0 }
      : null,
    safetyMargin: profile?.safetyMargin,
  });
  const marginPercent = Math.round((1 - (profile?.safetyMargin ?? 0.8)) * 100);

  const summary = !hasProfile
    ? 'Empecemos por lo básico: cuéntanos cuánto recibes y cuánto gastas al mes.'
    : capacity.alert
      ? 'Tus gastos fijos igualan o superan tu ingreso estimado. Revisemos tu perfil.'
      : `Según tu perfil, podrías apartar ${formatCop(capacity.prudentCapacity)} al mes sin quedarte corto.`;

  const nextAction: { icon: IconName; title: string; detail: string; href: Href } = !hasProfile
    ? {
        icon: 'wallet',
        title: 'Completa tu perfil financiero',
        detail: 'Con tu ingreso y tus gastos fijos estimamos cuánto puedes ahorrar.',
        href: '/financial-profile',
      }
    : capacity.alert
      ? {
          icon: 'edit',
          title: 'Revisa tu ingreso y tus gastos fijos',
          detail: 'Ajusta los valores para que la estimación refleje tu realidad.',
          href: '/financial-profile',
        }
      : {
          icon: 'simulator',
          title: 'Simula la compra que tienes en mente',
          detail: 'Compara ahorrar, financiar o combinar ambos con el costo total de cada camino.',
          href: '/simulator',
        };

  return (
    <Screen scroll>
      {/* 1. Saludo y resumen */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <AppText variant="title" accessibilityRole="header">
            Hola, {firstName(user.name)}
          </AppText>
          <AppText color="textMuted">{summary}</AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Perfil y ajustes"
          onPress={() => router.push('/profile')}
          style={({ pressed }) => ({
            width: 48,
            height: 48,
            borderRadius: radius.pill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          })}
        >
          <AppText variant="heading" color="mint">
            {firstName(user.name).charAt(0).toUpperCase()}
          </AppText>
        </Pressable>
      </View>

      {/* 2. Meta prioritaria (estado vacío honesto hasta tener el módulo de metas) */}
      <Card elevated>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
          <ProgressRing value={0} size={88} strokeWidth={8} milestones={[0.25, 0.5, 0.75]} accessibilityLabel="Aún no tienes una meta prioritaria">
            <Icon name="goals" size={26} color="textSubtle" />
          </ProgressRing>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <AppText variant="overline" color="textMuted">
              Tu meta prioritaria
            </AppText>
            <AppText variant="heading">Aún no has definido una meta</AppText>
            <AppText variant="caption" color="textMuted">
              Aquí verás cuánto llevas, cuánto falta y cuándo la alcanzarías. Crear metas llega con el módulo de metas
              (fase 3).
            </AppText>
          </View>
        </View>
      </Card>

      {/* 3. Capacidad de ahorro */}
      <Card highlighted={!capacity.alert && capacity.base !== 'sin_datos'}>
        <AppText variant="overline" color="textMuted">
          Ahorro prudente al mes
        </AppText>
        {capacity.base === 'sin_datos' ? (
          <>
            <AppText variant="amount" color="textSubtle" accessibilityLabel="Sin datos">
              —
            </AppText>
            <AppText variant="caption" color="textMuted">
              {capacity.explanation}
            </AppText>
          </>
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              {capacity.alert ? <Icon name="warning" color="danger" size={22} /> : null}
              <AppText variant="amount" color={capacity.alert ? 'danger' : 'text'}>
                {formatCop(capacity.prudentCapacity)}
              </AppText>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingTop: spacing.sm,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <AppText variant="caption" color="textMuted">
                Capacidad estimada
              </AppText>
              <AppText variant="label">{formatCop(capacity.capacity)}</AppText>
            </View>
            <AppText variant="caption" color="textMuted">
              {capacity.alert
                ? 'No proponemos aportes mientras tus gastos fijos superen tu ingreso.'
                : `Reservamos el ${marginPercent} % para imprevistos. ${capacity.explanation}`}
            </AppText>
          </>
        )}
      </Card>

      {/* 4. Próxima acción recomendada */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Próxima acción: ${nextAction.title}`}
        accessibilityHint={nextAction.detail}
        onPress={() => router.push(nextAction.href)}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          padding: spacing.lg,
          borderRadius: radius.lg,
          backgroundColor: pressed ? colors.primaryPressed : colors.primary,
        })}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.md,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? 'rgba(11, 16, 32, 0.14)' : 'rgba(255, 255, 255, 0.16)',
          }}
        >
          <Icon name={nextAction.icon} color="onPrimary" />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="caption" color="onPrimary" style={{ opacity: 0.85 }}>
            Próxima acción
          </AppText>
          <AppText variant="bodyStrong" color="onPrimary">
            {nextAction.title}
          </AppText>
        </View>
        <Icon name="chevronRight" color="onPrimary" />
      </Pressable>

      {/* 7. Acceso al mentor */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tu mentor ASCENDX AI"
        onPress={() => router.push('/assistant')}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.lg,
          padding: spacing.lg,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: pressed ? colors.surfaceAlt : colors.violetSoft,
        })}
      >
        <MentorMark size={48} />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="bodyStrong">Tu mentor ASCENDX AI</AppText>
          <AppText variant="caption" color="textMuted">
            Te explicará tu situación con tus propias cifras. Disponible en la fase 4.
          </AppText>
        </View>
        <Icon name="chevronRight" color="textSubtle" />
      </Pressable>

      <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xs }}>
        <Icon name="shield" color="textSubtle" size={16} />
        <AppText variant="caption" color="textMuted" style={{ flex: 1 }}>
          Herramienta educativa de apoyo a tus decisiones. No reemplaza la asesoría financiera profesional.
        </AppText>
      </View>
    </Screen>
  );
}
