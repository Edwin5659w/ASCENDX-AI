import { router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';
import { AppText, Card, Icon, ProgressBar, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { firstName } from '@/lib/format';
import { useTheme } from '@/theme/useTheme';

/**
 * Primeros pasos: gamificación discreta que premia hábitos útiles.
 * Por ahora solo "crear cuenta" se puede verificar; los demás pasos se
 * marcarán cuando existan los módulos de movimientos y metas.
 */
const FIRST_STEPS: { title: string; done: boolean; href?: Href }[] = [
  { title: 'Crear tu cuenta', done: true },
  { title: 'Registrar tu primer movimiento', done: false, href: '/movements' },
  { title: 'Crear tu primera meta', done: false, href: '/goals' },
  { title: 'Comparar ahorrar vs financiar', done: false, href: '/simulator' },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const { colors, spacing } = useTheme();
  const completed = FIRST_STEPS.filter((step) => step.done).length;

  return (
    <Screen scroll>
      <View style={{ gap: spacing.xs }}>
        <AppText color="textMuted">Hola, {user ? firstName(user.fullName) : ''}</AppText>
        <AppText variant="title">Tu panel financiero</AppText>
      </View>

      <Card>
        <AppText variant="overline" color="textMuted">
          Disponible este mes
        </AppText>
        <AppText variant="amount" color="textSubtle">
          —
        </AppText>
        <AppText variant="caption" color="textMuted">
          Cuando registres tus ingresos y gastos verás aquí tu saldo del mes, tu capacidad de ahorro y cómo cambian.
        </AppText>
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="heading">Primeros pasos</AppText>
          <AppText variant="caption" color="primary">
            {completed} de {FIRST_STEPS.length}
          </AppText>
        </View>
        <ProgressBar value={completed / FIRST_STEPS.length} label="Progreso de primeros pasos" />
        <View style={{ gap: spacing.xs }}>
          {FIRST_STEPS.map((step) => (
            <Pressable
              key={step.title}
              disabled={!step.href}
              onPress={() => step.href && router.navigate(step.href)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                paddingVertical: spacing.sm,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Icon name={step.done ? 'check' : 'pending'} color={step.done ? 'primary' : 'textSubtle'} size={20} />
              <AppText color={step.done ? 'textMuted' : 'text'} style={{ flex: 1 }}>
                {step.title}
              </AppText>
            </Pressable>
          ))}
        </View>
      </Card>

      <View
        style={{
          flexDirection: 'row',
          gap: spacing.md,
          padding: spacing.lg,
          borderRadius: 14,
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
