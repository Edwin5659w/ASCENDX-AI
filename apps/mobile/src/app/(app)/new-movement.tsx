import { router } from 'expo-router';
import { Button, ComingSoon, Header, Screen } from '@/components/ui';

/** Botón (+) de la navegación. Fase 3: RF-07 y RF-09; fase 4/5: OCR (RF-28). */
export default function NewMovementScreen() {
  return (
    <Screen scroll edges={['top', 'bottom']}>
      <Header title="Nuevo movimiento" />
      <ComingSoon
        icon="add"
        title="Registrar en segundos"
        description="El formulario de movimientos llega en la fase 3; el escaneo de recibos, después del núcleo."
        features={[
          'Tipo, monto, fecha y categoría obligatorios; montos en pesos enteros',
          'Aviso de posible duplicado (mismo monto, tipo y categoría en menos de 2 minutos)',
          'Escanear un recibo y revisar los datos antes de guardar (P2)',
        ]}
      />
      <Button title="Volver" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
