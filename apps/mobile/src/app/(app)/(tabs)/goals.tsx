import { AppText, ComingSoon, Screen } from '@/components/ui';

/** Fase 3 (sprints 5–8): RF-16 a RF-19. El cálculo ya está en finance-core (allocateGoals). */
export default function GoalsScreen() {
  return (
    <Screen scroll>
      <AppText variant="title" accessibilityRole="header">
        Metas
      </AppText>
      <ComingSoon
        icon="goals"
        title="Varias metas, un solo plan"
        description="Tu ahorro prudente se reparte por prioridad y fecha. Se construye en la fase 3 del cronograma."
        features={[
          'Metas con valor, fecha, prioridad (alta, media, baja) e ícono (RF-16)',
          'Aportes y retiros sin dejar una meta en negativo (RF-17)',
          'Progreso, hitos de 25, 50, 75 y 100 % y fecha proyectada (RF-18)',
          'Alerta de meta en riesgo con dos sugerencias calculadas (RF-19)',
        ]}
      />
    </Screen>
  );
}
