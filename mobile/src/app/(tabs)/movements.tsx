import { AppText, ComingSoon, Screen } from '@/components/ui';

export default function MovementsScreen() {
  return (
    <Screen scroll>
      <AppText variant="title">Movimientos</AppText>
      <ComingSoon
        icon="movements"
        title="Registra ingresos, gastos y deudas"
        description="Este módulo se construye en la etapa del núcleo financiero (meses 3–4)."
        features={[
          'Registro manual con fecha, monto, categoría y descripción',
          'Categorías editables e historial por mes',
          'Deudas con saldo, tasa, cuota y día de pago',
          'Lectura de recibos con la cámara (OCR) y revisión antes de guardar',
        ]}
      />
    </Screen>
  );
}
