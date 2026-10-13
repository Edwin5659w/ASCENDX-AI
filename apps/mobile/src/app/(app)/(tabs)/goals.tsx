import { router } from 'expo-router';
import { View } from 'react-native';
import { AppText, Button, Card, Icon, ProgressRing, Screen } from '@/components/ui';
import { useTheme } from '@/theme/useTheme';

const HOW_IT_WILL_WORK = [
  'Cada meta con nombre, ícono, valor objetivo, fecha y prioridad (RF-16)',
  'Aportes y retiros, sin dejar una meta en negativo (RF-17)',
  'Fecha estimada y aporte mensual previsto según tu capacidad prudente (RF-18)',
  'Aviso de meta en riesgo con dos ajustes posibles: nueva fecha o nuevo aporte (RF-19)',
];

/**
 * Metas (sección 15.5). Estado vacío mientras se construye el módulo de
 * metas (fase 3): explica cómo se verán y cómo se medirán, sin datos ficticios.
 */
export default function GoalsScreen() {
  const { spacing } = useTheme();
  return (
    <Screen scroll>
      <AppText variant="title" accessibilityRole="header">
        Metas
      </AppText>

      <Card elevated>
        <View style={{ alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.md }}>
          <ProgressRing
            value={0}
            size={148}
            strokeWidth={12}
            milestones={[0.25, 0.5, 0.75]}
            accessibilityLabel="Ilustración de progreso de una meta con hitos de 25, 50 y 75 por ciento"
          >
            <AppText variant="caption" color="textMuted" align="center">
              Hitos
            </AppText>
            <AppText variant="label" align="center">
              25 · 50 · 75 · 100 %
            </AppText>
          </ProgressRing>
          <View style={{ gap: spacing.sm }}>
            <AppText variant="heading" align="center">
              Construye tus metas paso a paso
            </AppText>
            <AppText color="textMuted" align="center">
              Moto, computador, viaje o fondo de emergencia: tu ahorro prudente se reparte primero en lo más importante y
              en lo más cercano.
            </AppText>
          </View>
        </View>
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Icon name="info" color="primary" size={20} />
          <AppText variant="heading">En desarrollo · fase 3</AppText>
        </View>
        <View style={{ gap: spacing.md }}>
          {HOW_IT_WILL_WORK.map((item) => (
            <View key={item} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
              <Icon name="pending" size={18} color="textSubtle" />
              <AppText variant="caption" color="textMuted" style={{ flex: 1 }}>
                {item}
              </AppText>
            </View>
          ))}
        </View>
        <AppText variant="caption" color="textMuted">
          Las reglas de cálculo ya están implementadas y probadas; falta la pantalla y el registro de metas.
        </AppText>
      </Card>

      <Button title="Mientras tanto, simula una compra" variant="secondary" onPress={() => router.push('/simulator')} />
    </Screen>
  );
}
