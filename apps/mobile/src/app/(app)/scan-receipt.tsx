import { ComingSoon, Header, Screen } from '@/components/ui';

/** RF-28 (fase 4). */
export default function ScanReceiptScreen() {
  return (
    <Screen scroll edges={['top', 'bottom']}>
      <Header title="Escanear recibo" />
      <ComingSoon icon="camera" title="Lectura de recibos" description="En construcción." features={['Leer total, fecha y comercio', 'Revisar antes de guardar']} />
    </Screen>
  );
}
