import { router } from 'expo-router';
import { useEffect } from 'react';
import { AppState, Pressable, View } from 'react-native';
import { AppText, Icon } from '@/components/ui';
import { apiRequest } from '@/lib/api';
import { syncOutbox, useOutbox } from '@/lib/outbox';
import { getAccounts, getCategories } from '@/features/finance/api';
import { invalidate, prefetch } from '@/lib/query';
import { useTheme } from '@/theme/useTheme';

const RETRY_MS = 30_000;

/**
 * Se monta una vez con la sesión iniciada:
 * - crea los movimientos recurrentes vencidos (RF-30);
 * - envía la cola sin conexión al abrir la app, al volver a ella y cada 30 s
 *   mientras haya pendientes (RF-29).
 */
export function SyncManager() {
  const items = useOutbox();
  const pending = items.some((item) => item.status === 'pendiente');

  useEffect(() => {
    apiRequest<{ created: number }>('/recurring/run', { method: 'POST', auth: true })
      .then(({ created }) => {
        if (created) invalidate('dashboard', 'transactions', 'accounts');
      })
      .catch(() => undefined);
    syncOutbox().catch(() => undefined);
    // Quedan guardadas en el teléfono para el formulario sin conexión.
    prefetch('categories', getCategories);
    prefetch('accounts', getAccounts);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncOutbox().catch(() => undefined);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(() => syncOutbox().catch(() => undefined), RETRY_MS);
    return () => clearInterval(timer);
  }, [pending]);

  return null;
}

/** Aviso para el panel y el historial cuando hay movimientos sin enviar. */
export function PendingSyncBanner() {
  const items = useOutbox();
  const { colors, radius, spacing } = useTheme();
  if (!items.length) return null;
  const review = items.some((item) => item.status !== 'pendiente');
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push('/sync')}
      style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', padding: spacing.md, borderRadius: radius.md, backgroundColor: review ? colors.warningSoft : colors.surfaceAlt }}
    >
      <Icon name={review ? 'warning' : 'sync'} color={review ? 'warning' : 'textMuted'} size={18} />
      <View style={{ flex: 1 }}>
        <AppText variant="caption">
          {review
            ? 'Hay movimientos sin conexión que necesitan tu revisión.'
            : items.length === 1 ? '1 movimiento guardado en el teléfono, pendiente de enviar.' : `${items.length} movimientos guardados en el teléfono, pendientes de enviar.`}
        </AppText>
      </View>
      <Icon name="chevronRight" color="textSubtle" size={18} />
    </Pressable>
  );
}
