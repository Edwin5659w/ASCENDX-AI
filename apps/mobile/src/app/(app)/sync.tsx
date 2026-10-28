import { useState } from 'react';
import { View } from 'react-native';
import { AppText, Button, Card, EmptyView, Header, Icon, Screen } from '@/components/ui';
import { confirmMovement, discardMovement, syncOutbox, useOutbox } from '@/lib/outbox';
import { useTheme } from '@/theme/useTheme';

/** RF-29: movimientos guardados sin conexión, esperando para enviarse. */
export default function SyncScreen() {
  const { spacing } = useTheme();
  const items = useOutbox();
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function sync() {
    setSyncing(true);
    setMessage(null);
    const result = await syncOutbox();
    setSyncing(false);
    setMessage(result.offline ? 'Aún no hay conexión. Lo intentaremos de nuevo automáticamente.' : result.sent ? (result.sent === 1 ? 'Se envió 1 movimiento.' : `Se enviaron ${result.sent} movimientos.`) : null);
  }

  return (
    <Screen scroll edges={['top', 'bottom']} animateIn={false}>
      <Header title="Pendientes de sincronizar" />
      {items.length === 0 ? (
        <EmptyView icon="check" title="Todo está al día" description="Los movimientos que registres sin conexión aparecerán aquí hasta que se envíen." />
      ) : (
        <>
          <AppText color="textMuted">
            Se guardaron en tu teléfono y se envían solos cuando vuelve la conexión. Cada uno se guarda una sola vez, aunque se reintente.
          </AppText>
          {items.map((item) => (
            <Card key={item.clientOpId}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Icon name={item.status === 'pendiente' ? 'sync' : 'warning'} color={item.status === 'pendiente' ? 'textMuted' : 'warning'} />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyStrong">{item.label}</AppText>
                  <AppText variant="caption" color="textMuted">
                    {item.status === 'pendiente' ? `Fecha ${item.body.date} · esperando conexión` : item.message}
                  </AppText>
                </View>
              </View>
              {item.status === 'revisar' ? (
                <Button title="Guardar de todas formas" onPress={() => confirmMovement(item.clientOpId)} />
              ) : null}
              {item.status !== 'pendiente' ? (
                <Button title="Descartar" variant="ghost" onPress={() => discardMovement(item.clientOpId)} />
              ) : null}
            </Card>
          ))}
          <Button title="Sincronizar ahora" onPress={sync} loading={syncing} />
        </>
      )}
      {message ? <AppText color="textMuted">{message}</AppText> : null}
    </Screen>
  );
}
