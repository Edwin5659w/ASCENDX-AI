import { ComingSoon, Header, Screen } from '@/components/ui';

/** Fase 3: RF-11 y RF-12. */
export default function DebtsScreen() {
  return (
    <Screen scroll edges={['top', 'bottom']}>
      <Header title="Deudas" />
      <ComingSoon
        icon="debt"
        title="Tus deudas, claras"
        description="Se construye en la fase 3 del cronograma (núcleo financiero)."
        features={[
          'Acreedor, monto, saldo, tasa (E.A. o M.V.), cuota, plazo y día de pago (RF-11)',
          'Pagos que reducen el saldo; la deuda pasa a «pagada» al llegar a cero (RF-12)',
          'Carga de deuda con referencia educativa: verde, amarillo o rojo',
        ]}
      />
    </Screen>
  );
}
