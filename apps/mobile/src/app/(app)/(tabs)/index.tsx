import { estimateSavingCapacity } from '@ascendx/finance-core';
import { Redirect, router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';
import { AppText, Card, Icon, NavRow, ProgressBar, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { firstName, formatCop } from '@/lib/format';
import { useTheme } from '@/theme/useTheme';

/**
 * Inicio (panel). Mientras no existan los módulos de movimientos y metas
 * (fase 3), la capacidad de ahorro se estima con el perfil financiero usando
 * la regla de la sección 6.2 del Documento Maestro v2.
 */
export default function HomeScreen() {
  const { user, isNewAccount } = useAuth();
  const { colors, radius, spacing } = useTheme();

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

  const firstSteps: { title: string; done: boolean; href?: Href }[] = [
    { title: 'Crear tu cuenta', done: true },
    { title: 'Completar tu perfil financiero', done: hasProfile, href: '/profile' },
    { title: 'Registrar tu primer movimiento', done: false, href: '/movements' },
    { title: 'Crear tu primera meta', done: false, href: '/goals' },
    { title: 'Comparar ahorrar frente a financiar', done: false, href: '/simulator' },
  ];
  const completed = firstSteps.filter((step) => step.done).length;

  return (
    <Screen scroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText color="textMuted">Hola, {firstName(user.name)}</AppText>
          <AppText variant="title" accessibilityRole="header">
            Tu panel
          </AppText>
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
          <AppText variant="heading" color="primary">
            {firstName(user.name).charAt(0).toUpperCase()}
          </AppText>
        </Pressable>
      </View>

      <Card highlighted={!capacity.alert && capacity.base !== 'sin_datos'}>
        <AppText variant="overline" color="textMuted">
          Puedes ahorrar al mes (prudente)
        </AppText>
        {capacity.base === 'sin_datos' ? (
          <>
            <AppText variant="amount" color="textSubtle">
              —
            </AppText>
            <AppText variant="caption" color="textMuted">
              {capacity.explanation}
            </AppText>
          </>
        ) : (
          <>
            <AppText variant="amount" color={capacity.alert ? 'danger' : 'text'}>
              {formatCop(capacity.prudentCapacity)}
            </AppText>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText variant="caption" color="textMuted">
                Capacidad estimada
              </AppText>
              <AppText variant="label">{formatCop(capacity.capacity)}</AppText>
            </View>
            <AppText variant="caption" color="textMuted">
              {capacity.alert
                ? 'Tus gastos fijos igualan o superan tu ingreso estimado. Revisa tu perfil antes de planear aportes.'
                : `Guardamos el ${Math.round((1 - (profile?.safetyMargin ?? 0.8)) * 100)} % como margen para imprevistos. ${capacity.explanation}`}
            </AppText>
          </>
        )}
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="heading">Primeros pasos</AppText>
          <AppText variant="label" color="primary">
            {completed} de {firstSteps.length}
          </AppText>
        </View>
        <ProgressBar value={completed / firstSteps.length} label="Progreso de primeros pasos" />
        <View>
          {firstSteps.map((step) => (
            <Pressable
              key={step.title}
              accessibilityRole={step.href && !step.done ? 'button' : undefined}
              disabled={!step.href || step.done}
              onPress={() => step.href && router.push(step.href)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                minHeight: 48,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Icon name={step.done ? 'check' : 'pending'} color={step.done ? 'primary' : 'textSubtle'} size={22} />
              <AppText color={step.done ? 'textMuted' : 'text'} style={{ flex: 1 }}>
                {step.title}
              </AppText>
              {step.href && !step.done ? <Icon name="chevronRight" size={20} color="textSubtle" /> : null}
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <AppText variant="heading">Herramientas</AppText>
        <NavRow
          icon="simulator"
          title="Simulador"
          subtitle="Compara ahorrar, financiar o combinar ambos"
          onPress={() => router.push('/simulator')}
        />
        <NavRow icon="debt" title="Deudas" subtitle="Saldos, cuotas y pagos" badge="Pronto" onPress={() => router.push('/debts')} />
      </Card>

      <View
        style={{
          flexDirection: 'row',
          gap: spacing.md,
          padding: spacing.lg,
          borderRadius: radius.lg,
          backgroundColor: colors.primarySoft,
        }}
      >
        <Icon name="shield" color="primary" size={20} />
        <AppText variant="caption" color="textMuted" style={{ flex: 1 }}>
          ASCENDX AI es una herramienta educativa de apoyo a tus decisiones. No reemplaza la asesoría financiera
          profesional.
        </AppText>
      </View>
    </Screen>
  );
}
