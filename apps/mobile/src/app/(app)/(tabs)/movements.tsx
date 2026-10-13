import { AppText, ComingSoon, Screen } from '@/components/ui';

/** Fase 3 (sprints 5–8): RF-07 a RF-10. */
export default function MovementsScreen() {
  return (
    <Screen scroll>
      <AppText variant="title" accessibilityRole="header">
        Movimientos
      </AppText>
      <ComingSoon
        icon="movements"
        title="Tu historial de ingresos y gastos"
        description="Se construye en la fase 3 del cronograma (núcleo financiero, meses 3 y 4)."
        features={[
          'Ingresos, gastos, pagos de deuda y aportes o retiros de metas (RF-07)',
          'Historial con filtros por mes, tipo y categoría, y totales del filtro (RF-08)',
          'Aviso de posible duplicado antes de guardar (RF-09)',
          'Categorías por defecto y personalizadas (RF-10)',
        ]}
      />
    </Screen>
  );
}
